import { TavilySearch as TavilySearchResults } from '@langchain/tavily';
import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { CompanyInfo } from '../../types';
import { parseJSON } from '../parseJSON';

export async function companyIdentification(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const llm = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.2 });
  const searchTool = new TavilySearchResults({ maxResults: 10 });
  try {
    const searchResults = await searchTool.invoke({ query: `${state.companyName} company overview profile sector market cap CEO headquarters` });
    const resultsText = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);

    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a financial research analyst.
Return company information as a single raw JSON object.
CRITICAL: Output ONLY the JSON. No markdown, no code fences, no prose.

Required structure:
{"name":"...","ticker":"...","sector":"...","industry":"...","marketCap":"...","description":"...","founded":"...","headquarters":"...","ceo":"...","employees":"..."}

Fill all fields using search results. If a field is not in the search results, use your own training knowledge. Only use "N/A" if genuinely unknown.`
      },
      {
        role: 'user',
        content: `Company to research: ${state.companyName}\n\nSearch results:\n${resultsText}`
      }
    ]);

    const content = typeof response.content === 'string' ? response.content : '';
    const companyInfo: CompanyInfo = parseJSON<CompanyInfo>(content);
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
