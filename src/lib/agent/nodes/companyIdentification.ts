import { TavilySearch as TavilySearchResults } from '@langchain/tavily';
import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { CompanyInfo } from '../../types';

const llm = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.2 });
const searchTool = new TavilySearchResults({ maxResults: 10 });

export async function companyIdentification(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  try {
    const searchResults = await searchTool.invoke({ query: `${state.companyName} company overview profile sector market cap CEO headquarters` });
    const resultsText = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);
    
    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a financial research analyst. Extract company information from the search results and return ONLY valid JSON matching this exact structure (no markdown, no code fences):
{"name": "...", "ticker": "...", "sector": "...", "industry": "...", "marketCap": "...", "description": "...", "founded": "...", "headquarters": "...", "ceo": "...", "employees": "..."}
Fill in all fields. If specific data is not found in the search results, YOU MUST USE YOUR INTERNAL KNOWLEDGE BASE to estimate or provide the most recently known accurate data for the company. ONLY use "N/A" if the metric is completely inapplicable.`
      },
      {
        role: 'user',
        content: `Company to research: ${state.companyName}\n\nSearch results:\n${resultsText}`
      }
    ]);
    
    const content = typeof response.content === 'string' ? response.content : '';
    // Strip markdown code fences if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const companyInfo: CompanyInfo = JSON.parse(cleaned);
    return { companyInfo };
  } catch (error) {
    console.error('Company identification error:', error);
    return {
      companyInfo: {
        name: state.companyName,
        ticker: 'N/A', sector: 'N/A', industry: 'N/A',
        marketCap: 'N/A', description: 'Failed to retrieve company info.',
        founded: 'N/A', headquarters: 'N/A', ceo: 'N/A', employees: 'N/A'
      },
      errors: [`Company identification failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
