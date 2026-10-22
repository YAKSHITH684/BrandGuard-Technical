import React, { useState, useRef, useEffect } from "react";
import { api } from "../../services/api";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  BookOpen,
  Cpu,
  CornerDownLeft,
  ChevronDown,
  Minimize2,
  Maximize2
} from "lucide-react";

export default function GroqChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your **BrandGuard AI Copilot** powered by Groq & Llama 3.3. Ask me anything about your brand voice, claims policies, approved metrics, or request an instant compliant rewrite!",
      sources: []
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "Can I say 'fastest' in my copy?",
    "What is our verified 2025 SLA uptime?",
    "Is 'HyperSync' still an approved term?",
    "How should I describe our SOC2 compliance?"
  ];

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.chatWithAssistant(text, history);

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: res.reply,
          sources: res.cited_sources || [],
          model: res.model_used,
          ai_status: res.ai_status
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `⚠️ Failed to fetch advice: ${err.message}. Ensure your backend is running.`,
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Launcher Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full shadow-2xl shadow-emerald-700/40 border border-emerald-400/30 transition-all hover:scale-105 group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">BrandGuard AI Copilot</span>
          <span className="bg-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
            Groq Llama 3.3
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[440px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                <Bot className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  BrandGuard AI Copilot
                  <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                    Groq
                  </span>
                </h3>
                <span className="text-[10px] text-emerald-200/80">
                  Grounded in workspace guidelines & fact sheets
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          {messages.length <= 2 && (
            <div className="bg-slate-50 border-b border-slate-200 p-2.5 overflow-x-auto">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider px-1">
                Suggested Inquiries:
              </div>
              <div className="flex gap-1.5 flex-nowrap">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg text-[11px] font-medium border border-slate-200 transition-colors shadow-2xs"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40 text-xs">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${
                      isUser ? "bg-slate-800" : "bg-emerald-600"
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      isUser
                        ? "bg-slate-900 text-white rounded-tr-none shadow-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Cited Source Chunks */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                        <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          Approved Citations ({m.sources.length})
                        </div>
                        {m.sources.slice(0, 2).map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-emerald-50/70 p-1.5 rounded text-[10px] text-emerald-950 italic border border-emerald-100"
                          >
                            <span className="font-semibold text-emerald-800 not-italic block">
                              {s.section}:
                            </span>
                            "{s.content.slice(0, 110)}..."
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2 bg-white rounded-xl border border-slate-200 max-w-fit shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span>Consulting workspace guidelines & fact sheets...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about brand rules or request copy rewrite..."
                rows={2}
                className="w-full text-xs p-2.5 pr-10 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="absolute right-2 bottom-2 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-40 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
              <span>Press Enter to send · Shift+Enter for new line</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-slate-400" />
                Groq API · Llama 3.3
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
