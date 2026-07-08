# InvestorAI

InvestorAI is an autonomous, multi-agent AI research platform designed for institutional-grade due diligence. Instead of relying on keyword searches or stale databases, InvestorAI deploys specialized AI sub-agents in parallel to live-scrape the web, synthesize financial data, analyze market sentiment, and evaluate competitive moats — culminating in a high-conviction investment verdict.

Built for the **InsideIIM × Altuni AI Labs** assignment.

---

## 🚀 Overview

The platform acts as a senior financial analyst. When a user inputs a company name (e.g., "NVIDIA"), the system:
1. **Identifies and Profiles** the corporate entity.
2. **Runs Parallel Research** across three distinct domains:
   - **Deep Financials**: Analyzes revenue, margins, valuation ratios, and risks.
   - **Market Sentiment**: Scrapes real-time headlines and computes a sentiment score.
   - **Industry Moats**: Evaluates the competitive landscape and structural advantages.
3. **Synthesizes a Verdict**: A master decision-agent reviews the parallel reports, weighs the bull/bear cases, and delivers a final conviction score (INVEST / WATCH / PASS).

---

## 🛠️ How to Run It

### 1. Prerequisites
- Node.js (v18+)
- A [Groq API Key](https://console.groq.com/keys) (for the LLM)
- A [Tavily API Key](https://tavily.com/) (for web search/scraping)

### 2. Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/Aadi-110i/InvestorAI.git
cd InvestorAI
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add your keys:
```env
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧠 How It Works (Architecture)

**Tech Stack:** Next.js (React 18, App Router), LangChain/LangGraph, Groq (Llama-3.3-70b-versatile), Tavily Search, Framer Motion, Vanilla CSS.

**The Multi-Agent Workflow (LangGraph):**
The core intelligence is driven by a `StateGraph` (located in `src/lib/agent/graph.ts`). 
1. **Entry Node (`companyIdentification`)**: Gathers baseline company info.
2. **Parallel Execution (Conditional Edges)**: Once profiling is done, the graph branches out. The `financialAnalysis`, `newsSentiment`, and `industryCompetitors` nodes run *simultaneously*, drastically reducing overall wait time.
3. **Convergence (`investmentDecision`)**: The graph waits for all three parallel nodes to finish. The master agent then consumes the aggregated state (financials, news, industry data) and outputs the final verdict.
4. **Robust JSON Parsing**: A custom `parseJSON` utility ensures that LLM outputs (which sometimes include markdown fences or trailing prose) are safely strictly cast into TypeScript interfaces, preventing UI crashes.

---

## ⚖️ Key Decisions & Trade-Offs

**1. Vanilla CSS over Tailwind:**
*Decision:* We used vanilla CSS (`globals.css`) with custom CSS variables.
*Why:* To create a highly bespoke, premium "institutional dashboard" aesthetic with glassmorphism, precise 3D tilt effects (`TiltCard`), and intricate grid layouts without cluttering JSX with utility classes.

**2. Llama-3.3-70b-versatile via Groq:**
*Decision:* Chose Groq's Llama 3 API over OpenAI GPT-4o.
*Why:* Groq's LPU architecture provides blazing fast token generation. Because we are running 4-5 heavy research prompts per query, using Groq reduces research time from ~30 seconds down to ~8 seconds.

**3. Stateless Architecture (Left out a Database):**
*Decision:* No PostgreSQL or MongoDB was integrated.
*Why:* The core mandate was an AI Agent assignment. Adding user authentication and saved-search history would bloat the codebase without demonstrating extra LLM capability. Vercel handles the API routing statelessly (`force-dynamic`).

**4. Graceful Degradation over Hard Failures:**
*Decision:* Instructed the LLMs to fall back on their internal training weights if live search results from Tavily were sparse.
*Why:* Prevents a total failure of the dashboard if a company doesn't have breaking news in the last 24 hours.

---

## 📊 Example Runs

1. **NVIDIA (NVDA)**
   - **Verdict:** INVEST
   - **Insights:** The agent correctly identifies their massive >100% YoY revenue growth and dominant Moat Rating ("Wide"). The Bear case smartly highlights the high P/E ratio and reliance on hyperscaler capex.

2. **Intel (INTC)**
   - **Verdict:** WATCH / PASS
   - **Insights:** The agent catches the declining market share in foundries, negative sentiment from recent earnings misses, and aggressive competitive threats from AMD and ARM architecture.

3. **Tesla (TSLA)**
   - **Verdict:** WATCH
   - **Insights:** Mixed sentiment. The agent highlights the strong brand and EV infrastructure moat, but penalizes the score based on compressing automotive margins and high valuation relative to pure-play auto competitors.

---

## 🔮 What We Would Improve With More Time

1. **Financial API Integration:** While Tavily is great for web scraping, integrating a dedicated financial data API (like Alpha Vantage or Yahoo Finance) would provide strictly accurate trailing twelve-month (TTM) metrics rather than relying on the LLM to extract numbers from search snippets.
2. **Streaming UI (`useStream`):** Currently, the UI waits for the entire LangGraph execution to finish before showing the dashboard. Streaming the LangGraph state back to the client in real-time (showing a live checklist of "Scraping SEC filings...", "Analyzing Sentiment...") would drastically improve UX.
3. **PDF Export Functionality:** The "Export PDF" button currently just triggers an alert. We would use `jspdf` and `html2canvas` to generate a downloadable tear sheet for the analyst.

---

## 🏆 BONUS: LLM Chat Logs Included!

As requested for bonus points, **the entire LLM chat session transcript that built this project has been included.** 

You can find the raw JSONL transcript file at the root of this repository:
👉 `LLM_CHAT_LOGS.jsonl`

This file details every step of the agentic coding process, the thought process behind the UI implementations, debugging the Vercel deployment, and writing the robust JSON parsing fallbacks.
