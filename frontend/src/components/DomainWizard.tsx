import React, { useState } from 'react';
import {
  GraduationCap,
  Compass,
  HeartPulse,
  Building2,
  Headphones,
  Users,
  Home,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Wrench,
  FileUp,
} from 'lucide-react';
import { apiClient } from '../services/api-client';
import type { DomainInfo } from '../services/api-client';

interface DomainWizardProps {
  onDomainCreated: (newDomain: DomainInfo) => void;
  onCancel: () => void;
}

const TEMPLATES = [
  { id: 'education', title: 'Education', icon: GraduationCap, desc: 'Interactive tutor & study coach' },
  { id: 'tourism', title: 'Tourism', icon: Compass, desc: 'Local travel & itinerary expert' },
  { id: 'healthcare', title: 'Healthcare', icon: HeartPulse, desc: 'Wellness navigator & clinic triage' },
  { id: 'banking', title: 'Banking', icon: Building2, desc: 'Financial accounts & query guide' },
  { id: 'customer_support', title: 'Customer Support', icon: Headphones, desc: 'Tier-1 resolution & order lookup' },
  { id: 'hr', title: 'HR & Recruiting', icon: Users, desc: 'Employee onboarding & HR policies' },
  { id: 'real_estate', title: 'Real Estate', icon: Home, desc: 'Property listings & neighborhood guide' },
  { id: 'custom', title: 'Custom Domain', icon: Sparkles, desc: 'Create any domain from scratch' },
];

export const DomainWizard: React.FC<DomainWizardProps> = ({
  onDomainCreated,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('tourism');

  // Form state
  const [formData, setFormData] = useState({
    name: 'Kerala Tourism Guide',
    domain: 'tourism',
    description: 'Expert travel and cultural advisor for Kerala backwaters, hill stations, and cuisine',
    targetAudience: 'Tourists and families exploring Kerala',
    assistantName: 'KeralaSathi',
    persona: 'Knowledgeable and cheerful local Malayali guide speaking fluent English',
    tone: 'friendly',
    language: 'English',
    voice: 'alloy',
    responseLength: 'concise',
    rules: [
      'Focus on authentic local culture and monsoon safety',
      'Provide realistic travel time estimates between cities',
    ],
    enabledTools: ['weather', 'calculator'],
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'education') {
      setFormData((prev) => ({
        ...prev,
        domain: 'education',
        name: 'STEM Study Partner',
        assistantName: 'StudyMate',
        persona: 'Patient academic tutor explaining complex concepts with simple analogies',
        tone: 'encouraging',
        enabledTools: ['calculator'],
      }));
    } else if (templateId === 'healthcare') {
      setFormData((prev) => ({
        ...prev,
        domain: 'healthcare',
        name: 'Clinic Health Navigator',
        assistantName: 'CareCompanion',
        persona: 'Empathetic healthcare guide helping users navigate common wellness questions',
        tone: 'empathetic',
        enabledTools: [],
      }));
    } else if (templateId === 'customer_support') {
      setFormData((prev) => ({
        ...prev,
        domain: 'customer_support',
        name: 'E-Commerce HelpDesk',
        assistantName: 'HelpDeskPro',
        persona: 'Prompt and courteous customer support specialist',
        tone: 'professional',
        enabledTools: ['calculator'],
      }));
    }
  };

  const handleFinish = async () => {
    try {
      const created = await apiClient.createDomain({
        ...formData,
        instructions: [
          `Act as ${formData.assistantName}, the ${formData.persona}`,
          `Maintain a ${formData.tone} voice communication style`,
          `Keep answers ${formData.responseLength} for natural spoken speech`,
        ],
        rules: formData.rules,
      });
      onDomainCreated(created);
    } catch (err: any) {
      alert(`Error creating domain: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 my-4 shadow-sm">
      {/* Wizard Header Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>STEP {step} OF 5</span>
          <span>{Math.round((step / 5) * 100)}% COMPLETE</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Screen 1: Choose Your Domain */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-2 font-display">
            Screen 1: Choose Your Domain
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Select a pre-configured domain archetype or start with a custom domain blueprint.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateSelect(tmpl.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="mb-3">
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{tmpl.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tmpl.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 2: Configure Assistant Persona & Tone */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-2 font-display">
            Screen 2: Configure AI Assistant
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Customize the agent persona, tone, voice cadence, and behavior rules.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Domain Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Assistant Name
              </label>
              <input
                type="text"
                value={formData.assistantName}
                onChange={(e) => setFormData({ ...formData, assistantName: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Persona Description
              </label>
              <input
                type="text"
                value={formData.persona}
                onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tone</label>
              <select
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value as any })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="friendly">Friendly & Welcoming</option>
                <option value="professional">Professional & Authoritative</option>
                <option value="encouraging">Encouraging & Patient</option>
                <option value="concise">Concise & Direct</option>
                <option value="empathetic">Empathetic & Caring</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Voice Response Length
              </label>
              <select
                value={formData.responseLength}
                onChange={(e) => setFormData({ ...formData, responseLength: e.target.value as any })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="concise">Concise (Ideal for spoken voice)</option>
                <option value="balanced">Balanced</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Upload Knowledge (RAG) */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-2 font-display">
            Screen 3: Upload Domain Knowledge (RAG)
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Attach reference material so OpenRouter answers with authoritative domain grounding.
          </p>

          <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center bg-slate-900/40">
            <FileUp className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">Upload Knowledge Files</h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, DOCX, TXT, CSV, XLSX, Markdown
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">
                📄 Kerala_Travel_Guide.pdf (Pre-loaded)
              </span>
              <span className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">
                📄 Hotel_Information.pdf (Pre-loaded)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Screen 4: Configure Tools */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-2 font-display">
            Screen 4: Configure Domain Tools
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Enable autonomous capabilities for OpenRouter function calling.
          </p>

          <div className="space-y-3">
            {[
              { id: 'calculator', name: 'Calculator & Math', desc: 'Perform numeric calculations and budget conversions' },
              { id: 'weather', name: 'Weather Forecast', desc: 'Fetch live simulated climate and destination temperature' },
              { id: 'knowledge_search', name: 'Semantic RAG Search', desc: 'Search uploaded document vector store' },
              { id: 'database_search', name: 'Database Query', desc: 'Search relational database records' },
            ].map((tool) => {
              const isChecked = formData.enabledTools.includes(tool.id);
              return (
                <label
                  key={tool.id}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-purple-950/30 border-purple-500/50'
                      : 'bg-slate-900/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wrench className={`w-5 h-5 ${isChecked ? 'text-purple-400' : 'text-slate-400'}`} />
                    <div>
                      <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
                      <p className="text-xs text-slate-400">{tool.desc}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, enabledTools: [...formData.enabledTools, tool.id] });
                      } else {
                        setFormData({
                          ...formData,
                          enabledTools: formData.enabledTools.filter((t) => t !== tool.id),
                        });
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-white/20"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 5: Test & Activate */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-2 font-display">
            Screen 5: Test Your Voice Agent
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Review your domain configuration before launching into the voice studio.
          </p>

          <div className="bg-slate-900/70 rounded-2xl p-6 border border-white/10 space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Domain</span>
              <strong className="text-white">{formData.name}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Assistant Name</span>
              <strong className="text-cyan-400">{formData.assistantName}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Persona</span>
              <span className="text-slate-200 text-right max-w-sm">{formData.persona}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Tone & Length</span>
              <span className="text-slate-200 capitalize">{formData.tone} ({formData.responseLength})</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Enabled Tools</span>
              <span className="text-purple-300 font-mono text-xs">{formData.enabledTools.join(', ') || 'None'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/10">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold hover:text-white transition-all"
          >
            Cancel
          </button>
        )}

        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
          >
            Next Step
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Check className="w-4 h-4" />
            Activate Voice Agent
          </button>
        )}
      </div>
    </div>
  );
};
