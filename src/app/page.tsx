'use client';

import { useState, useEffect } from 'react';
import SearchHero from '@/components/SearchHero';
import AgentTimeline, { TimelineStep } from '@/components/AgentTimeline';
import ResearchSection, { SkeletonCard } from '@/components/ResearchSection';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';
import VerdictCard from '@/components/VerdictCard';
import { Search, BarChart3, Newspaper, Factory, Building, AlertTriangle, CheckCircle2, Link2, Plus, X } from 'lucide-react';
import HistoryPanel, { saveHistory } from '@/components/HistoryPanel';
import { CursorGlow, Navbar } from '@/components/UIEffects';
import type {
  CompanyInfo, FinancialAnalysis, NewsSentiment,
  IndustryAnalysis, InvestmentDecision,
} from '@/lib/types';

const INIT: TimelineStep[] = [
  { id: 'companyIdentificationNode', label: 'Company Identification', icon: 'search', status: 'pending' },
  { id: 'financialAnalysisNode',     label: 'Financial Analysis',     icon: 'bar-chart', status: 'pending' },
  { id: 'newsSentimentNode',         label: 'News & Sentiment',       icon: 'newspaper', status: 'pending' },
  { id: 'industryCompetitorsNode',   label: 'Industry & Competitors', icon: 'factory', status: 'pending' },
  { id: 'investmentDecisionNode',    label: 'Investment Decision',    icon: 'brain', status: 'pending' },
];

/* ─── Waiting card placeholder ─────────────────────────── */
function WaitingCard({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="card" style={{ padding: 'var(--s6)' }}>
      <div className="card-glow" aria-hidden />
      <div className="waiting-state">
        <div className="waiting-icon" style={{ animation: 'spin 2s linear infinite' }}>
          <Search size={32} strokeWidth={1.5} />
        </div>
        <div className="waiting-title">{label}</div>
        <div className="waiting-sub">Agent is gathering data…</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [loading,    setLoading]    = useState(false);
  const [hasResult,  setHasResult]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [query,      setQuery]      = useState('');
  const [copied,     setCopied]     = useState(false);

  const [steps,      setSteps]      = useState<TimelineStep[]>(INIT);
  const [stepStarts, setStepStarts] = useState<Record<string, number>>({});

  // Data states
  const [company,   setCompany]   = useState<CompanyInfo | null>(null);
  const [financial, setFinancial] = useState<FinancialAnalysis | null>(null);
  const [news,      setNews]      = useState<NewsSentiment | null>(null);
  const [industry,  setIndustry]  = useState<IndustryAnalysis | null>(null);
  const [decision,  setDecision]  = useState<InvestmentDecision | null>(null);

  // Active node tracking
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());

  // Persist to history when decision arrives
  useEffect(() => {
    if (decision && query) {
      saveHistory({
        id: `${query}-${Date.now()}`,
        company: query,
        verdict: decision.verdict as 'INVEST' | 'PASS' | 'WATCH',
        confidence: decision.confidence,
        timestamp: Date.now(),
      });
    }
  }, [decision, query]);

  const reset = () => {
    setSteps(INIT); setStepStarts({});
    setCompany(null); setFinancial(null);
    setNews(null); setIndustry(null);
    setDecision(null); setError(null);
    setActiveNodes(new Set());
  };

  const handleReset = () => {
    setHasResult(false);
    setLoading(false);
    reset();
    setQuery('');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?q=${encodeURIComponent(query)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSearch = async (name: string) => {
    setLoading(true); setHasResult(true); setQuery(name); reset();

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: name }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to connect');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const evts = buf.split('\n\n');
        buf = evts.pop() || '';

        for (const ev of evts) {
          if (!ev.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(ev.slice(6));

            if (d.type === 'node_start' && d.node) {
              setStepStarts(p => ({ ...p, [d.node]: d.timestamp }));
              setSteps(p => p.map(s => s.id === d.node ? { ...s, status: 'active' } : s));
              setActiveNodes(p => new Set([...p, d.node]));
            }
            else if (d.type === 'node_complete' && d.node) {
              setSteps(p => p.map(s => {
                if (s.id !== d.node) return s;
                const dur = stepStarts[d.node] ? d.timestamp - stepStarts[d.node] : undefined;
                return { ...s, status: 'done', duration: dur };
              }));
              setActiveNodes(p => { const n = new Set(p); n.delete(d.node); return n; });

              if (d.node === 'companyIdentificationNode' && d.data?.companyInfo)       setCompany(d.data.companyInfo);
              if (d.node === 'financialAnalysisNode'     && d.data?.financialAnalysis) setFinancial(d.data.financialAnalysis);
              if (d.node === 'newsSentimentNode'         && d.data?.newsSentiment)     setNews(d.data.newsSentiment);
              if (d.node === 'industryCompetitorsNode'   && d.data?.industryAnalysis)  setIndustry(d.data.industryAnalysis);
              if (d.node === 'investmentDecisionNode'    && d.data?.investmentDecision) setDecision(d.data.investmentDecision);
            }
            else if (d.type === 'final') {
              if (d.data?.investmentDecision) setDecision(d.data.investmentDecision);
              setLoading(false);
            }
            else if (d.type === 'error') {
              setError(d.message);
              setLoading(false);
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
      setLoading(false);
    }
  };

  // Determine which nodes are "active" (started but no data yet)
  const companyLoading   = activeNodes.has('companyIdentificationNode') && !company;
  const financialLoading = activeNodes.has('financialAnalysisNode')     && !financial;
  const newsLoading      = activeNodes.has('newsSentimentNode')         && !news;
  const industryLoading  = activeNodes.has('industryCompetitorsNode')   && !industry;

  return (
    <div className="page">
      <CursorGlow />
      <Navbar isAnalyzing={loading} company={query || undefined} />

      {/* History panel — floating */}
      <HistoryPanel
        current={query}
        onSelect={(c) => { handleReset(); setTimeout(() => handleSearch(c), 50); }}
      />

      {/* Hero / Search */}
      <SearchHero
        onSearch={handleSearch}
        isLoading={loading}
        compact={hasResult}
        lastQuery={query}
        onReset={handleReset}
      />

      {/* Results or Landing Marketing */}
      {hasResult ? (
        <div className="results-area container" style={{ animation: 'fadeIn 0.5s ease forwards' }}>

          {/* Error */}
          {error && (
            <div className="error-bar">
              <span><AlertTriangle size={16} /></span>
              <span>{error}</span>
              <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setError(null)} title="Dismiss"><X size={16} /></button>
            </div>
          )}

          {/* Share bar — shown when done */}
          {decision && !loading && (
            <div className="share-bar">
              <span className="share-bar-text"><CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Analysis complete for <strong>{query}</strong></span>
              <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'center' }}>
                <button className="share-btn" onClick={handleCopyLink} id="copy-link-btn">
                  {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Link2 size={14} /> Share</>}
                </button>
                <button className="share-btn secondary" onClick={handleReset} id="new-search-action-btn">
                  <Plus size={14} /> New Search
                </button>
              </div>
            </div>
          )}

          {/* Compact timeline strip */}
          <div className="timeline-strip">
            <AgentTimeline steps={steps} compact />
          </div>

          {/* 3-Column Hero Row: Financials | Verdict | Industry */}
          <div className="hero-verdict-row">
            {/* Left: Financial Analysis */}
            <div className="hero-side">
              {financial ? (
                <ResearchSection title="Financial Analysis" icon={<BarChart3 size={18} />} type="financial" data={financial} score={financial.score} />
              ) : financialLoading ? <SkeletonCard /> : null}
            </div>

            {/* Center: Verdict */}
            <div className="hero-center">
              {decision ? (
                <div style={{ animation: 'scaleUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', height: '100%' }}>
                  <VerdictCard
                    decision={decision}
                    companyName={company?.name || query}
                    financialScore={financial?.score}
                    newsScore={news?.sentimentScore}
                    industryScore={industry?.score}
                  />
                </div>
              ) : (loading && !company && !companyLoading) ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <WaitingCard icon="🔍" label="Researching company..." />
                </div>
              ) : null}
            </div>

            {/* Right: Industry & Competitors */}
            <div className="hero-side">
              {industry ? (
                <ResearchSection title="Industry & Competitors" icon={<Factory size={18} />} type="industry" data={industry} score={industry.score} />
              ) : industryLoading ? <SkeletonCard /> : null}
            </div>
          </div>

          {/* Bottom dashboard grid */}
          <div className="dashboard-grid">
            {/* Company Overview */}
            {company ? (
              <ResearchSection title="Company Overview" icon={<Building size={18} />} type="company" data={company} />
            ) : companyLoading ? <SkeletonCard /> : null}
          </div>

          {/* News — full width below grid */}
          {news ? (
            <div style={{ marginTop: 'var(--s5)' }}>
              <ResearchSection title="News & Sentiment" icon={<Newspaper size={18} />} type="news" data={news} />
            </div>
          ) : newsLoading ? (
            <div style={{ marginTop: 'var(--s5)' }}><SkeletonCard /></div>
          ) : null}
        </div>

      ) : (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Animated 3D Background */}
          <div className="animated-mesh-bg" />

          {/* Hero Section */}
          <div className="landing-features container" style={{ paddingTop: 'var(--s20)' }}>
            <div className="landing-heading" style={{ animation: 'slideUp 0.8s ease' }}>
              Research has changed.<br/>Have you?
            </div>
            <div className="landing-subheading" style={{ animation: 'slideUp 0.8s ease 0.1s both' }}>
              People no longer search with keywords — they ask questions that AI agents answer. Be the firm that acts on them first.
            </div>

            <div className="feature-grid" style={{ animation: 'fadeIn 1s ease 0.3s both' }}>
              <TiltCard>
                <div className="feature-card">
                  <div className="feature-icon"><BarChart3 size={36} strokeWidth={1.5} color="var(--purple-600)" /></div>
                  <div className="feature-title">Deep Financials</div>
                  <div className="feature-desc">Analyzes revenue, margins, ratios, and risk vectors to establish intrinsic value and highlight structural issues. Automatically falls back to internal knowledge when live data is missing.</div>
                  <div className="feature-tags">
                    <span className="feature-tag">Intrinsic Value</span>
                    <span className="feature-tag">Risk Vectors</span>
                  </div>
                </div>
              </TiltCard>
              
              <TiltCard>
                <div className="feature-card">
                  <div className="feature-icon"><Newspaper size={36} strokeWidth={1.5} color="var(--purple-600)" /></div>
                  <div className="feature-title">Market Sentiment</div>
                  <div className="feature-desc">Scrapes real-time headlines and assesses macro mood to weigh short-term volatility against long-term conviction. Calculates exact positive/negative splits.</div>
                  <div className="feature-tags">
                    <span className="feature-tag">Real-time</span>
                    <span className="feature-tag">Sentiment Scoring</span>
                  </div>
                </div>
              </TiltCard>

              <TiltCard>
                <div className="feature-card">
                  <div className="feature-icon"><Factory size={36} strokeWidth={1.5} color="var(--purple-600)" /></div>
                  <div className="feature-title">Industry Moats</div>
                  <div className="feature-desc">Evaluates the competitive landscape, scoring structural advantages and identifying immediate existential threats from rivals.</div>
                  <div className="feature-tags">
                    <span className="feature-tag">Competitor Map</span>
                    <span className="feature-tag">Moat Rating</span>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>

          {/* How It Works Section */}
          <ScrollReveal delay={0.1}>
            <div className="landing-section container">
              <h2 className="landing-heading" style={{ fontSize: '2.5rem' }}>How InvestorAI Thinks</h2>
              <div className="landing-subheading">A multi-agent autonomous workflow working in parallel.</div>
              
              <div className="step-grid">
                <div className="step-item">
                  <div className="step-num">1</div>
                  <div className="step-title">Identify & Profile</div>
                  <div className="step-desc">The agent takes your query, identifies the exact corporate entity, and builds a comprehensive profile including sector and leadership.</div>
                </div>
                <div className="step-item">
                  <div className="step-num">2</div>
                  <div className="step-title">Parallel Research</div>
                  <div className="step-desc">Financial, News, and Industry sub-agents are deployed simultaneously to scrape the web and crunch numbers.</div>
                </div>
                <div className="step-item">
                  <div className="step-num">3</div>
                  <div className="step-title">Synthesize Verdict</div>
                  <div className="step-desc">A master decision agent reviews the parallel reports, weighing the bull and bear cases, to deliver a final high-conviction verdict.</div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Institutional Trust Section */}
          <ScrollReveal delay={0.2}>
            <div className="landing-section container" style={{ paddingBottom: 'var(--s24)' }}>
              <h2 className="landing-heading" style={{ fontSize: '2.5rem' }}>Built for Institutional Investors</h2>
              <div className="landing-subheading">Eliminate bias and accelerate due diligence.</div>
              
              <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="feature-card">
                  <div className="feature-icon" style={{ color: 'var(--purple-600)' }}><Building size={48} strokeWidth={1.5} /></div>
                  <div className="feature-title">Unbiased Analysis</div>
                  <div className="feature-desc">Algorithms don't hold bags. InvestorAI evaluates companies purely on raw fundamentals, stripping away market hype and emotional attachment to deliver objective truth.</div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon" style={{ color: 'var(--purple-600)' }}><BarChart3 size={48} strokeWidth={1.5} /></div>
                  <div className="feature-title">Real-Time Intelligence</div>
                  <div className="feature-desc">By live-scraping news and SEC filings instead of relying on stale databases, the system captures immediate market catalysts and shifting macro trends before they are fully priced in.</div>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      )}

      <footer className="footer">
        InvestorAI · Built for InsideIIM × Altuni AI Labs · Powered by GPT-4o &amp; LangGraph
      </footer>
    </div>
  );
}
