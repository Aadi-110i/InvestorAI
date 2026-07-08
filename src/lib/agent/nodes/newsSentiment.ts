import { TavilySearch as TavilySearchResults } from '@langchain/tavily';
import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { NewsSentiment } from '../../types';
import { parseJSON } from '../parseJSON';

export async function newsSentiment(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const llm = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.2 });
  const searchTool = new TavilySearchResults({ maxResults: 10 });
  try {
    const searchResults = await searchTool.invoke({ query: `${state.companyName} latest news analyst rating sentiment 2025` });
    const resultsText = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);

    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a financial research analyst.
Return news and sentiment data as a single raw JSON object.
CRITICAL: Output ONLY the JSON. No markdown, no code fences, no prose before or after.

Required structure:
{"overallSentiment":"positive","sentimentScore":0.8,"recentNews":[{"title":"...","summary":"...","sentiment":"positive","date":"...","source":"..."}],"analystConsensus":"...","keyThemes":["...","..."],"risks":["...","..."]}

Rules:
- overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
- sentimentScore: number from -1 to 1
- recentNews: 3-5 items
- If search results are sparse, use your own knowledge to fill in realistic values. Never return empty arrays if you know the company.`
      },
      {
        role: 'user',
        content: `Company to research: ${state.companyName}\n\nSearch results:\n${resultsText}`
      }
    ]);

    const content = typeof response.content === 'string' ? response.content : '';
    const newsSentiment: NewsSentiment = parseJSON<NewsSentiment>(content);
    return { newsSentiment };
  } catch (error) {
    console.error('News sentiment error:', error);
    return {
      newsSentiment: {
        overallSentiment: 'neutral', sentimentScore: 0,
        recentNews: [], analystConsensus: 'N/A',
        keyThemes: [], risks: ['Failed to retrieve news sentiment.']
      },
      errors: [`News sentiment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
