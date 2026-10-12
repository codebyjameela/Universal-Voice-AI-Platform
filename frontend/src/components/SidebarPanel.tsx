import React from 'react';
import {
  Sparkles,
  Mic,
  Volume2,
  Database,
  Wrench,
  CheckCircle2,
  Calculator,
  CloudSun,
  Search,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import type { DomainInfo } from '../services/api-client';

interface SidebarPanelProps {
  selectedDomain: DomainInfo;
  isOpenRouterConfigured: boolean;
  selectedModel: string;
  isMuted: boolean;
  onOpenKnowledge: () => void;
  onOpenWizard: () => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  selectedDomain,
  isOpenRouterConfigured,
  selectedModel,
  isMuted,
  onOpenKnowledge,
  onOpenWizard,
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Card 1: Agent & Domain Profile */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
              Domain Blueprint
            </h3>
          </div>
          <button
            onClick={onOpenWizard}
            className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Configure →
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Domain:</span>
            <span className="text-white font-medium capitalize">{selectedDomain.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Assistant Name:</span>
            <span className="text-cyan-300 font-semibold">{selectedDomain.assistantName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Speaking Tone:</span>
            <span className="text-purple-300 font-medium capitalize">{selectedDomain.tone}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Active Model:</span>
            <span className="text-emerald-400 font-mono text-[11px] truncate max-w-[150px]">
              {selectedModel.replace('meta-llama/', '').replace('openrouter/', '')}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Audience:</span>
            <span className="text-slate-300 text-right max-w-[170px] truncate">
              {selectedDomain.targetAudience}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Voice Pipeline Status */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
          <Mic className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
            Voice Pipeline
          </h3>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              Speech-to-Text:
            </span>
            <span className="text-slate-200 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Web Speech API
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              Text-to-Speech:
            </span>
            <span className="text-slate-200 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {isMuted ? 'Muted' : 'SpeechSynthesis'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Interruption:
            </span>
            <span className="text-emerald-400 font-medium">Enabled (Instant)</span>
          </div>
        </div>
      </div>

      {/* Card 3: Knowledge / RAG Status */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
              Knowledge Grounding (RAG)
            </h3>
          </div>
          <button
            onClick={onOpenKnowledge}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Manage →
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Indexed Documents:</span>
            <span className="text-slate-200 font-medium">2 Files Indexed</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Vector Store:</span>
            <span className="text-emerald-400 font-medium">Active (Semantic Search)</span>
          </div>
        </div>
      </div>

      {/* Card 4: Domain Tools */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
          <Wrench className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
            Enabled Agent Tools
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {selectedDomain.enabledTools.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80"
            >
              {tool === 'calculator' && <Calculator className="w-3 h-3 text-cyan-400" />}
              {tool === 'weather' && <CloudSun className="w-3 h-3 text-amber-400" />}
              {tool === 'knowledge_search' && <Search className="w-3 h-3 text-purple-400" />}
              {tool}
            </span>
          ))}
          {selectedDomain.enabledTools.length === 0 && (
            <span className="text-xs text-slate-500 italic">No tools enabled for this domain</span>
          )}
        </div>
      </div>

      {/* Card 5: OpenRouter API Configuration Notice */}
      {!isOpenRouterConfigured && (
        <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>OpenRouter Setup Required</span>
          </div>
          <p className="text-[11px] text-amber-300/80 leading-relaxed">
            To generate live AI responses, add your API key in:
            <br />
            <code className="text-white font-mono bg-amber-900/60 px-1 py-0.5 rounded text-[10px]">
              backend/.env
            </code>
          </p>
          <div className="pt-1">
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300 font-semibold text-[11px]"
            >
              Get OpenRouter Key →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
