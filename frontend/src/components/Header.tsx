import React, { useState } from 'react';
import {
  Radio,
  Bot,
  Sliders,
  Database,
  BarChart3,
  ChevronDown,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';
import type { DomainInfo } from '../services/api-client';

interface HeaderProps {
  activeTab: 'assistant' | 'wizard' | 'knowledge' | 'analytics';
  setActiveTab: (tab: 'assistant' | 'wizard' | 'knowledge' | 'analytics') => void;
  domains: DomainInfo[];
  selectedDomain: DomainInfo | null;
  onSelectDomain: (domain: DomainInfo) => void;
  isOpenRouterConfigured: boolean;
  selectedModel: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  domains,
  selectedDomain,
  onSelectDomain,
  isOpenRouterConfigured,
  selectedModel,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'assistant' as const, label: 'Voice Assistant', icon: Bot },
    { id: 'wizard' as const, label: 'Domain Wizard', icon: Sliders },
    { id: 'knowledge' as const, label: 'Knowledge / RAG', icon: Database },
    { id: 'analytics' as const, label: 'Admin & Analytics', icon: BarChart3 },
  ];

  return (
    <header className="w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-[1.5px] shadow-md shadow-purple-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white font-display">
                  Universal Voice AI
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  OpenRouter
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Domain-Agnostic Voice Platform
              </p>
            </div>
          </div>

          {/* Domain Selector (Desktop) */}
          <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
            <label htmlFor="domain-select" className="text-xs font-medium text-slate-400">
              Domain:
            </label>
            <div className="relative">
              <select
                id="domain-select"
                aria-label="Select Domain"
                value={selectedDomain?.id || ''}
                onChange={(e) => {
                  const found = domains.find((d) => d.id === e.target.value);
                  if (found) onSelectDomain(found);
                }}
                className="bg-transparent text-sm font-semibold text-cyan-400 focus:outline-none cursor-pointer pr-6 appearance-none"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name} ({d.assistantName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Model Status Badge & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                isOpenRouterConfigured
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
              title={
                isOpenRouterConfigured
                  ? `Active Model: ${selectedModel}`
                  : 'API Key Missing: Edit backend/.env'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOpenRouterConfigured
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] font-sans text-slate-400">
                {isOpenRouterConfigured ? 'Model:' : 'Setup:'}
              </span>
              <span className="truncate max-w-[110px]">
                {isOpenRouterConfigured
                  ? selectedModel.replace('meta-llama/', '').replace('openrouter/', '')
                  : 'Key Needed'}
              </span>
              {!isOpenRouterConfigured && (
                <KeyRound className="w-3 h-3 text-amber-400" />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-3">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <label htmlFor="mobile-domain-select" className="text-xs font-medium text-slate-400 block mb-1">
                Active Domain:
              </label>
              <select
                id="mobile-domain-select"
                value={selectedDomain?.id || ''}
                onChange={(e) => {
                  const found = domains.find((d) => d.id === e.target.value);
                  if (found) {
                    onSelectDomain(found);
                    setMobileMenuOpen(false);
                  }
                }}
                className="w-full bg-slate-900 text-sm font-semibold text-cyan-400 rounded-lg p-2 border border-slate-700"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.assistantName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
