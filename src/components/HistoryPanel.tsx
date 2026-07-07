'use client';

import { useState, useEffect } from 'react';

export interface HistoryEntry {
  id: string;
  company: string;
  verdict: 'INVEST' | 'PASS' | 'WATCH';
  confidence: number;
  timestamp: number;
}

interface Props {
  current?: string;
  onSelect: (company: string) => void;
}

const STORAGE_KEY = 'investorai_history';
const VERDICT_COLOR: Record<string, string> = {
  INVEST: '#10b981',
  PASS:   '#ef4444',
  WATCH:  '#f59e0b',
};
const VERDICT_EMOJI: Record<string, string> = {
  INVEST: '🚀',
  PASS:   '🛑',
  WATCH:  '👁️',
};

export function saveHistory(entry: HistoryEntry) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(e => e.company.toLowerCase() !== entry.company.toLowerCase());
    const updated = [entry, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export default function HistoryPanel({ current, onSelect }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setHistory(raw ? JSON.parse(raw) : []);
      } catch {
        setHistory([]);
      }
    };
    load();
    window.addEventListener('storage', load);
    // Also poll every 2s to pick up new saves
    const t = setInterval(load, 2000);
    return () => { window.removeEventListener('storage', load); clearInterval(t); };
  }, []);

  if (history.length === 0) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        className="history-toggle"
        onClick={() => setOpen(o => !o)}
        title="Search history"
        aria-label="Toggle history panel"
        aria-expanded={open}
      >
        <span className="history-toggle-icon">📋</span>
        <span className="history-toggle-label">History</span>
        <span className="history-toggle-count">{history.length}</span>
      </button>

      {/* Slide-in panel */}
      <div className={`history-panel ${open ? 'open' : ''}`} role="complementary" aria-label="Search history">
        <div className="history-panel-inner">
          <div className="history-panel-head">
            <div className="history-panel-title">Recent Searches</div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close history">✕</button>
          </div>
          <div className="history-list">
            {history.map(entry => (
              <button
                key={entry.id}
                className={`history-item ${current?.toLowerCase() === entry.company.toLowerCase() ? 'active' : ''}`}
                onClick={() => { onSelect(entry.company); setOpen(false); }}
              >
                <span className="history-emoji">{VERDICT_EMOJI[entry.verdict] || '📊'}</span>
                <div className="history-item-body">
                  <div className="history-item-name">{entry.company}</div>
                  <div className="history-item-meta">
                    <span style={{ color: VERDICT_COLOR[entry.verdict], fontWeight: 700, fontSize: '0.72rem' }}>
                      {entry.verdict}
                    </span>
                    <span className="history-meta-dot">·</span>
                    <span className="history-item-conf">{entry.confidence}% confidence</span>
                    <span className="history-meta-dot">·</span>
                    <span className="history-item-time">
                      {new Date(entry.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {open && <div className="history-backdrop" onClick={() => setOpen(false)} aria-hidden />}
    </>
  );
}
