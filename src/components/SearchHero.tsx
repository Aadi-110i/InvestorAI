'use client';

import { useState } from 'react';

interface SearchHeroProps {
  onSearch: (company: string) => void;
  isLoading: boolean;
  compact?: boolean;
  lastQuery?: string;
  onReset?: () => void;
}

export default function SearchHero({ onSearch, isLoading, compact, lastQuery, onReset }: SearchHeroProps) {
  const [val, setVal] = useState('');

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (val.trim() && !isLoading) {
      onSearch(val.trim());
      setVal('');
    }
  };

  if (compact) {
    return (
      <div className="hero compact">
        <div className="search-wrap" style={{ maxWidth: '800px', display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
          <div style={{
            fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em', flexShrink: 0,
            cursor: 'pointer'
          }} onClick={onReset}>
            InvestorAI
          </div>
          <form className="search-bar" onSubmit={submit} style={{ margin: 0, padding: '4px 4px 4px 16px' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Analyze another company..."
              value={val}
              onChange={e => setVal(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="search-btn" disabled={!val.trim() || isLoading}>
              ↑
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="hero">
      <h1 className="hero-title">
        Invest smarter.
        <span>Automatically.</span>
      </h1>
      <p className="hero-sub">
        Create institutional-grade research that answers real investment questions — and show up ready to invest.
      </p>

      <div className="search-wrap">
        <form className="search-bar" onSubmit={submit}>
          <input
            type="text"
            className="search-input"
            placeholder="How to start researching Apple Inc..."
            value={val}
            onChange={e => setVal(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <button type="submit" className="search-btn" disabled={!val.trim() || isLoading}>
            ↑
          </button>
        </form>

        <div className="search-tags">
          <span className="search-tag" onClick={() => { setVal('Apple'); submit(); }}>Apple</span>
          <span className="search-tag" onClick={() => { setVal('Tesla'); submit(); }}>Tesla</span>
          <span className="search-tag" onClick={() => { setVal('NVIDIA'); submit(); }}>NVIDIA</span>
        </div>
      </div>
    </div>
  );
}
