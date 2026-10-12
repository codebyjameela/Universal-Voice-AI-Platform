import React from 'react';
import { Mic, Volume2, Square, AlertCircle, Loader2 } from 'lucide-react';
import type { VoiceState } from '../services/voice-service';

interface VoiceOrbProps {
  state: VoiceState;
  onToggleListen: () => void;
  onInterrupt: () => void;
  interimTranscript: string;
  assistantName: string;
  errorMessage?: string;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  onToggleListen,
  onInterrupt,
  interimTranscript,
  assistantName,
  errorMessage,
}) => {
  const getOrbVisuals = () => {
    switch (state) {
      case 'LISTENING':
        return {
          label: 'Listening... Speak now.',
          sublabel: 'Speak naturally into your microphone',
          color: 'from-cyan-500 to-blue-600',
          glow: 'shadow-cyan-500/50 ring-4 ring-cyan-500/30 animate-pulse',
          icon: Mic,
          iconClass: 'animate-pulse text-white',
        };
      case 'PROCESSING':
        return {
          label: 'Processing your request...',
          sublabel: 'OpenRouter AI agent is reasoning',
          color: 'from-purple-600 to-indigo-600',
          glow: 'shadow-purple-500/40 ring-4 ring-purple-500/20',
          icon: Loader2,
          iconClass: 'animate-spin text-white',
        };
      case 'SPEAKING':
        return {
          label: `${assistantName} is speaking...`,
          sublabel: 'Tap orb or button below to interrupt',
          color: 'from-emerald-500 to-teal-600',
          glow: 'shadow-emerald-500/50 ring-4 ring-emerald-500/30',
          icon: Volume2,
          iconClass: 'text-white',
        };
      case 'ERROR':
        return {
          label: 'Voice Connection Issue',
          sublabel: errorMessage || 'Tap to retry microphone connection',
          color: 'from-rose-600 to-red-700',
          glow: 'shadow-rose-500/40 ring-4 ring-rose-500/20',
          icon: AlertCircle,
          iconClass: 'text-white',
        };
      default:
        return {
          label: 'Tap the microphone to start speaking.',
          sublabel: 'Or type your question in the composer below',
          color: 'from-slate-800 to-slate-900',
          glow: 'hover:shadow-purple-500/20 hover:ring-2 hover:ring-purple-500/30',
          icon: Mic,
          iconClass: 'text-slate-300 group-hover:text-white',
        };
    }
  };

  const visuals = getOrbVisuals();
  const IconComponent = visuals.icon;

  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      {/* Microphone Button Container */}
      <div className="relative mb-4 flex items-center justify-center">
        {/* Active Ambient Glow Background */}
        {(state === 'LISTENING' || state === 'SPEAKING' || state === 'PROCESSING') && (
          <div
            className={`absolute w-36 h-36 rounded-full blur-2xl opacity-40 transition-all duration-500 ${
              state === 'LISTENING'
                ? 'bg-cyan-500'
                : state === 'SPEAKING'
                ? 'bg-emerald-500'
                : 'bg-purple-600'
            }`}
          />
        )}

        {/* Central Circular Control */}
        <button
          onClick={state === 'SPEAKING' ? onInterrupt : onToggleListen}
          disabled={state === 'PROCESSING'}
          aria-label={
            state === 'SPEAKING'
              ? 'Interrupt AI speech'
              : state === 'LISTENING'
              ? 'Stop listening'
              : 'Start speaking with microphone'
          }
          className={`relative group w-28 h-28 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-gradient-to-br ${visuals.color} ${visuals.glow} border-2 border-slate-700/60 shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-80 disabled:cursor-not-allowed`}
        >
          <IconComponent className={`w-10 h-10 ${visuals.iconClass}`} />
        </button>
      </div>

      {/* State Label & Sublabel */}
      <h3 className="text-sm font-semibold text-white tracking-wide font-display">
        {visuals.label}
      </h3>
      <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
        {visuals.sublabel}
      </p>

      {/* Waveform Visualization during speech/listening */}
      {(state === 'LISTENING' || state === 'SPEAKING') && (
        <div className="h-6 flex items-center justify-center gap-1 mt-3" aria-hidden="true">
          {[20, 35, 50, 30, 45, 25, 40, 20].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all ${
                state === 'LISTENING' ? 'bg-cyan-400' : 'bg-emerald-400'
              }`}
              style={{
                height: `${h * 0.4}px`,
                animation: `waveform-bounce 0.8s ease-in-out infinite alternate ${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Live Interim Transcript Capsule */}
      {interimTranscript && (
        <div className="mt-3 max-w-md px-4 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 italic animate-pulse">
          "{interimTranscript}"
        </div>
      )}

      {/* Speech Interruption Control */}
      {state === 'SPEAKING' && (
        <button
          onClick={onInterrupt}
          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/60 text-xs font-semibold transition-all shadow-sm"
        >
          <Square className="w-3 h-3 fill-current" />
          Interrupt Assistant
        </button>
      )}
    </div>
  );
};
