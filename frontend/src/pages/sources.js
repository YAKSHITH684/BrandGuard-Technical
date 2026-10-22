import React, { useState, useEffect } from "react";
import AppShell from "../components/AppShell/AppShell";
import { api } from "../services/api";
import {
  FolderGit2,
  Upload,
  Plus,
  Trash2,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen
} from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [glossary, setGlossary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);

  // New source form state
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState("guideline");
  const [content, setContent] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New term form state
  const [term, setTerm] = useState("");
  const [termType, setTermType] = useState("banned");
  const [replacement, setReplacement] = useState("");
  const [note, setNote] = useState("");

  const loadData = async () => {
    try {
      const [srcs, terms] = await Promise.all([api.getSources(), api.getGlossary()]);
      setSources(srcs || []);
      setGlossary(terms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSource = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append("title", title || file.name);
        formData.append("source_type", sourceType);
        if (effectiveDate) formData.append("effective_date", effectiveDate);
        if (expiresOn) formData.append("expires_on", expiresOn);
        formData.append("file", file);
        await api.uploadSourceFile(formData);
      } else {
        await api.pasteSource({
          title,
          source_type: sourceType,
          content,
          effective_date: effectiveDate || null,
          expires_on: expiresOn || null,
        });
      }
      setShowUploadModal(false);
      setTitle("");
      setContent("");
      setFile(null);
      setEffectiveDate("");
      setExpiresOn("");
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to ingest source");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!confirm("Are you sure you want to delete this source document and its vector chunks?")) return;
    try {
      await api.deleteSource(id);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to delete source");
    }
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    setSubmitting(true);
    try {
      await api.addGlossaryTerm({
        term,
        type: termType,
        replacement: replacement || null,
        note: note || null,
      });
      setShowTermModal(false);
      setTerm("");
      setReplacement("");
      setNote("");
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to add term");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTerm = async (id) => {
    try {
      await api.deleteGlossaryTerm(id);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to delete term");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FolderGit2 className="w-6 h-6 text-emerald-600" />
              Approved Brand Sources & Guidelines
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingest guidelines, verified fact sheets with validity dates, and prohibited terms into vector store.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowTermModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Term Rule
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              Ingest Source
            </button>
          </div>
        </div>

        {/* Source Documents Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Ingested Sources & Chunking Status ({sources.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading sources...</div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No approved sources uploaded yet. Ingest a guideline or fact sheet above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{s.title}</h3>
                      <button
                        onClick={() => handleDeleteSource(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] mb-3">
                      <span className="px-2 py-0.5 rounded-md font-semibold capitalize bg-emerald-100 text-emerald-800">
                        {s.source_type.replace("_", " ")}
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-200 text-slate-700">
                        {s.chunk_count} vector chunks
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-800 capitalize">
                        Status: {s.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200 flex justify-between">
                    <span>Uploaded: {new Date(s.uploaded_at).toLocaleDateString()}</span>
                    <span className="font-mono text-emerald-600">ID: {s.id.slice(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Glossary Terms Manager */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Workspace Terminology Rules ({glossary.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Term</th>
                  <th className="px-4 py-3 text-left">Policy Type</th>
                  <th className="px-4 py-3 text-left">Suggested Replacement</th>
                  <th className="px-4 py-3 text-left">Note / Explanation</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {glossary.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.term}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold uppercase text-[10px] ${
                          item.type === "banned"
                            ? "bg-rose-100 text-rose-800"
                            : item.type === "required"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-700 font-medium">
                      {item.replacement ? `"${item.replacement}"` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                      {item.note || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteTerm(item.id)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Delete term"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload/Paste Source Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSource}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
          >
            <h3 className="text-base font-bold text-slate-900 mb-2">Ingest Approved Brand Source</h3>
            <p className="text-xs text-slate-500 mb-4">
              Documents are parsed, sectioned into chunks, and embedded into pgvector.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q1 2025 Fact Sheet & Verified Benchmarks"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="guideline">Guideline (Tone, claims policy, voice)</option>
                  <option value="fact_sheet">Fact Sheet (Approved facts, metrics, benchmarks)</option>
                  <option value="glossary">Glossary / Terms</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expires On (Optional)
                  </label>
                  <input
                    type="date"
                    value={expiresOn}
                    onChange={(e) => setExpiresOn(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Upload (PDF, DOCX, TXT, MD)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.markdown"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-semibold"
                />
              </div>

              {!file && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Or Paste Source Content
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste guidelines, markdown sections, or bulleted benchmark facts here..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? "Processing & Embedding..." : "Ingest & Chunk"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTerm}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
          >
            <h3 className="text-base font-bold text-slate-900 mb-2">Add Terminology Rule</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term</label>
                <input
                  type="text"
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. HyperSync"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={termType}
                  onChange={(e) => setTermType(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="banned">Banned (Flag and suggest replacement)</option>
                  <option value="preferred">Preferred (Approved branding)</option>
                  <option value="required">Required (Must be included in draft)</option>
                </select>
              </div>

              {termType === "banned" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Suggested Replacement
                  </label>
                  <input
                    type="text"
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder="e.g. Acme LiveSync"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Deprecated in 2024 per naming policy"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowTermModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Save Term Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
