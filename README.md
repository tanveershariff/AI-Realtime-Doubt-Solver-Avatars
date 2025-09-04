# DoubtSolver AI

An AI-powered educational platform that helps students solve doubts using an interactive avatar powered by HeyGen and Google Gemini Pro, with dynamic diagrams from Wikimedia Commons.

## Features

- 🎤 **Voice & Text Input**: Ask questions naturally through voice or text
- 👨‍🏫 **Interactive AI Avatar**: Learn from a friendly AI teacher powered by Interactive Avatar generation Platforms like (Heygen, Synthesia, Akool) (Most of them are usually Paid) 
- 📝 **Step-by-Step Solutions**: Get detailed explanations with proper math formatting
- 🧮 **LaTeX Math Support**: Beautiful rendering of mathematical equations
- 📊 **Dynamic Diagrams**: Real-time educational diagrams from Wikimedia Commons
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), TypeScript, Tailwind CSS
- **AI Model**: Google Gemini Pro API
- **Avatar**: HeyGen Interactive Avatar SDK
- **Math Rendering**: KaTeX
- **Voice Input**: Web Speech API
- **Diagrams**: Wikimedia Commons API

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# HeyGen API Configuration
HEYGEN_API_KEY=your_heygen_api_key_here
NEXT_PUBLIC_BASE_API_URL=https://api.heygen.com

# Google Gemini Pro API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get API Keys

#### HeyGen API Key
1. Sign up at [HeyGen](https://www.heygen.com/)
2. Navigate to your account settings
3. Generate an API key

#### Google Gemini Pro API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini Pro

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Landing Page**: Visit the home page to learn about the features
2. **Start Learning**: Click "Try Now" to access the doubt solver workspace
3. **Ask Questions**: Use voice or text input to ask your educational doubts
4. **Get Answers**: Watch the AI avatar explain concepts while reading detailed solutions
5. **View Diagrams**: See relevant educational diagrams automatically fetched from Wikimedia Commons

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page
│   ├── solver/
│   │   └── page.tsx          # Main doubt solver workspace
│   ├── test-diagrams/
│   │   └── page.tsx          # Test page for diagram functionality
│   └── api/
│       ├── ask/              # Gemini Pro API integration
│       ├── get-access-token/ # HeyGen token generation
│       └── commons-search/   # Wikimedia Commons API integration
├── components/
│   ├── DoubtSolverWorkspace.tsx  # Main workspace component
│   ├── ExplanationPanel.tsx      # Math/formatted explanation renderer
│   ├── DiagramPanel.tsx          # Wikimedia Commons diagram display
│   └── ...                     # Other UI components
└── ...
```

## How It Works

1. **Question Input**: Students can ask questions via voice or text
2. **AI Processing**: Questions are sent to Google Gemini Pro for analysis
3. **Response Generation**: Gemini creates both a conversational script and detailed explanation
4. **Avatar Response**: The conversational script is sent to HeyGen for avatar speech
5. **Explanation Display**: The detailed explanation is rendered with math formatting
6. **Diagram Fetching**: Key terms are extracted and used to search Wikimedia Commons for relevant diagrams
7. **Visual Learning**: Students see educational diagrams with proper attribution

## Wikimedia Commons Integration

The app automatically fetches relevant educational diagrams from Wikimedia Commons:

- **Smart Query Extraction**: Key terms are extracted from questions and explanations
- **Caching**: API responses are cached for 6 hours to improve performance
- **Attribution**: All diagrams display proper author and license information
- **Multiple Formats**: Prefers SVG diagrams, falls back to PNG/JPEG
- **Responsive Design**: Diagrams work well on all device sizes

### Testing Diagrams

Visit `/test-diagrams` to test the Wikimedia Commons integration with sample queries.

## Performance Features

- **Server-side Caching**: Wikimedia Commons API responses cached for 6 hours
- **Debounced Search**: Diagram searches are debounced to avoid excessive API calls
- **Image Optimization**: Uses Wikimedia thumbnails for fast loading
- **Error Handling**: Graceful fallbacks when diagrams aren't available

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License.
