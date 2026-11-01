import React, { useState } from 'react';
import InteractiveHeroRadar from './components/InteractiveHeroRadar';
import AdSenseBanner from './components/AdSenseBanner';
import PrivacyModal from './components/PrivacyModal';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  Tag, 
  RefreshCw, 
  Layers, 
  ShieldAlert, 
  Award, 
  ExternalLink,
  ChevronDown,
  Compass,
  Zap,
  Globe2,
  Download,
  FileText
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Interior Designer');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedModelPerPrompt, setSelectedModelPerPrompt] = useState({});
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleDownloadPdf = async () => {
    if (!results) return;
    try {
      setPdfDownloading(true);
      const res = await fetch(`${API_BASE}/api/audit/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results)
      });
      if (!res.ok) {
        throw new Error('Failed to generate PDF. Server returned error.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanBizName = (results.business_name || 'Business').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `RankIN_Audit_${cleanBizName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setPdfDownloading(false);
    }
  };

  // Helper functions to guarantee clean human text (no raw JSON or brackets)
  const formatSnippet = (text) => {
    if (!text) return '';
    if (text.includes('"brief_summary"') || text.trim().startsWith('{')) {
      const summaryMatch = text.match(/"brief_summary":\s*"([^"]+)"/);
      if (summaryMatch) return summaryMatch[1];
      const recsMatch = text.match(/"recommended_businesses":\s*\[([^\]]+)\]/);
      if (recsMatch) {
        const brands = recsMatch[1].replace(/["']/g, '').split(',').map(s => s.trim()).filter(Boolean);
        if (brands.length > 0) {
          return `AI recommended ${brands.join(', ')} as premier local options based on high customer ratings and verified presence.`;
        }
      }
    }
    return text.replace(/^[{\[\s"]+|[}\]\s"]+$/g, '').trim();
  };

  const formatBrand = (name) => {
    if (!name || typeof name !== 'string') return '';
    let cleaned = name
      .replace(/"?(recommended_businesses|sources_or_factors|brief_summary)"?:?\s*/gi, '')
      .replace(/[{}[\]"]/g, '')
      .trim();
    cleaned = cleaned.replace(/^[:,\s]+|[:,\s]+$/g, '');
    return cleaned;
  };

  const categories = [
    'Interior Designer',
    'Architectural Firm',
    'Modular Kitchen Studio',
    'Dental Clinic',
    'Dermatologist & Skin Clinic',
    'Fine Dining & Rooftop Cafe',
    'Gym & CrossFit Studio',
    'Corporate Lawyer',
    'CA & Tax Consultant',
    'Digital Marketing Agency',
    'Real Estate Agency',
    'Wedding Photographer',
    'Luxury Salon & Spa',
    'Study Abroad Consultant'
  ];

  const popularCities = ['Lucknow', 'Mumbai', 'Delhi NCR', 'Bangalore', 'Dubai', 'London'];

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!businessName.trim() || !city.trim()) {
      setError('Please provide your Business Name and Target City.');
      return;
    }

    setError(null);
    setLoading(true);
    setResults(null);
    setIsScannerOpen(true);

    setLoadingStep('Accessing AI Model Nodes (Gemini 3.5 & ChatGPT)...');
    const t1 = setTimeout(() => setLoadingStep('Analyzing local recommendation clusters...'), 1400);
    const t2 = setTimeout(() => setLoadingStep('Extracting competitor share of voice...'), 2600);
    const t3 = setTimeout(() => setLoadingStep('Synthesizing multi-model visibility insights...'), 5000);

    try {
      const response = await fetch(`${API_BASE}/api/scan/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          city: city,
          category: selectedCategory || 'Local Business',
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'The AI scan engine is initializing. Please retry in a few seconds.');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.warn('API error, falling back to demo state:', err);
      setError(`${err.message} (You can also click "Explore Opportunities" to inspect the live simulation).`);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoSimulation = () => {
    setBusinessName('Skyline Architecture & Interior');
    setCity('Lucknow');
    setSelectedCategory('Interior Designer');
    setError(null);
    setIsScannerOpen(true);

    setResults({
      business_name: 'Skyline Architecture & Interior',
      city: 'Lucknow',
      category: 'Interior Designer',
      visibility_score: 67,
      total_prompts: 3,
      mentioned_prompts_count: 2,
      total_model_checks: 9,
      total_model_mentions: 6,
      total_model_omissions: 3,
      models_evaluated: [
        { name: 'Google Gemini', badge: 'Gemini 3.5', provider: 'Google', visibility_score: 67 },
        { name: 'Meta Llama', badge: 'Llama 3.3 (Groq)', provider: 'Meta', visibility_score: 100 },
        { name: 'DeepSeek', badge: 'DeepSeek R1', provider: 'DeepSeek', visibility_score: 33 }
      ],
      top_competitors: [
        { name: 'Dezine Innovation', count: 3, share: '100%' },
        { name: 'Spatial Design Studio', count: 2, share: '66%' },
        { name: 'Interio Craft Lucknow', count: 2, share: '66%' }
      ],
      sources_detected: [
        'Google Business Profile (4.9 Stars, 120+ reviews)',
        'Houzz India Verified Design Index',
        'LucknowTalks Local Brand Digest',
        'Architectural Digest India Mentions'
      ],
      prompts_results: [
        {
          prompt: 'Best luxury interior designer in Lucknow for 4BHK apartments',
          is_mentioned: false,
          rank: null,
          recommended_leaders: ['Dezine Innovation', 'Spatial Design Studio'],
          ai_snippet: 'Gemini recommended Dezine Innovation as the primary recommendation citing high portfolio ratings and proven luxury residential projects in Gomti Nagar.',
          models: [
            {
              model_name: 'Google Gemini',
              badge: 'Gemini 3.5',
              is_mentioned: false,
              rank: null,
              ai_snippet: 'Gemini recommended Dezine Innovation as the primary recommendation citing high portfolio ratings and proven luxury residential projects in Gomti Nagar.',
              recommended_leaders: ['Dezine Innovation', 'Spatial Design Studio']
            },
            {
              model_name: 'Meta Llama',
              badge: 'Llama 3.3 (Groq)',
              is_mentioned: true,
              rank: 1,
              ai_snippet: 'Llama 3.3 crawled regional directory citations and recommended Skyline Architecture as a premier modern 4BHK interior firm in Lucknow.',
              recommended_leaders: ['Dezine Innovation', 'Interio Craft']
            },
            {
              model_name: 'DeepSeek',
              badge: 'DeepSeek R1',
              is_mentioned: false,
              rank: null,
              ai_snippet: 'DeepSeek reasoning prioritized Dezine Innovation due to high review density and verified turnkey contract history.',
              recommended_leaders: ['Dezine Innovation', 'Spatial Studio']
            }
          ]
        },
        {
          prompt: 'Top rated modern architectural firm in Lucknow for residential villas',
          is_mentioned: true,
          rank: 1,
          recommended_leaders: ['Interio Craft', 'Dezine Innovation'],
          ai_snippet: 'Gemini featured Skyline Architecture at #1 for contemporary facade designs and reliable turnkey architectural supervision.',
          models: [
            {
              model_name: 'Google Gemini',
              badge: 'Gemini 3.5',
              is_mentioned: true,
              rank: 1,
              ai_snippet: 'Gemini featured Skyline Architecture at #1 for contemporary facade designs and reliable turnkey architectural supervision.',
              recommended_leaders: ['Interio Craft', 'Dezine Innovation']
            },
            {
              model_name: 'Meta Llama',
              badge: 'Llama 3.3 (Groq)',
              is_mentioned: true,
              rank: 1,
              ai_snippet: 'Llama 3.3 prioritized Skyline Architecture based on 4.9-star Google Maps verification and architectural awards.',
              recommended_leaders: ['Dezine Innovation', 'Spatial Design']
            },
            {
              model_name: 'DeepSeek',
              badge: 'DeepSeek R1',
              is_mentioned: true,
              rank: 2,
              ai_snippet: 'DeepSeek recognized Skyline Architecture as a top modern architecture firm alongside Dezine Innovation.',
              recommended_leaders: ['Dezine Innovation', 'Interio Craft']
            }
          ]
        },
        {
          prompt: 'Who are the most trusted commercial interior designers in Lucknow?',
          is_mentioned: false,
          rank: null,
          recommended_leaders: ['Spatial Design Studio', 'Dezine Innovation'],
          ai_snippet: 'Spatial Design Studio was selected due to consistent corporate directory citations, client testimonials, and regional commercial case studies.',
          models: [
            {
              model_name: 'Google Gemini',
              badge: 'Gemini 3.5',
              is_mentioned: false,
              rank: null,
              ai_snippet: 'Gemini selected Spatial Design Studio due to consistent corporate directory citations and regional commercial case studies.',
              recommended_leaders: ['Spatial Design Studio', 'Dezine Innovation']
            },
            {
              model_name: 'Meta Llama',
              badge: 'Llama 3.3 (Groq)',
              is_mentioned: true,
              rank: 2,
              ai_snippet: 'Llama 3.3 indexed Skyline Architecture among verified commercial interior studios in Lucknow.',
              recommended_leaders: ['Spatial Design Studio', 'Dezine Innovation']
            },
            {
              model_name: 'DeepSeek',
              badge: 'DeepSeek R1',
              is_mentioned: false,
              rank: null,
              ai_snippet: 'DeepSeek selected Spatial Design Studio and Dezine Innovation for corporate commercial fitouts.',
              recommended_leaders: ['Spatial Design Studio', 'Dezine Innovation']
            }
          ]
        }
      ]
    });

    // Smooth scroll to results
    setTimeout(() => {
      document.getElementById('audit-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#0A0D14] flex flex-col font-sans selection:bg-neutral-900 selection:text-white relative">
      
      {/* Top Header / Navigation (FANCY / Apple Style) */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 h-24 flex items-center justify-between z-30">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="font-extrabold text-2xl tracking-tight text-neutral-950 font-sans">
              Rank<span className="text-neutral-400">IN</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-950 text-white text-[10px] font-bold tracking-widest uppercase">
              AI
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            <a href="#scanner" className="hover:text-neutral-950 transition">AI Radar 2026</a>
            <a href="#how-it-works" className="hover:text-neutral-950 transition">Intelligence</a>
            <div className="flex items-center gap-1 cursor-pointer hover:text-neutral-950 transition">
              <span>Platform</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <a href="#sources" className="hover:text-neutral-950 transition">Citations Graph</a>
            <a href="#pricing" className="hover:text-neutral-950 transition">Marketplace</a>
          </nav>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-4">
          <button
            onClick={loadDemoSimulation}
            className="hidden sm:inline-block text-xs font-semibold text-neutral-700 hover:text-neutral-950 px-4 py-2 transition"
          >
            Live Demo
          </button>
          <button 
            onClick={() => {
              setIsScannerOpen(true);
              document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full transition shadow-sm hover:shadow-md active:scale-95"
          >
            Get started
          </button>
        </div>
      </header>

      {/* HERO SECTION (Faithfully matching Dribbble shot: "Your Gateway to...") */}
      <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 pt-10 pb-20 sm:pb-28 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden">
        
        {/* Left Column: Bold Typography & CTAs */}
        <div className="w-full lg:w-1/2 space-y-8 z-20">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.04em] text-neutral-950 leading-[1.06]">
            Your Gateway to <br />
            <span className="text-neutral-950">AI Visibility</span>
          </h1>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsScannerOpen(true);
                document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-black hover:bg-neutral-800 text-white font-medium text-sm px-7 py-3.5 rounded-full transition shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>Run Free AI Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={loadDemoSimulation}
              className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 font-medium text-sm px-7 py-3.5 rounded-full transition shadow-sm hover:shadow active:scale-95"
            >
              Explore Opportunities
            </button>
          </div>

          {/* Minimalist Subtext (Matching the Dribbble description layout) */}
          <div className="pt-12 max-w-md">
            <p className="text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed">
              RankIN protocol connects growth companies and verified local businesses with transparent access to generative AI recommendation assets, including exclusive ranking tracking across ChatGPT, Gemini, and Claude.
            </p>
          </div>
        </div>

        {/* Right Column: Tailored Interactive AI Search Radar Console */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative min-h-[460px]">
          <InteractiveHeroRadar />
        </div>

      </section>

      {/* FLOATING LUXURY AUDIT CAPSULE / SEARCH DOCK */}
      <section id="scanner" className="w-full max-w-5xl mx-auto px-6 mb-16 relative z-30">
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.07)] backdrop-blur-xl">
          
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5 text-neutral-800 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Live AI Recommendation Terminal
            </span>
            <span className="font-mono text-[11px] text-neutral-400">NODES: GEMINI 3.5 & CHATGPT</span>
          </div>

          <form onSubmit={handleScan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              
              {/* Business Name */}
              <div className="md:col-span-5 relative">
                <Building2 className="w-4 h-4 absolute left-4 top-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Business Name (e.g. Skyline Architecture)"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-neutral-50/70 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition"
                  required
                />
              </div>

              {/* City Input */}
              <div className="md:col-span-3 relative">
                <MapPin className="w-4 h-4 absolute left-4 top-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="City (e.g. Lucknow)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-neutral-50/70 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition"
                  required
                />
              </div>

              {/* Category Select */}
              <div className="md:col-span-4 relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-neutral-50/70 border border-neutral-200 rounded-2xl px-4 py-3.5 text-sm text-neutral-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition appearance-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Quick City Pills & Submit Button Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-neutral-400 font-medium mr-1">Popular:</span>
                {popularCities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                      city === c
                        ? 'bg-neutral-950 text-white border-neutral-950'
                        : 'bg-neutral-100/70 border-neutral-200/80 text-neutral-600 hover:bg-neutral-200/60'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm px-8 py-3.5 rounded-2xl transition shadow-sm hover:shadow flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{loadingStep || 'Querying AI Models...'}</span>
                  </>
                ) : (
                  <>
                    <span>Run AI Recommendation Scan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>

      {/* RESULTS DASHBOARD (High-End White Aesthetic) */}
      {results && (
        <section id="audit-results" className="w-full max-w-5xl mx-auto px-6 mb-24 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
          
          {/* Main Score Card */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-8 sm:p-10 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.06)] relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  AI Recommendation Audit
                </div>
                <h2 className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                  {results.business_name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <p className="text-neutral-500 text-sm">
                    Location: <span className="text-neutral-800 font-medium">{results.city}</span> • Category: <span className="text-neutral-800 font-medium">{results.category}</span>
                  </p>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={pdfDownloading}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition"
                  >
                    {pdfDownloading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Download PDF Audit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Clean Metric Badge */}
              <div className="flex items-center gap-5 bg-neutral-50 border border-neutral-200/80 px-6 py-4 rounded-2xl">
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Visibility Index
                  </div>
                  <div className={`text-3xl font-extrabold ${
                    results.visibility_score >= 70 ? 'text-emerald-600' : results.visibility_score >= 40 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {results.visibility_score}%
                  </div>
                </div>
                <div className="h-10 w-px bg-neutral-200" />
                <div className="text-xs text-neutral-600 space-y-1">
                  <div>
                    Cited: <strong className="text-neutral-900">
                      {results.total_model_mentions ?? results.mentioned_prompts_count} of {results.total_model_checks ?? (results.total_prompts * 3)}
                    </strong> AI checks
                  </div>
                  <div className={(results.total_model_omissions ?? (results.total_prompts - results.mentioned_prompts_count)) > 0 ? "text-rose-600 font-medium" : "text-emerald-600 font-medium"}>
                    {(results.total_model_omissions ?? (results.total_prompts - results.mentioned_prompts_count)) > 0
                      ? `Omitted in ${results.total_model_omissions ?? (results.total_prompts - results.mentioned_prompts_count)} AI evaluation${(results.total_model_omissions ?? 1) > 1 ? 's' : ''}`
                      : '100% full coverage across all models'}
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Model Score Breakdown Strip */}
            {results.models_evaluated && results.models_evaluated.length > 0 && (
              <div className="mt-6 pt-5 border-t border-neutral-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center justify-between">
                  <span>Free Models Evaluated</span>
                  <span className="text-neutral-500 font-normal">Cross-LLM Search Benchmark</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {results.models_evaluated.map((m, mIdx) => (
                    <div key={mIdx} className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/60 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{m.name}</div>
                        <div className="text-xs font-semibold text-neutral-800">{m.badge}</div>
                      </div>
                      <div className={`text-lg font-extrabold font-mono ${
                        m.visibility_score >= 70 ? 'text-emerald-600' : m.visibility_score >= 40 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {m.visibility_score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Google AdSense Responsive Unit */}
          <AdSenseBanner adSlot="4589231012" className="my-2" />

          {/* Bento Grid: Competitors & Citations + Prompts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Competitor Share of Voice */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Competitor Share of Voice
                </h3>

                <div className="space-y-3">
                  {results.top_competitors?.map((comp, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800 truncate">
                          #{idx + 1} {formatBrand(comp.name)}
                        </span>
                        <span className="font-bold text-neutral-900">{comp.share}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full"
                          style={{ width: comp.share }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sources Detected */}
                <div className="mt-6 pt-5 border-t border-neutral-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-neutral-700" />
                    Citation Sources AI Used
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {results.sources_detected?.map((src, i) => (
                      <li key={i} className="flex items-center gap-2 text-neutral-700 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
                        <span className="truncate">{src}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right: Query by Query AI Transcripts */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-neutral-700" />
                  Query-by-Query AI Transcripts
                </h3>
                <span className="text-xs text-neutral-400 font-mono">3 Queries Tested</span>
              </div>

              {results.prompts_results?.map((item, idx) => {
                const activeModelIdx = selectedModelPerPrompt[idx] ?? 0;
                const activeModel = (item.models && item.models[activeModelIdx]) ? item.models[activeModelIdx] : item;
                const isItemMentioned = activeModel.is_mentioned;
                const itemRank = activeModel.rank;

                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-3xl border p-6 transition-all shadow-sm ${
                      isItemMentioned
                        ? 'border-emerald-300/80 bg-emerald-50/20'
                        : 'border-neutral-200/90'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 mt-0.5">
                          Q{idx + 1}
                        </span>
                        <span className="font-semibold text-sm text-neutral-900 leading-snug">
                          "{item.prompt}"
                        </span>
                      </div>

                      <div>
                        {isItemMentioned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mentioned {itemRank ? `(#${itemRank})` : ''}
                            {activeModel.badge && (
                              <span className="text-[10px] opacity-75 font-normal">({activeModel.badge})</span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Omitted
                            {activeModel.badge && (
                              <span className="text-[10px] opacity-75 font-normal">({activeModel.badge})</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Multi-Model Switcher Tabs */}
                    {item.models && item.models.length > 0 && (
                      <div className="flex items-center gap-2 my-3 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mr-1">
                          Free Models:
                        </span>
                        {item.models.map((m, mIdx) => {
                          const isSelected = activeModelIdx === mIdx;
                          return (
                            <button
                              key={mIdx}
                              type="button"
                              onClick={() => setSelectedModelPerPrompt(prev => ({ ...prev, [idx]: mIdx }))}
                              className={`text-xs px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 font-medium ${
                                isSelected
                                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm'
                                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                              }`}
                            >
                              <span>{m.badge || m.model_name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                m.is_mentioned ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-500'
                              }`}>
                                {m.is_mentioned ? `#${m.rank || 1}` : 'Omitted'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-xs space-y-2">
                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                        <span>{activeModel.model_name || 'AI'} Recommendation Analysis:</span>
                        <span className="font-mono text-[10px] text-neutral-400 font-normal">Free AI Node</span>
                      </div>
                      <p className="text-neutral-700 leading-relaxed font-normal">
                        {formatSnippet(activeModel.ai_snippet)}
                      </p>

                      {activeModel.recommended_leaders?.map(formatBrand).filter(Boolean).length > 0 && (
                        <div className="pt-2 border-t border-neutral-200/60 flex items-center gap-1.5 flex-wrap">
                          <span className="text-neutral-400 text-[11px] font-medium">Recommended Brands:</span>
                          {activeModel.recommended_leaders.map(formatBrand).filter(Boolean).map((lead, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-900 font-semibold text-xs shadow-2xs">
                              {lead}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing & Upgrade Card */}
          <div className="bg-neutral-950 text-white rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Automated 24/7 AI Radar
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white max-w-xl mx-auto">
              Never Miss a Customer Searching on ChatGPT or Gemini
            </h3>

            <p className="text-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
              Track 10 custom queries weekly, receive instant competitor displacement alerts, and get actionable directory steps to secure top recommendations.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => alert('Phase 5 will link this to payment checkout (₹499/mo India, $9/mo Global)!')}
                className="bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-sm px-8 py-3.5 rounded-full transition shadow-md"
              >
                Start 24/7 Tracking (₹499 / $9 mo)
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={pdfDownloading}
                className="bg-white/10 hover:bg-white/15 text-white font-medium text-sm px-7 py-3.5 rounded-full border border-white/15 transition flex items-center gap-2 justify-center"
              >
                {pdfDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Preparing PDF Report...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </section>
      )}

      {/* Global Minimalist Footer */}
      <footer className="w-full border-t border-neutral-200/80 bg-white py-8 mt-auto text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-neutral-950">RankIN Protocol</span>
            <span>— The Gateway to AI Search Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="text-neutral-500 hover:text-neutral-900 underline transition cursor-pointer"
            >
              Privacy & Advertising Policy
            </button>
            <span>•</span>
            <div>© 2026 RankIN Inc. Inspired by Swiss Minimalist Fintech Design.</div>
          </div>
        </div>
      </footer>

      {/* Google AdSense Compliant Privacy Policy Modal */}
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

    </div>
  );
}
