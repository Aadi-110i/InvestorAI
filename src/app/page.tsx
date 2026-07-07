'use client';

import { useState, useEffect } from 'react';
import SearchHero from '@/components/SearchHero';
import AgentTimeline, { TimelineStep } from '@/components/AgentTimeline';
import ResearchSection, { SkeletonCard } from '@/components/ResearchSection';
import VerdictCard from '@/components/VerdictCard';
import HistoryPanel, { saveHistory } from '@/components/HistoryPanel';
import { CursorGlow, Navbar } from '@/components/UIEffects';
import type {
  CompanyInfo, FinancialAnalysis, NewsSentiment,
  IndustryAnalysis, InvestmentDecision,
} from '@/lib/types';

const INIT: TimelineStep[] = [
  { id: 'companyIdentificationNode', label: 'Company Identification', icon: '🔍', status: 'pending' },
  { id: 'financialAnalysisNode',     label: 'Financial Analysis',     icon: '📊', status: 'pending' },
  { id: 'newsSentimentNode',         label: 'News & Sentiment',       icon: '📰', status: 'pending' },
  { id: 'industryCompetitorsNode',   label: 'Industry & Competitors', icon: '🏭', status: 'pending' },
  { id: 'investmentDecisionNode',    label: 'Investment Decision',    icon: '🧠', status: 'pending' },
];

/* ─── Waiting card placeholder ─────────────────────────── */
function WaitingCard({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="card" style={{ padding: 'var(--s6)' }}>
      <div className="card-glow" aria-hidden />
      <div className="waiting-state">
        <div className="waiting-icon" style={{ animation: 'spin 2s linear infinite' }}>{icon}</div>
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
              <span>⚠️</span>
              <span>{error}</span>
              <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setError(null)} title="Dismiss">✕</button>
            </div>
          )}

          {/* Share bar — shown when done */}
          {decision && !loading && (
            <div className="share-bar">
              <span className="share-bar-text">✅ Analysis complete for <strong>{query}</strong></span>
              <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'center' }}>
                <button className="share-btn" onClick={handleCopyLink} id="copy-link-btn">
                  {copied ? '✓ Copied!' : '🔗 Share'}
                </button>
                <button className="share-btn secondary" onClick={handleReset} id="new-search-action-btn">
                  + New Search
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
                <ResearchSection title="Financial Analysis" icon="📊" type="financial" data={financial} score={financial.score} />
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
                <ResearchSection title="Industry & Competitors" icon="🏭" type="industry" data={industry} score={industry.score} />
              ) : industryLoading ? <SkeletonCard /> : null}
            </div>
          </div>

          {/* Bottom dashboard grid */}
          <div className="dashboard-grid">
            {/* Company Overview */}
            {company ? (
              <ResearchSection title="Company Overview" icon="🏢" type="company" data={company} />
            ) : companyLoading ? <SkeletonCard /> : null}
          </div>

          {/* News — full width below grid */}
          {news ? (
            <div style={{ marginTop: 'var(--s5)' }}>
              <ResearchSection title="News & Sentiment" icon="📰" type="news" data={news} />
            </div>
          ) : newsLoading ? (
            <div style={{ marginTop: 'var(--s5)' }}><SkeletonCard /></div>
          ) : null}
        </div>

      ) : (
        <div className="landing-features container">
          <div className="landing-heading">Research has changed.<br/>Have you?</div>
          <div className="landing-subheading">
            People no longer search with keywords — they ask questions that AI agents answer. Be the firm that acts on them first.
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <div className="feature-title">Deep Financials</div>
              <div className="feature-desc">Analyzes revenue, margins, ratios, and risk vectors to establish intrinsic value and highlight structural issues.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📰</div>
              <div className="feature-title">Market Sentiment</div>
              <div className="feature-desc">Scrapes real-time headlines and assesses macro mood to weigh short-term volatility against long-term conviction.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏭</div>
              <div className="feature-title">Industry Moats</div>
              <div className="feature-desc">Evaluates the competitive landscape, scoring structural advantages and identifying immediate existential threats.</div>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        InvestorAI · Built for InsideIIM × Altuni AI Labs · Powered by GPT-4o &amp; LangGraph
      </footer>
    </div>
  );
}
