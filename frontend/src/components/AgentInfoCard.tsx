import React from 'react';
import { Volume2, VolumeX, Edit3, Compass, GraduationCap, HeartPulse, Headphones, Bot } from 'lucide-react';
import type { DomainInfo } from '../services/api-client';

interface AgentInfoCardProps {
  domain: DomainInfo;
  isMuted: boolean;
  onToggleMute: () => void;
  onEditPersona: () => void;
}

export const AgentInfoCard: React.FC<AgentInfoCardProps> = ({
  domain,
  isMuted,
  onToggleMute,
  onEditPersona,
}) => {
  const getDomainIcon = () => {
    switch (domain.domain) {
      case 'tourism':
        return Compass;
      case 'education':
        return GraduationCap;
      case 'healthcare':
        return HeartPulse;
      case 'customer_support':
        return Headphones;
      default:
        return Bot;
    }
  };

  const DomainIcon = getDomainIcon();
  const initials = domain.assistantName.slice(0, 2).toUpperCase();

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1.5px] flex-shrink-0 shadow-sm shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-display font-bold text-sm text-cyan-300">
              {initials}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white font-display truncate">
                {domain.assistantName}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                <DomainIcon className="w-3 h-3 text-cyan-400" />
                {domain.name}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-800/40">
                {domain.tone} Tone
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xl">
              {domain.persona}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
          <button
            onClick={onToggleMute}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isMuted
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
            }`}
            title={isMuted ? 'Unmute Audio (TTS disabled)' : 'Mute Audio (TTS enabled)'}
            aria-label={isMuted ? 'Audio currently muted. Click to enable speech synthesis.' : 'Audio currently active. Click to mute.'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isMuted ? 'TTS Muted' : 'TTS Active'}</span>
          </button>

          <button
            onClick={onEditPersona}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 text-cyan-300 border border-slate-700 hover:bg-slate-800 hover:border-cyan-500/40 transition-all"
            aria-label="Edit agent persona and domain configuration"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Persona</span>
          </button>
        </div>
      </div>
    </div>
  );
};
