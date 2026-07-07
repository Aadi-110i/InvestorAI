export interface CompanyInfo {
  name: string;
  ticker: string;
  sector: string;
  industry: string;
  marketCap: string;
  description: string;
  founded: string;
  headquarters: string;
  ceo: string;
  employees: string;
}

export interface FinancialAnalysis {
  revenue: string;
  revenueGrowth: string;
  netIncome: string;
  profitMargin: string;
  peRatio: string;
  debtToEquity: string;
  currentRatio: string;
  freeCashFlow: string;
  roe: string;
  highlights: string[];
  risks: string[];
  score: number; // 1-10
}

export interface NewsSentiment {
  overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentimentScore: number; // -1 to 1
  recentNews: NewsItem[];
  analystConsensus: string;
  keyThemes: string[];
  risks: string[];
}

export interface NewsItem {
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  date: string;
  source: string;
}

export interface IndustryAnalysis {
  industry: string;
  marketSize: string;
  growthRate: string;
  competitors: Competitor[];
  competitiveAdvantages: string[];
  industryTrends: string[];
  threats: string[];
  moatRating: string; // 'Wide' | 'Narrow' | 'None'
  score: number; // 1-10
}

export interface Competitor {
  name: string;
  marketPosition: string;
  strengths: string[];
}

export interface InvestmentDecision {
  verdict: 'INVEST' | 'PASS' | 'WATCH';
  confidence: number; // 0-100
  targetPrice: string;
  currentPrice: string;
  timeHorizon: string;
  summary: string;
  bullCase: string[];
  bearCase: string[];
  keyFactors: { factor: string; impact: 'positive' | 'negative' | 'neutral'; weight: string }[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
}

export interface StreamEvent {
  type: 'status' | 'node_start' | 'node_complete' | 'error' | 'final';
  node?: string;
  message: string;
  data?: any;
  timestamp: number;
}
