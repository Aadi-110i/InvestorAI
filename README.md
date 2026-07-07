# InvestorAI — AI Investment Research Agent

This is a full-stack AI-powered investment research agent that takes a company name, performs multi-dimensional research using LangGraph and GPT-4o, and delivers a structured Invest/Pass/Watch recommendation.

## Overview
Built for the InsideIIM Altuni AI Labs take-home assignment.

Features:
- **Multi-Node Agent Graph**: Uses LangGraph.js to orchestrate parallel research tasks.
- **Real-Time Web Search**: Uses Tavily API to fetch real-time financial data, news, and competitor information.
- **Streaming UI**: Uses Server-Sent Events (SSE) to stream the agent's progress to the frontend in real-time.
- **Premium Design**: Built with Next.js App Router and Vanilla CSS (dark theme, glassmorphism, animations).

## How to Run It

### 1. Prerequisites
- Node.js (v18+)
- OpenAI API Key (`OPENAI_API_KEY`)
- Tavily API Key (`TAVILY_API_KEY`)

### 2. Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key
TAVILY_API_KEY=your_tavily_api_key
```

### 3. Run
Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How it Works (Architecture)

1. **User Input**: User enters a company name in the UI.
2. **Streaming API**: The frontend sends a POST request to `/api/research`.
3. **LangGraph Execution**:
   - `companyIdentification`: Resolves the company name to basic info.
   - **Parallel Execution**: `financialAnalysis`, `newsSentiment`, and `industryCompetitors` run concurrently to gather data.
   - `investmentDecision`: Synthesizes all data to make a final Invest/Pass/Watch recommendation.
4. **Real-time Updates**: As each node completes, the backend streams a `node_complete` event with the parsed JSON data.
5. **Dynamic UI**: The frontend updates the timeline and renders glassmorphism cards for each research section as data arrives.

## Key Decisions & Trade-offs

- **Next.js App Router**: Chosen for seamless full-stack development. API routes easily support SSE streaming.
- **Vanilla CSS**: Used to create a highly custom, premium design without the overhead or specific aesthetics of Tailwind.
- **LangGraph over simple chains**: Allows for parallel execution (financials, news, industry all run at once), speeding up the research process significantly.
- **Tavily Search**: Chosen over basic SerpAPI because Tavily is specifically optimized for LLM agents, returning cleaner, more structured content.
- **Stateless Design**: No database is used. Each research session is self-contained. Trade-off: No history of past searches.

## Example Runs
*(You can test these once the app is running)*
- **Apple (AAPL)**: Typically yields an "INVEST" or "WATCH" depending on current valuation and news cycle.
- **Tesla (TSLA)**: Often yields a "WATCH" due to high volatility and mixed sentiment.
- **WeWork (WE)**: Yields a strong "PASS".

## What I would improve with more time
1. **Caching**: Cache Tavily search results and LLM outputs for a few hours to save API costs and speed up repeat queries.
2. **More Data Sources**: Integrate Yahoo Finance API or Alpha Vantage for hard financial metrics instead of relying solely on LLM extraction from web search.
3. **PDF Generation**: Add a button to export the final research report as a PDF.
4. **User Accounts & History**: Add authentication and a database (e.g., Supabase) to save past reports.
