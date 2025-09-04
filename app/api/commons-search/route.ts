import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache (6 hours)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_MS = 6 * 60 * 60 * 1000;

type WikimediaImage = {
	title: string;
	thumbUrl: string;
	fullUrl: string;
	mime: string;
	author: string;
	license: string;
	licenseUrl: string;
};

function cleanCache() {
	const now = Date.now();
	const keysToDelete: string[] = [];
	
	cache.forEach((value, key) => {
		if (now - value.ts > CACHE_MS) {
			keysToDelete.push(key);
		}
	});
	
	keysToDelete.forEach(key => cache.delete(key));
}

function extractMetadata(extmeta: any) {
	const author = extmeta?.Artist?.value || extmeta?.Author?.value || extmeta?.Creator?.value || "Unknown";
	const license = extmeta?.License?.value || extmeta?.Copyright?.value || "Unknown license";
	let licenseUrl = "";
	if (extmeta?.License_url?.value) licenseUrl = extmeta.License_url.value;
	return { author, license, licenseUrl };
}

async function queryCommons(rawQuery: string) {
	// Prefer actual image files (bitmaps/drawings) and avoid document formats like PDF/DjVu
	// Wikimedia CirrusSearch supports filetype/filemime filters
	let search = rawQuery.trim();
	const hasFileFilter = /\bfiletype:|\bfilemime:/i.test(search);
	if (!hasFileFilter) {
		// Bias towards images, exclude common non-image media
		search += " filetype:bitmap|drawing -filemime:pdf -filemime:application/pdf -filemime:djvu";
	}

	const params = new URLSearchParams({
		action: "query",
		format: "json",
		origin: "*",
		generator: "search",
		gsrsearch: search,
		gsrnamespace: "6",
		gsrlimit: "50",
		prop: "imageinfo",
		iiprop: "url|mime|extmetadata",
		iiurlwidth: "800",
		uselang: "en",
	});

	const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
	const res = await fetch(url, {
		headers: { "User-Agent": "DoubtSolverAI/1.0" },
		signal: AbortSignal.timeout(12000),
	});
	if (!res.ok) throw new Error(`Wikimedia API error: ${res.status}`);
	return res.json();
}

async function getGeminiImageQuery(request: NextRequest, question: string): Promise<string | null> {
	try {
		const base = new URL(request.url).origin;
		const askUrl = `${base}/api/ask`;
		if (!askUrl) return null;
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), 7000);
		const res = await fetch(askUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ question }),
			signal: controller.signal,
		});
		clearTimeout(id);
		if (!res.ok) return null;
		const data = await res.json().catch(() => null);
		const iq = data?.image_query;
		if (typeof iq === "string" && iq.trim().length > 1) return iq.trim();
		return null;
	} catch {
		return null;
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("query") || searchParams.get("q");
		if (!query) {
			return NextResponse.json(
				{ error: 'Query parameter "query" or "q" is required' },
				{ status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
			);
		}

		cleanCache();
		const key = `v1:${query.toLowerCase().trim()}`;
		const cached = cache.get(key);
		if (cached && Date.now() - cached.ts < CACHE_MS) {
			return NextResponse.json(cached.data, { headers: { "Access-Control-Allow-Origin": "*" } });
		}

		// Try to refine with Gemini's image_query if available
		let effectiveQuery = query;
		const geminiQuery = await getGeminiImageQuery(request, query);
		if (geminiQuery) {
			console.log(`Using Gemini image_query: "${geminiQuery}" (from question: "${query}")`);
			effectiveQuery = geminiQuery;
		}

		// Build candidate queries list: full query plus comma-separated parts
		const candidateQueries: string[] = [];
		candidateQueries.push(effectiveQuery);
		const parts = effectiveQuery.split(",").map(s => s.trim()).filter(Boolean);
		for (const part of parts) {
			if (!candidateQueries.includes(part)) candidateQueries.push(part);
		}

		// Prepare keywords for relevance scoring
		const stop = new Set([
			"the","a","an","and","or","of","in","on","for","to","with","by","as","at","is","are",
			"this","that","these","those","from","into","about","over","under","between","through","via",
			"black","holes","hole" // keep domain words but also allow scoring on them
		]);
		const rawTokens = effectiveQuery.toLowerCase().split(/[\s,]+/g).map(s=>s.trim()).filter(Boolean);
		const keywords = Array.from(new Set(rawTokens.filter(w => w.length > 2)));

		let pages: any[] = [];
		let images: WikimediaImage[] = [];
		const candidates: { img: WikimediaImage; score: number }[] = [];

		for (const cq of candidateQueries) {
			if (images.length >= 8) break;
			console.log(`Searching Wikimedia Commons for: "${cq}"`);
			let data = await queryCommons(cq);
			console.log("Search result:", JSON.stringify(data, null, 2));
			const candidatePages = Object.values(data.query?.pages || {}) as any[];
			pages = pages.concat(candidatePages);

			for (const p of candidatePages) {
				if (images.length >= 8) break;
				const info = p.imageinfo?.[0];
				if (!info) continue;
				const mime = info.mime || "";
				if (!mime.startsWith("image/")) continue;
				const { author, license, licenseUrl } = extractMetadata(info.extmetadata);
				const item: WikimediaImage = {
					title: String(p.title || "").replace(/^File:/, ""),
					thumbUrl: info.thumburl || info.url,
					fullUrl: info.url,
					mime,
					author,
					license,
					licenseUrl,
				};
				if (!images.some(x => x.fullUrl === item.fullUrl)) {
					const desc: string = String(info.extmetadata?.ImageDescription?.value || "");
					const hay = (item.title + " " + desc).toLowerCase();
					let score = 0;
					for (const k of keywords) {
						if (k && hay.includes(k)) score += 1;
					}
					candidates.push({ img: item, score });
					images.push(item);
				}
			}
		}

		// Retry with a diagram-focused expansion if we still have no images
		if (images.length === 0) {
			const expanded = `${effectiveQuery} (diagram OR schematic OR illustration)`;
			console.log(`No images after first pass. Retrying with expanded query: "${expanded}"`);
			const data2 = await queryCommons(expanded);
			pages = Object.values(data2.query?.pages || {}) as any[];
			for (const p of pages) {
				if (images.length >= 8) break;
				const info = p.imageinfo?.[0];
				if (!info) continue;
				const mime = info.mime || "";
				if (!mime.startsWith("image/")) continue;
				const { author, license, licenseUrl } = extractMetadata(info.extmetadata);
				const item: WikimediaImage = {
					title: String(p.title || "").replace(/^File:/, ""),
					thumbUrl: info.thumburl || info.url,
					fullUrl: info.url,
					mime,
					author,
					license,
					licenseUrl,
				};
				if (!images.some(x => x.fullUrl === item.fullUrl)) {
					const desc: string = String(info.extmetadata?.ImageDescription?.value || "");
					const hay = (item.title + " " + desc).toLowerCase();
					let score = 0;
					for (const k of keywords) {
						if (k && hay.includes(k)) score += 1;
					}
					candidates.push({ img: item, score });
					images.push(item);
				}
			}
		}

		// Rank candidates by score and return the top 8 unique images
		candidates.sort((a, b) => b.score - a.score);
		const ranked: WikimediaImage[] = [];
		for (const c of candidates) {
			if (ranked.length >= 8) break;
			if (!ranked.some(x => x.fullUrl === c.img.fullUrl)) ranked.push(c.img);
		}
		const finalImages = ranked.length > 0 ? ranked : images.slice(0, 8);

		const result = { query, images: finalImages, total: finalImages.length, ts: new Date().toISOString() };
		console.log(`Final result: ${images.length} images for query "${query}"`);
		console.log("Image URLs:", images.map(img => ({ title: img.title, thumbUrl: img.thumbUrl, fullUrl: img.fullUrl })));
		
		cache.set(key, { data: result, ts: Date.now() });
		return NextResponse.json(result, { headers: { "Access-Control-Allow-Origin": "*" } });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch diagrams", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}


