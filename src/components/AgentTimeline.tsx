'use client';

export interface TimelineStep {
  id: string;
  label: string;
  icon: string;
  status: 'pending' | 'active' | 'done' | 'error';
  duration?: number;
}

const DESCS: Record<string, string> = {
  companyIdentificationNode: 'Profile & sector overview',
  financialAnalysisNode:     'Revenue, margins & ratios',
  newsSentimentNode:         'Headlines & market mood',
  industryCompetitorsNode:   'Landscape & competitive moat',
  investmentDecisionNode:    'Final recommendation',
};

export default function AgentTimeline({ steps, compact }: { steps: TimelineStep[]; compact?: boolean }) {
  const done = steps.filter(s => s.status === 'done').length;
  const pct  = Math.round((done / steps.length) * 100);

  /* ── Compact horizontal strip ─────────────────────── */
  if (compact) {
    return (
      <div className="timeline-strip-inner">
        <div className="timeline-strip-meta">
          <span className="timeline-strip-icon">🤖</span>
          <span className="timeline-strip-label">Research Agent</span>
          <span className="timeline-strip-count">{done}/{steps.length} stages</span>
          <div className="timeline-strip-bar">
            <div className="timeline-strip-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="timeline-strip-pct">{pct}%</span>
        </div>
        <div className="timeline-strip-steps">
          {steps.map(step => (
            <div key={step.id} className={`tl-pill ${step.status}`} title={step.label}>
              <span className="tl-pill-dot">
                {step.status === 'done' ? '✓'
                  : step.status === 'error' ? '✗'
                  : step.status === 'active'
                    ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>{step.icon}</span>
                    : step.icon}
              </span>
              <span className="tl-pill-label">{step.label}</span>
              {step.duration && <span className="tl-pill-time">{(step.duration/1000).toFixed(1)}s</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Vertical sidebar card (fallback) ─────────────── */
  return (
    <div className="card timeline-card">
      <div className="card-glow" aria-hidden />
      <div className="timeline-head">
        <div className="timeline-head-icon">🤖</div>
        <div>
          <div className="timeline-head-title">Research Agent</div>
          <div className="timeline-head-sub">{done}/{steps.length} stages complete</div>
        </div>
        <div className="timeline-pct">{pct}%</div>
      </div>
      <div className="timeline-progress-bar">
        <div className="timeline-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={step.id} className={`tl-step ${step.status}`}>
              <div className="tl-col">
                <div className="tl-dot">
                  {step.status === 'done' ? '✓'
                    : step.status === 'error' ? '✗'
                    : step.status === 'active'
                      ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>{step.icon}</span>
                      : step.icon}
                </div>
                {!isLast && <div className="tl-line"><div className="tl-line-fill" /></div>}
              </div>
              <div className="tl-info">
                <div className="tl-label">{step.label}</div>
                <div className="tl-desc">{DESCS[step.id]}</div>
                {step.duration && <div className="tl-time">⏱ {(step.duration/1000).toFixed(1)}s</div>}
                {step.status === 'active' && (
                  <div className="tl-dots">
                    {[0,1,2].map(j => <span key={j} className="tl-dot-sm" style={{ animationDelay: `${j*0.18}s` }} />)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
