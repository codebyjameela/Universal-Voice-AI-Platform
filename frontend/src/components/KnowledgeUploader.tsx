import React, { useState } from 'react';
import { Database, FileText, Plus, Search, Layers } from 'lucide-react';

interface KnowledgeDoc {
  id: string;
  title: string;
  chunksCount: number;
  uploadedAt: string;
  domain: string;
  sampleChunk: string;
}

export const KnowledgeUploader: React.FC<{ activeDomainName: string }> = ({
  activeDomainName,
}) => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([
    {
      id: 'doc-1',
      title: 'Kerala_Travel_Guide_2026.pdf',
      chunksCount: 24,
      uploadedAt: 'Today, 2:15 PM',
      domain: 'tourism',
      sampleChunk:
        'Alleppey (Alappuzha) is renowned for houseboat cruises on serene backwaters. Best travel window is October through March. Typical houseboat packages range from ₹9,000 to ₹18,000 per night inclusive of traditional Kerala meals.',
    },
    {
      id: 'doc-2',
      title: 'Kerala_Monsoon_Safety_&_Culinary_Guide.docx',
      chunksCount: 16,
      uploadedAt: 'Today, 2:18 PM',
      domain: 'tourism',
      sampleChunk:
        'Must-try dishes include Appam with Ishtu (vegetable/chicken stew), Karimeen Pollichathu (pearl spot fish wrapped in banana leaf), and Malabar Biryani.',
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddSnippet = () => {
    if (!newTitle || !newContent) return;
    const newDoc: KnowledgeDoc = {
      id: `doc-${Date.now()}`,
      title: newTitle.endsWith('.txt') ? newTitle : `${newTitle}.txt`,
      chunksCount: Math.ceil(newContent.length / 250),
      uploadedAt: 'Just now',
      domain: activeDomainName.toLowerCase(),
      sampleChunk: newContent.slice(0, 200),
    };
    setDocs([newDoc, ...docs]);
    setNewTitle('');
    setNewContent('');
  };

  const filtered = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sampleChunk.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 my-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white font-display">
                Domain Knowledge Base & RAG Vector Management
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Domain Grounding: <strong className="text-cyan-400">{activeDomainName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300">
              Embedding Provider: <strong>Local Vector Store</strong>
            </span>
          </div>
        </div>

        {/* Add Knowledge Input Box */}
        <div className="mt-6 bg-slate-900/60 p-4 rounded-xl border border-white/10 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Add Knowledge Text / Document Grounding
          </h3>
          <input
            type="text"
            placeholder="Document Title (e.g. Policies, Guidebook, FAQs.pdf)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <textarea
            rows={3}
            placeholder="Paste verified domain knowledge, facts, numbers, or rules here..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddSnippet}
              disabled={!newTitle || !newContent}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              Chunk & Embed into Knowledge Base
            </button>
          </div>
        </div>

        {/* Document List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Indexed Documents ({filtered.length})
            </h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-900/40 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <strong className="text-sm text-white">{doc.title}</strong>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      {doc.chunksCount} chunks
                    </span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 italic bg-slate-950/40 p-2 rounded border border-white/5">
                  "{doc.sampleChunk}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
