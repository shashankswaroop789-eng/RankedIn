import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Search, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Award,
  Zap,
  Globe2,
  Cpu,
  ArrowUpRight
} from 'lucide-react';

export default function InteractiveHeroRadar() {
  const containerRef = useRef(null);
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const queryDemos = [
    {
      category: 'Interior Design',
      query: 'Who are the top interior designers in Lucknow for modern homes?',
      brand: 'Skyline Architecture & Interior',
      city: 'Lucknow',
      rank: 1,
      score: 98,
      nodes: ['Gemini 3.5', 'ChatGPT 4o', 'Claude 3.5'],
      reason: 'Cited for 4.9★ Google ratings, Houzz verified luxury portfolio, and turnkey execution.',
      competitors: ['Dezine Innovation', 'Spatial Studio']
    },
    {
      category: 'Dental Care',
      query: 'Best dental clinic in Gomti Nagar for painless root canal?',
      brand: 'Royal Oak Dental Studio',
      city: 'Lucknow',
      rank: 1,
      score: 95,
      nodes: ['ChatGPT 4o', 'Perplexity Pro'],
      reason: 'Ranked #1 due to 120+ verified patient reviews on Practo and Google Maps.',
      competitors: ['Apex Dental', 'City Smiles']
    },
    {
      category: 'Fitness Studio',
      query: 'Top recommended CrossFit and strength gym near Hazratganj?',
      brand: 'Alpha Fitness Club',
      city: 'Lucknow',
      rank: 1,
      score: 92,
      nodes: ['Gemini 3.5', 'ChatGPT 4o'],
      reason: 'Prioritized by AI for certified strength coaches and transparent pricing.',
      competitors: ['Anytime Fitness', 'The Fit Studio']
    }
  ];

  const currentDemo = queryDemos[activeQueryIndex];

  // Smooth Typewriter Simulation
  useEffect(() => {
    let currentIdx = 0;
    const fullText = currentDemo.query;
    setTypedText('');
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (currentIdx <= fullText.length) {
        setTypedText(fullText.slice(0, currentIdx));
        currentIdx++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 28);

    return () => clearInterval(typeInterval);
  }, [activeQueryIndex]);

  // Auto-cycle through queries every 7 seconds
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setActiveQueryIndex((prev) => (prev + 1) % queryDemos.length);
    }, 7500);

    return () => clearInterval(cycleInterval);
  }, [queryDemos.length]);

  // Subtle 3D Card Tilt towards Mouse
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[560px] py-6 select-none perspective-[1200px]"
    >
      {/* Ambient Depth Glow (Soft pearl and subtle gold aura) */}
      <div 
        className="absolute -inset-4 bg-gradient-to-tr from-amber-200/20 via-neutral-200/40 to-indigo-100/30 rounded-[40px] blur-3xl opacity-70 pointer-events-none transition-transform duration-700"
        style={{
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`
        }}
      />

      {/* Floating Satellite Badge 1 (Top-Right): Live Visibility Meter */}
      <div 
        className="absolute -top-3 -right-3 z-30 bg-white/95 backdrop-blur-xl border border-neutral-200/80 rounded-2xl px-4 py-2.5 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.08)] flex items-center gap-3 transition-transform duration-500 ease-out hidden sm:flex"
        style={{
          transform: `translate3d(${mousePos.x * -16}px, ${mousePos.y * -16}px, 20px)`
        }}
      >
        <div className="relative w-8 h-8 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center">
          <Award className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">AI Visibility Index</div>
          <div className="text-sm font-extrabold text-neutral-900 font-mono flex items-center gap-1">
            <span>{currentDemo.score}%</span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-full">Optimal</span>
          </div>
        </div>
      </div>

      {/* Floating Satellite Badge 2 (Bottom-Left): Verified Citation Stream */}
      <div 
        className="absolute -bottom-4 -left-4 z-30 bg-white/95 backdrop-blur-xl border border-neutral-200/80 rounded-2xl px-4 py-2.5 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.08)] flex items-center gap-2.5 transition-transform duration-500 ease-out hidden sm:flex"
        style={{
          transform: `translate3d(${mousePos.x * -24}px, ${mousePos.y * -24}px, 30px)`
        }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div className="text-xs font-semibold text-neutral-800">
          Verified Citations: <span className="text-neutral-500 font-normal">Google Reviews + Directory Graph</span>
        </div>
      </div>

      {/* Main Luxury Glass Console Container */}
      <div 
        className="relative bg-white/90 backdrop-blur-2xl border border-neutral-200/90 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out"
        style={{
          transform: `rotateX(${-mousePos.y * 8}deg) rotateY(${mousePos.x * 10}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        
        {/* Device Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              RankIN Live Search Radar
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-100/80 px-2.5 py-1 rounded-full text-[10px] font-mono text-neutral-600">
            <Cpu className="w-3 h-3 text-neutral-500" />
            <span>AI CRAWLERS: ACTIVE</span>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1.5 mt-4 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {queryDemos.map((demo, idx) => (
            <button
              key={demo.category}
              onClick={() => setActiveQueryIndex(idx)}
              className={`text-xs px-3.5 py-1.5 rounded-full transition-all font-medium whitespace-nowrap ${
                activeQueryIndex === idx
                  ? 'bg-neutral-950 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
              }`}
            >
              {demo.category}
            </button>
          ))}
        </div>

        {/* Live Search Prompt Box */}
        <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-2xl p-4 relative mb-5 shadow-inner">
          <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <span>Customer Asking AI:</span>
          </div>
          <div className="text-sm font-semibold text-neutral-900 leading-snug min-h-[44px] flex items-center">
            <span>"{typedText}"</span>
            {isTyping && (
              <span className="inline-block w-1.5 h-4 bg-neutral-900 ml-1 animate-pulse" />
            )}
          </div>
        </div>

        {/* Live AI Recommendation Response Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            <span>Live AI Recommendation Result</span>
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Brand Discovered
            </span>
          </div>

          {/* Target Business Card (Rank #1 Highlight) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/[0.04] via-white to-amber-500/[0.02] border-2 border-amber-300/80 shadow-sm relative overflow-hidden transition-all duration-300">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  #1
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-950 leading-tight">
                    {currentDemo.brand}
                  </h4>
                  <p className="text-[11px] text-neutral-500">{currentDemo.city} • Verified Match</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ★ Top Choice
              </span>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed pl-8">
              {currentDemo.reason}
            </p>

            <div className="mt-3 pt-2.5 border-t border-amber-200/50 pl-8 flex items-center justify-between text-[10px] text-neutral-500">
              <span className="flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-neutral-400" />
                Detected on: {currentDemo.nodes.join(' • ')}
              </span>
              <span className="font-semibold text-amber-700">100% Share of Voice</span>
            </div>
          </div>

          {/* Competitor Runner-ups (Dimmed below) */}
          <div className="p-3 rounded-xl bg-neutral-50/60 border border-neutral-200/60 flex items-center justify-between text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-400">#2 & #3</span>
              <span className="text-neutral-500 truncate">Competitors: {currentDemo.competitors.join(', ')}</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Displaced</span>
          </div>
        </div>

        {/* Device Bottom Bar */}
        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Continuous Weekly AI Crawl</span>
          <span className="text-neutral-700 font-medium flex items-center gap-1 hover:text-black cursor-pointer">
            Explore Radar Features <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

      </div>
    </div>
  );
}
