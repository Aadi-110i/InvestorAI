import { Annotation } from '@langchain/langgraph';
import type { CompanyInfo, FinancialAnalysis, NewsSentiment, IndustryAnalysis, InvestmentDecision } from '../types';

export const AgentStateAnnotation = Annotation.Root({
  companyName: Annotation<string>(),
  companyInfo: Annotation<CompanyInfo | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),
  financialAnalysis: Annotation<FinancialAnalysis | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),
  newsSentiment: Annotation<NewsSentiment | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),
  industryAnalysis: Annotation<IndustryAnalysis | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),
  investmentDecision: Annotation<InvestmentDecision | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),
  errors: Annotation<string[]>({
    default: () => [],
    reducer: (prev, next) => [...prev, ...next],
  }),
});
