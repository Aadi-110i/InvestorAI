import { TavilySearch as TavilySearchResults } from '@langchain/tavily';
import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { FinancialAnalysis } from '../../types';

const llm = new ChatGroq({ apiKey: process.env.GROQ_API_KEY || 'dummy', model: 'llama-3.3-70b-versatile', temperature: 0.2 });
const searchTool = new TavilySearchResults({ maxResults: 10 });

export async function financialAnalysis(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  try {
    const searchResults = await searchTool.invoke({ query: `${state.companyName} financial results revenue profit earnings P/E ratio 2024 2025` });
    const resultsText = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);
    
    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a financial research analyst. Extract financial information from the search results and return ONLY valid JSON matching this exact structure (no markdown, no code fences):
{"revenue": "...", "revenueGrowth": "...", "netIncome": "...", "profitMargin": "...", "peRatio": "...", "debtToEquity": "...", "currentRatio": "...", "freeCashFlow": "...", "roe": "...", "highlights": ["...", "..."], "risks": ["...", "..."], "score": 8}
Fill in all fields. If specific data is not found in the search results, YOU MUST USE YOUR INTERNAL KNOWLEDGE BASE to estimate or provide the most recently known accurate data for the company. ONLY use "N/A" if the metric is completely inapplicable. Ensure highlights and risks are arrays of strings. Score should be a number from 1 to 10 based on financial health.`
      },
      {
        role: 'user',
        content: `Company to research: ${state.companyName}\n\nSearch results:\n${resultsText}`
      }
    ]);
    
    const content = typeof response.content === 'string' ? response.content : '';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const financialAnalysis: FinancialAnalysis = JSON.parse(cleaned);
    return { financialAnalysis };
  } catch (error) {
    console.error('Financial analysis error:', error);
    return {
      financialAnalysis: {
        revenue: 'N/A', revenueGrowth: 'N/A', netIncome: 'N/A',
        profitMargin: 'N/A', peRatio: 'N/A', debtToEquity: 'N/A',
        currentRatio: 'N/A', freeCashFlow: 'N/A', roe: 'N/A',
        highlights: [], risks: ['Failed to retrieve financial data.'],
        score: 5
      },
      errors: [`Financial analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
