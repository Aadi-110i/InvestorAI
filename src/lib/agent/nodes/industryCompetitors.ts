import { TavilySearch as TavilySearchResults } from '@langchain/tavily';
import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { IndustryAnalysis } from '../../types';

const llm = new ChatGroq({ apiKey: process.env.GROQ_API_KEY || 'dummy', model: 'llama-3.3-70b-versatile', temperature: 0.2 });
const searchTool = new TavilySearchResults({ maxResults: 10 });

export async function industryCompetitors(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  try {
    const searchResults = await searchTool.invoke({ query: `${state.companyName} competitors industry market share competitive advantage moat` });
    const resultsText = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);
    
    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a financial research analyst. Extract industry and competitor information from the search results and return ONLY valid JSON matching this exact structure (no markdown, no code fences):
{"industry": "...", "marketSize": "...", "growthRate": "...", "competitors": [{"name": "...", "marketPosition": "...", "strengths": ["...", "..."]}], "competitiveAdvantages": ["...", "..."], "industryTrends": ["...", "..."], "threats": ["...", "..."], "moatRating": "Wide", "score": 7}
moatRating must be 'Wide' | 'Narrow' | 'None'.
score must be a number from 1 to 10 based on competitive position.
Fill in all fields. If specific data is not found in the search results, YOU MUST USE YOUR INTERNAL KNOWLEDGE BASE to estimate or provide the most recently known accurate data for the company. ONLY use "N/A" if the metric is completely inapplicable.`
      },
      {
        role: 'user',
        content: `Company to research: ${state.companyName}\n\nSearch results:\n${resultsText}`
      }
    ]);
    
    const content = typeof response.content === 'string' ? response.content : '';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const industryAnalysis: IndustryAnalysis = JSON.parse(cleaned);
    return { industryAnalysis };
  } catch (error) {
    console.error('Industry competitors error:', error);
    return {
      industryAnalysis: {
        industry: 'N/A', marketSize: 'N/A', growthRate: 'N/A',
        competitors: [], competitiveAdvantages: [],
        industryTrends: [], threats: ['Failed to retrieve industry data.'],
        moatRating: 'None', score: 5
      },
      errors: [`Industry analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
