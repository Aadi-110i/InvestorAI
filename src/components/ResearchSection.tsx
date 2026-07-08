'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import type { CompanyInfo, FinancialAnalysis, NewsSentiment, IndustryAnalysis } from '@/lib/types';

interface Props {
  title: string;
  icon: React.ReactNode;
  data: any;
  type: 'company' | 'financial' | 'news' | 'industry';
  score?: number;
  defaultOpen?: boolean;
}

/* ─── Score Ring ──────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const lvl   = score >= 7 ? 'high' : score >= 5 ? 'med' : 'low';
  const color = lvl === 'high' ? '#10b981' : lvl === 'med' ? '#f59e0b' : '#ef4444';
  const R = 15, C = 2 * Math.PI * R;
  const barLvl = lvl === 'med' ? 'medium' : lvl;
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0}}>
      <div className={`score-ring ${lvl}`}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3"/>
          <circle cx="20" cy="20" r={R} fill="none" stroke={color} strokeWidth="3"
            strokeLinecap="round" strokeDasharray={`${(score/10)*C} ${C}`}
            style={{filter:`drop-shadow(0 0 4px ${color})`}}/>
        </svg>
        <div className="score-ring-num">{score}</div>
      </div>
      <div className="score-bar-wrap" style={{width:60}}>
        <div className="score-bar-track">
          <div className={`score-bar-fill ${barLvl}`} style={{width:`${score*10}%`}}/>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-title"/>
      <div className="skeleton-grid">
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="skeleton skeleton-cell"/>
        ))}
      </div>
      <div className="skeleton skeleton-line w-80"/>
      <div className="skeleton skeleton-line w-60"/>
      <div className="skeleton skeleton-line w-40"/>
    </div>
  );
}

/* ─── DividerLabel ─────────────────────────────────────── */
function DL({ label }: { label: string }) {
  return (
    <div className="divider-label">
      <span className="divider-label-text">{label}</span>
      <span className="divider-label-line"/>
    </div>
  );
}

/* ─── Company ──────────────────────────────────────────── */
function Company({ d }: { d: CompanyInfo }) {
  const primary = [
    ['Ticker', d.ticker], ['Sector', d.sector],
    ['Industry', d.industry], ['Market Cap', d.marketCap],
    ['CEO', d.ceo], ['Founded', d.founded],
  ];
  return (
    <div>
      {/* HQ + Employees banner */}
      {(d.headquarters || d.employees) && (
        <div className="company-banner">
          {d.headquarters && (
            <div className="company-banner-item">
              <span>📍</span>
              <span>HQ: <strong>{d.headquarters}</strong></span>
            </div>
          )}
          {d.headquarters && d.employees && <div className="company-banner-sep"/>}
          {d.employees && (
            <div className="company-banner-item">
              <span>👥</span>
              <span>Employees: <strong>{d.employees}</strong></span>
            </div>
          )}
        </div>
      )}

      <div className="stat-grid">
        {primary.map(([k,v])=>(
          <div className="stat-cell" key={k}>
            <div className="stat-key">{k}</div>
            <div className="stat-val">{v}</div>
          </div>
        ))}
      </div>

      {d.description && (
        <>
          <DL label="About"/>
          <p style={{fontSize:'0.87rem',color:'var(--text-muted)',lineHeight:1.75}}>{d.description}</p>
        </>
      )}
    </div>
  );
}

/* ─── Financial ────────────────────────────────────────── */
function Financial({ d }: { d: FinancialAnalysis }) {
  const primary = [
    ['Revenue', d.revenue], ['Revenue Growth', d.revenueGrowth],
    ['Net Income', d.netIncome], ['Profit Margin', d.profitMargin],
    ['P/E Ratio', d.peRatio], ['ROE', d.roe],
  ];
  const extra = [
    ['Debt / Equity', d.debtToEquity], ['Current Ratio', d.currentRatio],
    ['Free Cash Flow', d.freeCashFlow],
  ].filter(([,v])=>v);

  return (
    <div>
      <div className="stat-grid">
        {primary.map(([k,v])=>(
          <div className="stat-cell" key={k}>
            <div className="stat-key">{k}</div>
            <div className="stat-val">{v}</div>
          </div>
        ))}
      </div>

      {extra.length > 0 && (
        <div className="financial-extra-grid">
          {extra.map(([k,v])=>(
            <div className="stat-cell" key={k}>
              <div className="stat-key">{k}</div>
              <div className="stat-val">{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="duo-grid">
        <div className="list-panel">
          <div className="list-panel-head pos">↑ Highlights</div>
          <ul className="item-list">
            {d.highlights.map((x,i)=><li key={i}><span className="item-dot pos"><Check size={14} /></span>{x}</li>)}
          </ul>
        </div>
        <div className="list-panel">
          <div className="list-panel-head neg">↓ Risks</div>
          <ul className="item-list">
            {d.risks.map((x,i)=><li key={i}><span className="item-dot neg"><X size={14} /></span>{x}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── News ─────────────────────────────────────────────── */
function SentimentMeter({ score }: { score: number }) {
  const [left, setLeft] = useState('50%');
  useEffect(()=>{
    const t = setTimeout(()=>{ setLeft(`${((score+1)/2)*100}%`); }, 200);
    return ()=>clearTimeout(t);
  },[score]);

  return (
    <div className="sentiment-meter">
      <div className="sentiment-meter-track">
        <div className="sentiment-needle" style={{left}}/>
      </div>
      <div className="sentiment-meter-labels">
        <span>Bearish</span><span>Neutral</span><span>Bullish</span>
      </div>
    </div>
  );
}

function News({ d }: { d: NewsSentiment }) {
  const sc = d.overallSentiment === 'positive' ? 'pos'
           : d.overallSentiment === 'negative' ? 'neg' : 'neu';

  const posCount = d.recentNews.filter(n => n.sentiment === 'positive').length;
  const negCount = d.recentNews.filter(n => n.sentiment === 'negative').length;
  const neuCount = d.recentNews.filter(n => n.sentiment === 'neutral').length;
  const total    = d.recentNews.length;

  return (
    <div>
      {/* ── Stats bar ─────────────────────────────────── */}
      <div className="news-stats-bar">
        <div className="news-stat-box">
          <div className="stat-key">Overall Sentiment</div>
          <span className={`pill ${sc}`} style={{fontSize:'0.83rem',padding:'4px 13px',marginTop:7,display:'inline-flex'}}>
            {d.overallSentiment}
          </span>
        </div>
        <div className="news-stat-box">
          <div className="stat-key">Analyst Consensus</div>
          <div className="stat-val" style={{marginTop:6,fontSize:'0.9rem'}}>{d.analystConsensus}</div>
        </div>
        <div className="news-stat-box">
          <div className="stat-key">Total Articles</div>
          <div className="stat-val" style={{marginTop:6}}>{total}</div>
        </div>
        <div className="news-stat-box news-stat-pos">
          <div className="stat-key">Positive</div>
          <div className="stat-val" style={{color:'#059669',marginTop:6}}>{posCount}</div>
        </div>
        <div className="news-stat-box news-stat-neg">
          <div className="stat-key">Negative</div>
          <div className="stat-val" style={{color:'#dc2626',marginTop:6}}>{negCount}</div>
        </div>
        <div className="news-stat-box">
          <div className="stat-key">Neutral</div>
          <div className="stat-val" style={{color:'#6b7280',marginTop:6}}>{neuCount}</div>
        </div>
        {typeof d.sentimentScore === 'number' && (
          <div className="news-stat-box" style={{flex:'2 1 220px'}}>
            <div className="stat-key">Sentiment Score ({d.sentimentScore > 0 ? '+' : ''}{d.sentimentScore.toFixed(2)})</div>
            <SentimentMeter score={d.sentimentScore}/>
          </div>
        )}
      </div>

      {/* ── News cards grid ─────────────────────────── */}
      <DL label="Recent Headlines"/>
      <div className="news-cards-grid">
        {d.recentNews.map((item,i)=>{
          const nsc = item.sentiment==='positive'?'pos':item.sentiment==='negative'?'neg':'neu';
          return (
            <div key={i} className={`news-card-item ${item.sentiment}`}>
              <div className="news-card-top">
                <span className={`pill ${nsc}`}>{item.sentiment}</span>
                <span className="news-card-source">{item.source}</span>
              </div>
              <div className="news-card-title">{item.title}</div>
              <div className="news-card-summary">{item.summary}</div>
              <div className="news-card-date">{item.date}</div>
            </div>
          );
        })}
      </div>

      {/* ── Themes + Risks side by side ─────────────── */}
      {(d.keyThemes?.length > 0 || d.risks?.length > 0) && (
        <div className="news-bottom-row">
          {d.keyThemes?.length > 0 && (
            <div className="news-bottom-panel">
              <DL label="Key Themes"/>
              <div className="theme-row">
                {d.keyThemes.map((t,i)=><span key={i} className="theme-chip">{t}</span>)}
              </div>
            </div>
          )}
          {d.risks?.length > 0 && (
            <div className="news-bottom-panel">
              <DL label="Sentiment Risks"/>
              <ul className="item-list" style={{marginTop:'var(--s2)'}}>
                {d.risks.map((r,i)=><li key={i}><span className="item-dot neg">!</span>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Industry ─────────────────────────────────────────── */
function Industry({ d }: { d: IndustryAnalysis }) {
  const moatColor = d.moatRating==='Wide' ? '#10b981' : d.moatRating==='Narrow' ? '#f59e0b' : 'var(--text-muted)';
  return (
    <div>
      <div className="stat-grid">
        {[['Industry',d.industry],['Market Size',d.marketSize],['Growth Rate',d.growthRate]].map(([k,v])=>(
          <div className="stat-cell" key={k}><div className="stat-key">{k}</div><div className="stat-val">{v}</div></div>
        ))}
        <div className="stat-cell">
          <div className="stat-key">Moat Rating</div>
          <div className="stat-val" style={{color:moatColor,fontWeight:800}}>{d.moatRating}</div>
        </div>
      </div>

      <DL label="Competitors"/>
      <div className="comp-grid">
        {d.competitors.map((c,i)=>(
          <div key={i} className="comp-card">
            <div className="comp-name">{c.name}</div>
            <div className="comp-pos">{c.marketPosition}</div>
            {c.strengths.map((s,j)=><div key={j} className="comp-str">{s}</div>)}
          </div>
        ))}
      </div>

      <div className="duo-grid">
        <div className="list-panel">
          <div className="list-panel-head pos">✦ Advantages</div>
          <ul className="item-list">
            {d.competitiveAdvantages.map((x,i)=><li key={i}><span className="item-dot pos"><Check size={14} /></span>{x}</li>)}
          </ul>
        </div>
        <div className="list-panel">
          <div className="list-panel-head neg">⚠ Threats</div>
          <ul className="item-list">
            {d.threats.map((x,i)=><li key={i}><span className="item-dot neg">!</span>{x}</li>)}
          </ul>
        </div>
      </div>

      {d.industryTrends?.length > 0 && (
        <>
          <DL label="Industry Trends"/>
          <div className="trend-list">
            {d.industryTrends.map((t,i)=>(
              <div key={i} className="trend-item">
                <span className="trend-icon">📈</span>
                {t}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Subtitles map ────────────────────────────────────── */
const SUBS: Record<string,string> = {
  company:   'Profile, sector & market cap',
  financial: 'Revenue, margins & key ratios',
  news:      'Sentiment analysis & headlines',
  industry:  'Competitive landscape & moat',
};

/* ─── Main ─────────────────────────────────────────────── */
export default function ResearchSection({ title, icon, data, type, score, defaultOpen=true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(()=>setOpen(defaultOpen),[defaultOpen]);
  if (!data) return null;

  const body = type==='company'   ? <Company d={data as CompanyInfo}/>
             : type==='financial' ? <Financial d={data as FinancialAnalysis}/>
             : type==='news'      ? <News d={data as NewsSentiment}/>
             : type==='industry'  ? <Industry d={data as IndustryAnalysis}/>
             : null;

  return (
    <div className={`card rcard ${open ? 'open' : ''}`} data-type={type}>
      
      {/* Header */}
      <div
        className="rcard-top"
        onClick={()=>setOpen(!open)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e=>e.key==='Enter'&&setOpen(!open)}
      >
        <div className="rcard-left">
          <div className="rcard-icon">{icon}</div>
          <div>
            <div className="rcard-title">{title}</div>
            <div className="rcard-sub">{SUBS[type]}</div>
          </div>
          {score !== undefined && <ScoreRing score={score}/>}
        </div>
        <span className="rcard-chevron">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </div>

      {/* Body */}
      <div className="rcard-body">
        <div className="rcard-inner">{body}</div>
      </div>
    </div>
  );
}

/* ─── Skeleton export ──────────────────────────────────── */
export { SkeletonCard };
