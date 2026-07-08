import { TavilySearch as TavilySearchResults } from '@langchain/tavily';
import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { IndustryAnalysis } from '../../types';
import { parseJSON } from '../parseJSON';

export async function industryCompetitors(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const llm = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.2 });
  const searchTool = new TavilySearchResults({ maxResults: 10 });
  try {
    const searchResults = await searchTool.invoke({ query: `${state.companyName} competitors industry market share competitive advantage moat` });
    const resultsText = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);

    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a financial research analyst.
Return industry and competitor data as a single raw JSON object.
CRITICAL: Output ONLY the JSON. No markdown, no code fences, no prose.

Required structure:
{"industry":"...","marketSize":"...","growthRate":"...","competitors":[{"name":"...","marketPosition":"...","strengths":["...","..."]}],"competitiveAdvantages":["...","..."],"industryTrends":["...","..."],"threats":["...","..."],"moatRating":"Wide","score":7}

moatRating: 'Wide' | 'Narrow' | 'None'. Score: 1-10 based on competitive position. Use your own knowledge if search results are sparse.`
      },
      {
        role: 'user',
        content: `Company to research: ${state.companyName}\n\nSearch results:\n${resultsText}`
      }
    ]);

    const content = typeof response.content === 'string' ? response.content : '';
    const industryAnalysis: IndustryAnalysis = parseJSON<IndustryAnalysis>(content);
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
