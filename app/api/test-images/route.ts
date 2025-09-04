import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test with a simple query that should return results
    const testQuery = "human heart";
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(testQuery)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=800&uselang=en`;
    
    console.log("Testing Wikimedia API with URL:", url);
    
    const response = await fetch(url, {
      headers: { "User-Agent": "DoubtSolverAI/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Wikimedia API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Wikimedia API test response:", JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      success: true,
      query: testQuery,
      response: data,
      hasResults: !!data.query?.pages,
      resultCount: data.query?.pages ? Object.keys(data.query.pages).length : 0
    });
    
  } catch (error) {
    console.error("Error testing Wikimedia API:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

