import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { api, getApiBase, setApiBase } from "../../services/api";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  BookOpen,
  Cpu,
  Server,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Languages
} from "lucide-react";
import { speakText, stopSpeech, createSpeechRecognizer } from "../../utils/speech";

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
  const [backendStatus, setBackendStatus] = useState("unknown"); // "online" | "offline" | "checking" | "unknown"
  const [showConfig, setShowConfig] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [configFeedback, setConfigFeedback] = useState(null);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRecognizerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (chatRecognizerRef.current) {
        try {
          chatRecognizerRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const handleToggleVoiceInput = () => {
    if (isListeningMic) {
      if (chatRecognizerRef.current) {
        try {
          chatRecognizerRef.current.stop();
        } catch (e) {}
      }
      setIsListeningMic(false);
      return;
    }

    try {
      const rec = createSpeechRecognizer({
        onStart: () => setIsListeningMic(true),
        onEnd: () => setIsListeningMic(false),
        onResult: (spoken) => {
          if (spoken) {
            setInput((prev) => (prev ? `${prev} ${spoken}` : spoken));
          }
        },
        onError: () => setIsListeningMic(false)
      });
      if (rec) {
        chatRecognizerRef.current = rec;
        rec.start();
      }
    } catch (e) {
      setIsListeningMic(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      checkHealth();
      setCustomApiUrl(getApiBase());
    }
  }, [messages, isOpen]);

  const checkHealth = async () => {
    setBackendStatus("checking");
    try {
      await api.checkBackendHealth();
      setBackendStatus("online");
      return true;
    } catch (err) {
      setBackendStatus("offline");
      return false;
    }
  };

  const quickPrompts = [
    "Can I say 'fastest' in my copy?",
    "What is our verified 2025 SLA uptime?",
    "Is 'HyperSync' still an approved term?",
    "Can we claim zero downtime?"
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

      setBackendStatus("online");
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
      setBackendStatus("offline");
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `⚠️ ${err.message}`,
          isError: true,
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = async (url) => {
    const targetUrl = url || customApiUrl;
    setConfigFeedback({ type: "checking", msg: "Testing connection..." });
    try {
      setApiBase(targetUrl);
      const res = await api.checkBackendHealth();
      setBackendStatus("online");
      setConfigFeedback({
        type: "success",
        msg: `✓ Connected to ${res.service || "BrandGuard"} (Groq: ${res.groq_configured ? "Active" : "Offline fallback"})`
      });
      setTimeout(() => {
        setShowConfig(false);
        setConfigFeedback(null);
      }, 1500);
    } catch (err) {
      setBackendStatus("offline");
      setConfigFeedback({
        type: "error",
        msg: `✗ Connection failed: ${err.message}`
      });
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
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[460px] h-[600px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-3.5 flex items-center justify-between shadow-xs">
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
                <div className="flex items-center gap-2 text-[10px] text-emerald-200/80 mt-0.5">
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        backendStatus === "online"
                          ? "bg-emerald-400 animate-pulse"
                          : backendStatus === "checking"
                          ? "bg-amber-400 animate-spin"
                          : "bg-rose-400"
                      }`}
                    />
                    {backendStatus === "online"
                      ? "Connected"
                      : backendStatus === "checking"
                      ? "Connecting..."
                      : "Offline / Disconnected"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Link
                href="/voice"
                onClick={() => setIsOpen(false)}
                title="Launch Full Voice Agent & Audio Studio"
                className="px-2 py-1 bg-emerald-600/60 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold shadow-2xs"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">Voice Agent</span>
              </Link>
              <button
                onClick={() => setShowConfig(!showConfig)}
                title="Configure Backend API URL"
                className={`p-1.5 rounded-lg transition-colors ${
                  showConfig ? "bg-white/20 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Server className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Backend Configuration Bar */}
          {showConfig && (
            <div className="bg-slate-900 text-white p-3.5 border-b border-slate-800 text-xs space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-1.5 text-[11px] text-emerald-300">
                  <Server className="w-3.5 h-3.5" />
                  Backend API Endpoint Configuration
                </div>
                <button
                  onClick={checkHealth}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Test
                </button>
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  placeholder="https://your-service.onrender.com/api"
                  className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />

                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-slate-400">Quick Switch:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomApiUrl("http://localhost:8000/api");
                        handleSaveApiUrl("http://localhost:8000/api");
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700"
                    >
                      Localhost (8000)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomApiUrl("https://brandguard-technical1.onrender.com/api");
                        handleSaveApiUrl("https://brandguard-technical1.onrender.com/api");
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-slate-700"
                    >
                      Render Default
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleSaveApiUrl()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                  >
                    Save & Reconnect
                  </button>
                  {configFeedback && (
                    <span
                      className={`text-[11px] ${
                        configFeedback.type === "success"
                          ? "text-emerald-400"
                          : configFeedback.type === "checking"
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {configFeedback.msg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Prompts Bar */}
          {messages.length <= 2 && (
            <div className="bg-slate-50 border-b border-slate-200 p-2.5 overflow-x-auto">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider px-1">
                Suggested Brand Questions:
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
                      isUser ? "bg-slate-800" : m.isError ? "bg-rose-600" : "bg-emerald-600"
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : m.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      isUser
                        ? "bg-slate-900 text-white rounded-tr-none shadow-xs"
                        : m.isError
                        ? "bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none shadow-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Action button if error is connection-related */}
                    {m.isError && (
                      <div className="mt-2.5 pt-2 border-t border-rose-200 flex flex-wrap gap-2">
                        <button
                          onClick={() => setShowConfig(true)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <Server className="w-3 h-3" /> Configure Backend URL
                        </button>
                        <button
                          onClick={() => {
                            setApiBase("http://localhost:8000/api");
                            handleSaveApiUrl("http://localhost:8000/api");
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-medium"
                        >
                          Use Localhost:8000
                        </button>
                      </div>
                    )}

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

                    {/* Local TTS Speech Readout for Assistant message */}
                    {!isUser && !m.isError && (
                      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (speakingMsgIdx === idx) {
                              stopSpeech();
                              setSpeakingMsgIdx(null);
                            } else {
                              setSpeakingMsgIdx(idx);
                              speakText(m.content, {
                                onEnd: () => setSpeakingMsgIdx(null),
                                onError: () => setSpeakingMsgIdx(null),
                              });
                            }
                          }}
                          title={
                            speakingMsgIdx === idx
                              ? "Stop audio"
                              : "Read response aloud (Local on-device Web Speech API)"
                          }
                          className="text-[10px] text-slate-400 hover:text-emerald-700 flex items-center gap-1 transition font-medium"
                        >
                          {speakingMsgIdx === idx ? (
                            <>
                              <VolumeX className="w-3 h-3 text-emerald-600 animate-pulse" />
                              <span className="text-emerald-700 font-bold">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Read Aloud</span>
                            </>
                          )}
                        </button>
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
                placeholder={
                  isListeningMic
                    ? "Listening... speak your question now..."
                    : "Ask about brand rules or request copy rewrite..."
                }
                rows={2}
                className="w-full text-xs p-2.5 pr-16 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                title={isListeningMic ? "Stop voice listening" : "Speak question (Voice Input)"}
                className={`absolute right-9 bottom-2 p-1.5 rounded-lg transition-colors ${
                  isListeningMic
                    ? "bg-rose-600 text-white animate-pulse"
                    : "text-slate-400 hover:text-emerald-700 hover:bg-slate-100"
                }`}
              >
                {isListeningMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="absolute right-2 bottom-2 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-40 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
              <span>Press Enter to send · Shift+Enter for newline</span>
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
