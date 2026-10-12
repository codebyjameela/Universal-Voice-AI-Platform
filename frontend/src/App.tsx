import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AgentInfoCard } from './components/AgentInfoCard';
import { VoiceOrb } from './components/VoiceOrb';
import { TranscriptView } from './components/TranscriptView';
import type { ChatEntry } from './components/TranscriptView';
import { SidebarPanel } from './components/SidebarPanel';
import { DomainWizard } from './components/DomainWizard';
import { AdminDashboard } from './components/AdminDashboard';
import { KnowledgeUploader } from './components/KnowledgeUploader';
import { VoiceService } from './services/voice-service';
import type { VoiceState } from './services/voice-service';
import { apiClient } from './services/api-client';
import type { DomainInfo, ModelInfo } from './services/api-client';
import { Send, Mic, Sparkles, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'wizard' | 'knowledge' | 'analytics'>('assistant');
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<DomainInfo | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('openrouter/auto');
  const [isOpenRouterConfigured, setIsOpenRouterConfigured] = useState<boolean>(false);

  // Voice state
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  // Conversation transcripts
  const [transcriptEntries, setTranscriptEntries] = useState<ChatEntry[]>([]);

  // Analytics stats
  const [stats, setStats] = useState({
    totalConversations: 0,
    voiceMinutes: 0.0,
    avgSessionSeconds: 45,
    llmRequests: 0,
    promptTokens: 0,
    completionTokens: 0,
    ragQueries: 0,
    toolCalls: 0,
    avgLatencyMs: 0,
    errorCount: 0,
  });

  const voiceServiceRef = useRef<VoiceService | null>(null);

  // Initialize data on mount
  useEffect(() => {
    async function init() {
      try {
        const status = await apiClient.checkStatus();
        setIsOpenRouterConfigured(status.configured);
        if (status.defaultModel) {
          setSelectedModel(status.defaultModel);
        }

        const domainList = await apiClient.getDomains();
        setDomains(domainList);
        if (domainList.length > 0) {
          const defaultDom = domainList.find((d) => d.domain === 'tourism') || domainList[0];
          setSelectedDomain(defaultDom);
        }

        const modelList = await apiClient.getModels();
        setModels(modelList);
      } catch (err) {
        console.warn('Initialization notice:', err);
      }
    }
    init();
  }, []);

  // Initialize VoiceService
  useEffect(() => {
    voiceServiceRef.current = new VoiceService({
      onStateChange: (state) => {
        setVoiceState(state);
        if (state === 'LISTENING') {
          setErrorMessage('');
        }
      },
      onTranscript: (text, isFinal) => {
        setInterimTranscript(text);
        if (isFinal) {
          handleUserSpeech(text);
        }
      },
      onError: (err) => {
        setErrorMessage(err);
      },
    });

    return () => {
      voiceServiceRef.current?.stopSpeaking();
      voiceServiceRef.current?.stopListening();
    };
  }, [selectedDomain]);

  /**
   * Handle user message input (Speech or Typed)
   */
  const handleUserSpeech = async (spokenText: string) => {
    const trimmed = spokenText.trim();
    if (!trimmed || isSubmitting) return;

    setInterimTranscript('');
    setLastUserMessage(trimmed);
    setIsSubmitting(true);
    setVoiceState('PROCESSING');
    setErrorMessage('');

    // Add user message to transcript
    const userMsgId = `user-${Date.now()}`;
    const userEntry: ChatEntry = {
      id: userMsgId,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscriptEntries((prev) => [...prev, userEntry]);

    try {
      const domainId = selectedDomain?.id || 'tourism-default';
      const pipelineRes = await apiClient.sendVoicePipeline(
        trimmed,
        domainId,
        'voice-session-user'
      );

      // Add AI reply to transcript
      const aiEntry: ChatEntry = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: pipelineRes.aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: pipelineRes.sourcesUsed,
        toolsCalled: pipelineRes.toolsCalled,
        modelUsed: pipelineRes.modelUsed,
        latencyMs: pipelineRes.latencyMs,
      };

      setTranscriptEntries((prev) => [...prev, aiEntry]);

      // Update analytics
      setStats((prev) => ({
        ...prev,
        llmRequests: prev.llmRequests + 1,
        totalConversations: prev.totalConversations + 1,
        promptTokens: prev.promptTokens + (pipelineRes.usage?.promptTokens || 50),
        completionTokens: prev.completionTokens + (pipelineRes.usage?.completionTokens || 40),
        avgLatencyMs: Math.round(
          prev.avgLatencyMs === 0 ? pipelineRes.latencyMs : (prev.avgLatencyMs + pipelineRes.latencyMs) / 2
        ),
        voiceMinutes: Number((prev.voiceMinutes + 0.2).toFixed(1)),
        ragQueries: prev.ragQueries + (pipelineRes.sourcesUsed ? 1 : 0),
        toolCalls: prev.toolCalls + (pipelineRes.toolsCalled ? pipelineRes.toolsCalled.length : 0),
      }));

      // Speak response via TTS if audio enabled
      if (!isMuted && voiceServiceRef.current) {
        voiceServiceRef.current.speak(
          pipelineRes.aiResponse,
          selectedDomain?.voice || 'alloy',
          'en-US'
        );
      } else {
        setVoiceState('IDLE');
      }
    } catch (err: any) {
      console.error('Voice Pipeline error:', err);
      const friendlyMsg = err.message || 'AI request failed.';
      setErrorMessage(friendlyMsg);
      setVoiceState('ERROR');

      // Append error notification entry in conversation
      const errorEntry: ChatEntry = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: friendlyMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setTranscriptEntries((prev) => [...prev, errorEntry]);

      setStats((prev) => ({
        ...prev,
        errorCount: prev.errorCount + 1,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleListen = () => {
    if (voiceState === 'LISTENING') {
      voiceServiceRef.current?.stopListening();
      setVoiceState('IDLE');
    } else {
      voiceServiceRef.current?.startListening();
    }
  };

  const handleInterrupt = () => {
    voiceServiceRef.current?.stopSpeaking();
    setVoiceState('IDLE');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isSubmitting) return;
    const msg = textInput;
    setTextInput('');
    handleUserSpeech(msg);
  };

  /**
   * Domain-specific suggestion prompts
   */
  const getDomainSuggestions = (): string[] => {
    switch (selectedDomain?.domain) {
      case 'tourism':
        return [
          'Plan a 5-day trip to Kerala',
          'Suggest destinations within ₹50,000',
          'What is the best time to visit Coorg?',
          'Recommend local Kerala dishes',
        ];
      case 'education':
        return [
          'Explain quantum superposition simply',
          'Calculate 50,000 * 0.18 for budget tax',
          'How does photosynthesis work?',
          'What are Kepler’s laws of planetary motion?',
        ];
      case 'healthcare':
        return [
          'What are healthy daily hydration tips?',
          'What are common symptoms of seasonal flu?',
          'How does sleep affect immune function?',
          'What is the clinic consultation schedule?',
        ];
      case 'customer_support':
        return [
          'How do I track my order delivery?',
          'What is your refund and return policy?',
          'How do I reset my account password?',
          'Can I speak with a customer specialist?',
        ];
      default:
        return [
          'What capabilities do you support?',
          'Search domain knowledge base',
          'Calculate budget estimates',
          'How can you assist me today?',
        ];
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        domains={domains}
        selectedDomain={selectedDomain}
        onSelectDomain={(d) => setSelectedDomain(d)}
        isOpenRouterConfigured={isOpenRouterConfigured}
        selectedModel={selectedModel}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: Voice Assistant Dashboard */}
        {activeTab === 'assistant' && selectedDomain && (
          <div className="space-y-6">
            {/* Compact Agent Header Card */}
            <AgentInfoCard
              domain={selectedDomain}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              onEditPersona={() => setActiveTab('wizard')}
            />

            {/* Balanced Two-Column SaaS Layout (67% main panel, 33% sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Main Interaction Panel (~68% desktop width) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm backdrop-blur-sm space-y-6">
                  {/* 1. Welcome and Instructions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight font-display">
                        Talk to Your AI Assistant
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Ask a question using your voice or type a message below.
                      </p>
                    </div>

                    {/* Step Guide Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800 self-start sm:self-center">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1. Choose Domain</span>
                      <span className="text-slate-600">➔</span>
                      <span>2. Speak or Type</span>
                    </div>
                  </div>

                  {/* 2. Microphone Control */}
                  <VoiceOrb
                    state={voiceState}
                    onToggleListen={handleToggleListen}
                    onInterrupt={handleInterrupt}
                    interimTranscript={interimTranscript}
                    assistantName={selectedDomain.assistantName}
                    errorMessage={errorMessage}
                  />

                  {/* 3. Message Composer */}
                  <div className="pt-2">
                    <form onSubmit={handleManualSubmit} className="flex gap-2.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder={`Ask ${selectedDomain.assistantName} a question...`}
                          disabled={isSubmitting}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-inner disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={handleToggleListen}
                          title="Click to talk via microphone"
                          aria-label="Toggle microphone speech recognition"
                          className="absolute right-3 top-3 text-slate-400 hover:text-cyan-400 transition-colors p-0.5"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!textInput.trim() || isSubmitting}
                        aria-label="Send message"
                        className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold text-sm shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </form>
                  </div>

                  {/* 4. Suggested Questions (below composer) */}
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Suggested Questions for {selectedDomain.assistantName}:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {getDomainSuggestions().map((promptText, i) => (
                        <button
                          key={i}
                          onClick={() => handleUserSpeech(promptText)}
                          disabled={isSubmitting}
                          className="text-xs bg-slate-800/80 hover:bg-purple-950/60 border border-slate-700/70 hover:border-purple-500/50 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl transition-all text-left disabled:opacity-50"
                        >
                          "{promptText}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Conversation Transcript (In main column) */}
                <TranscriptView
                  entries={transcriptEntries}
                  onSpeakText={(txt) => voiceServiceRef.current?.speak(txt)}
                  onClear={() => setTranscriptEntries([])}
                  onRetryLast={() => {
                    if (lastUserMessage) handleUserSpeech(lastUserMessage);
                  }}
                  isGenerating={isSubmitting}
                />
              </div>

              {/* Right: Secondary Panel (~32% desktop width) */}
              <div className="lg:col-span-4">
                <SidebarPanel
                  selectedDomain={selectedDomain}
                  isOpenRouterConfigured={isOpenRouterConfigured}
                  selectedModel={selectedModel}
                  isMuted={isMuted}
                  onOpenKnowledge={() => setActiveTab('knowledge')}
                  onOpenWizard={() => setActiveTab('wizard')}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Domain Wizard */}
        {activeTab === 'wizard' && (
          <DomainWizard
            onDomainCreated={(newDomain) => {
              setDomains((prev) => [newDomain, ...prev]);
              setSelectedDomain(newDomain);
              setActiveTab('assistant');
            }}
            onCancel={() => setActiveTab('assistant')}
          />
        )}

        {/* VIEW 3: Knowledge Base (RAG) */}
        {activeTab === 'knowledge' && selectedDomain && (
          <KnowledgeUploader activeDomainName={selectedDomain.name} />
        )}

        {/* VIEW 4: Admin Dashboard & Model Analytics */}
        {activeTab === 'analytics' && (
          <AdminDashboard
            models={models}
            selectedModel={selectedModel}
            onSelectModel={(model) => setSelectedModel(model)}
            stats={stats}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Universal Voice AI Platform • Powered by OpenRouter • DOMAIN = CONFIGURATION
      </footer>
    </div>
  );
};

export default App;
