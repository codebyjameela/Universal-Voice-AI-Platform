import React, { useEffect, useRef } from 'react';
import {
  User,
  Bot,
  Volume2,
  FileText,
  Wrench,
  Zap,
  Trash2,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export interface ChatEntry {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; content: string }>;
  toolsCalled?: Array<{ name: string; args: any; result: any }>;
  modelUsed?: string;
  latencyMs?: number;
  isError?: boolean;
}

interface TranscriptViewProps {
  entries: ChatEntry[];
  onSpeakText: (text: string) => void;
  onClear: () => void;
  onRetryLast?: () => void;
  isGenerating?: boolean;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  entries,
  onSpeakText,
  onClear,
  onRetryLast,
  isGenerating,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isGenerating]);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
      {/* Transcript Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
            Conversation
          </h3>
          {entries.length > 0 && (
            <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
              {entries.length} {entries.length === 1 ? 'message' : 'messages'}
            </span>
          )}
        </div>

        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-800"
            title="Clear conversation history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Transcript Body */}
      {entries.length === 0 ? (
        /* Compact Empty State */
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mb-2.5 border border-slate-700/60">
            <MessageSquare className="w-5 h-5 text-slate-500" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">No messages yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Start by speaking via the microphone orb above or asking a question below.
          </p>
        </div>
      ) : (
        /* Message Stream */
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[460px] space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`flex gap-3 ${entry.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {entry.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-purple-300" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  entry.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-sm shadow-sm shadow-purple-600/20'
                    : entry.isError
                    ? 'bg-rose-950/40 text-rose-200 border border-rose-800/60 rounded-tl-sm'
                    : 'bg-slate-800/90 text-slate-100 rounded-tl-sm border border-slate-700/60'
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      entry.sender === 'user'
                        ? 'text-purple-200'
                        : entry.isError
                        ? 'text-rose-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {entry.sender === 'user' ? 'You' : entry.isError ? 'Notice / Error' : 'AI Assistant'}
                  </span>
                  <span className="text-[10px] text-slate-400">{entry.timestamp}</span>
                </div>

                {/* Message Text */}
                <p className="whitespace-pre-wrap">{entry.text}</p>

                {/* Error Banner with Retry */}
                {entry.isError && onRetryLast && (
                  <div className="mt-3 pt-2.5 border-t border-rose-800/40 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      Configure key in backend/.env
                    </span>
                    <button
                      onClick={onRetryLast}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-900/60 hover:bg-rose-800/60 text-white px-2.5 py-1 rounded-md transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                )}

                {/* Knowledge Used (RAG Citations) */}
                {entry.sources && entry.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Knowledge Sources Consulted:</span>
                    </div>
                    <div className="space-y-1">
                      {entry.sources.map((s, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-amber-950/30 border border-amber-500/20 rounded-md px-2.5 py-1 text-amber-200"
                        >
                          📄 <strong>{s.title}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tool Calling Execution Record */}
                {entry.toolsCalled && entry.toolsCalled.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-xs text-purple-300">
                    <div className="flex items-center gap-1 font-semibold mb-1">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Tools Executed:</span>
                    </div>
                    <div className="space-y-1">
                      {entry.toolsCalled.map((t, i) => (
                        <div
                          key={i}
                          className="bg-purple-950/40 border border-purple-500/20 rounded px-2 py-1 font-mono text-[11px]"
                        >
                          {t.name}({JSON.stringify(t.args)}) ➔ {JSON.stringify(t.result)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistant Footer: Model, Latency, Audio Replay */}
                {entry.sender === 'ai' && !entry.isError && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                    <div className="flex items-center gap-2">
                      {entry.modelUsed && (
                        <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700/60 text-slate-300">
                          {entry.modelUsed.replace('meta-llama/', '').replace('openrouter/', '')}
                        </span>
                      )}
                      {entry.latencyMs !== undefined && (
                        <span className="flex items-center gap-0.5 text-emerald-400 text-[11px]">
                          <Zap className="w-3 h-3" />
                          {entry.latencyMs}ms
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onSpeakText(entry.text)}
                      title="Replay Audio via Text-to-Speech"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Replay
                    </button>
                  </div>
                )}
              </div>

              {entry.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-purple-700/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-purple-300" />
                </div>
              )}
            </div>
          ))}

          {/* Typing / Generating Indicator */}
          {isGenerating && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-300 animate-pulse" />
              </div>
              <div className="bg-slate-800/90 rounded-2xl px-4 py-2.5 border border-slate-700/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 ml-1">Assistant is thinking...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
