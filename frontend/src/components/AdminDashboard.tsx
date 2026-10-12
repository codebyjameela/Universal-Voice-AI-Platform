import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Coins,
  Zap,
  CheckCircle2,
  Shuffle,
} from 'lucide-react';
import type { ModelInfo } from '../services/api-client';

interface AdminDashboardProps {
  models: ModelInfo[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  stats: {
    totalConversations: number;
    voiceMinutes: number;
    avgSessionSeconds: number;
    llmRequests: number;
    promptTokens: number;
    completionTokens: number;
    ragQueries: number;
    toolCalls: number;
    avgLatencyMs: number;
    errorCount: number;
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  models,
  selectedModel,
  onSelectModel,
  stats,
}) => {
  const [filterTier, setFilterTier] = useState<string>('all');
  const [isAutoRouting, setIsAutoRouting] = useState<boolean>(
    selectedModel === 'openrouter/auto'
  );

  const filteredModels = models.filter(
    (m) => filterTier === 'all' || m.tier === filterTier
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 my-4">
      {/* Top Banner: OpenRouter Intelligence Layer Controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white font-display">
                OpenRouter Intelligence Routing & Model Configuration
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Centralized LLM routing endpoint: <code className="text-cyan-300">https://openrouter.ai/api/v1</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextState = !isAutoRouting;
                setIsAutoRouting(nextState);
                if (nextState) {
                  onSelectModel('openrouter/auto');
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isAutoRouting
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              {isAutoRouting ? 'Auto-Routing Active' : 'Enable Auto-Routing'}
            </button>
          </div>
        </div>

        {/* Model Selector & Filter */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Active LLM Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                onSelectModel(e.target.value);
                setIsAutoRouting(e.target.value === 'openrouter/auto');
              }}
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-sm text-cyan-300 font-mono focus:outline-none"
            >
              <option value="openrouter/auto">⚡ openrouter/auto (Auto Router)</option>
              {filteredModels.map((m) => (
                <option key={m.id} value={m.id} className="text-white">
                  [{m.tier?.toUpperCase()}] {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Filter by Model Category
            </label>
            <div className="flex gap-1">
              {['all', 'recommended', 'fast', 'balanced', 'advanced', 'low-cost'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTier(t)}
                  className={`text-[11px] capitalize px-2 py-1.5 rounded-md border transition-all ${
                    filterTier === t
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Available Models:</span>
              <strong className="text-white text-base">{models.length} Live Models</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Fallback Strategy:</span>
              <strong className="text-emerald-400">Llama-3.3-70B</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Voice Minutes</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {stats.voiceMinutes.toFixed(1)} <span className="text-xs font-normal text-slate-400">min</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {stats.totalConversations} sessions initiated
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>LLM Requests</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">{stats.llmRequests}</p>
          <span className="text-[11px] text-emerald-400 mt-1 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% via OpenRouter
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Token Consumption</span>
            <Coins className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {(stats.promptTokens + stats.completionTokens).toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            In: {stats.promptTokens} | Out: {stats.completionTokens}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Pipeline Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {stats.avgLatencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Tools: {stats.toolCalls} | RAG: {stats.ragQueries}
          </span>
        </div>
      </div>
    </div>
  );
};
