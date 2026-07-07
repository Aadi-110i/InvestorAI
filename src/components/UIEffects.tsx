'use client';

import { useEffect, useRef, useState } from 'react';

export function CursorGlow() {
  return null; // Removed for the light theme as per reference
}

interface NavbarProps { isAnalyzing: boolean; company?: string; }

export function Navbar({ isAnalyzing, company }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className="navbar" style={{
      borderBottom: scrolled ? '1px solid var(--border-card)' : 'none',
      background: scrolled ? 'rgba(255,255,255,0.9)' : 'transparent',
      backdropFilter: scrolled ? 'blur(10px)' : 'none'
    }}>
      <div className="nav-logo">
        <div className="nav-logo-icon">I</div>
        InvestorAI
      </div>
      <div className="nav-right">
        <a href="#" className="nav-link">Product</a>
        <a href="#" className="nav-link">Pricing</a>
        <a href="#" className="nav-link">Blog</a>
      </div>
    </nav>
  );
}
