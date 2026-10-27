import React, { useState, useEffect, useRef } from "react";
import AppShell from "../components/AppShell/AppShell";
import { api } from "../services/api";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Sparkles,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  ShieldAlert,
  Play,
  Square,
  RefreshCw,
  FileText
} from "lucide-react";
import {
  speakText,
  stopSpeech,
  isSpeaking,
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  SUPPORTED_LANGUAGES,
  getDictationOptIn,
  setDictationOptIn
} from "../utils/speech";
import { useRouter } from "next/router";

export default function VoiceAgentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("agent"); // "agent" | "file_translator"

  // Live Voice Agent State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeakingAgent, setIsSpeakingAgent] = useState(false);
  const [agentMode, setAgentMode] = useState("conversation"); // "conversation" | "translation"
  const [inputLanguage, setInputLanguage] = useState("en-US");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [voiceHistory, setVoiceHistory] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your BrandGuard Voice Agent. Tap the microphone to talk or translate audio in real-time.",
      language: "en-US"
    }
  ]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const recognizerRef = useRef(null);

  // Audio File Translator State
  const [audioFile, setAudioFile] = useState(null);
  const [fileTargetLang, setFileTargetLang] = useState("en");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [fileTranslationResult, setFileTranslationResult] = useState(null);
  const [audioRecording, setAudioRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Handle Live Voice Interaction
  const startListening = () => {
    setErrorMsg("");
    setLiveTranscript("");
    stopSpeech();
    setIsSpeakingAgent(false);

    try {
      const recognizer = createSpeechRecognizer({
        lang: inputLanguage,
        onStart: () => setIsListening(true),
        onEnd: () => setIsListening(false),
        onResult: (spokenText) => {
          if (spokenText) {
            setLiveTranscript(spokenText);
            handleSendSpokenInput(spokenText);
          }
        },
        onError: (err) => {
          console.error("Recognizer error:", err);
          setIsListening(false);
          if (err.error === "not-allowed") {
            setErrorMsg("Microphone permission denied. Please allow microphone access.");
          } else if (err.error !== "no-speech") {
            setErrorMsg(`Speech recognition error: ${err.error}`);
          }
        }
      });

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to initialize speech recognition.");
    }
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleSendSpokenInput = async (spokenText) => {
    stopListening();
    setIsProcessing(true);

    const userEntry = { role: "user", content: spokenText, language: inputLanguage };
    setVoiceHistory((prev) => [...prev, userEntry]);

    try {
      const historyContext = voiceHistory.slice(-4).map((h) => ({ role: h.role, content: h.content }));
      const res = await api.voiceAgentChat({
        message: spokenText,
        language: inputLanguage,
        mode: agentMode,
        target_language: targetLanguage,
        history: historyContext
      });

      const replyText = res.reply || "I could not process that audio.";
      const assistantEntry = {
        role: "assistant",
        content: replyText,
        language: agentMode === "translation" ? targetLanguage : "en-US",
        model: res.model_used
      };

      setVoiceHistory((prev) => [...prev, assistantEntry]);

      // Speak back the response
      speakText(replyText, {
        lang: agentMode === "translation" ? `${targetLanguage}-US` : "en-US",
        onStart: () => setIsSpeakingAgent(true),
        onEnd: () => setIsSpeakingAgent(false),
        onError: () => setIsSpeakingAgent(false)
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(`Agent error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setLiveTranscript("");
    }
  };

  const handleToggleSpeakMessage = (text, lang) => {
    if (isSpeakingAgent) {
      stopSpeech();
      setIsSpeakingAgent(false);
    } else {
      speakText(text, {
        lang: lang || "en-US",
        onStart: () => setIsSpeakingAgent(true),
        onEnd: () => setIsSpeakingAgent(false),
        onError: () => setIsSpeakingAgent(false)
      });
    }
  };

  // Audio File Upload Translation
  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    await translateAudioBlob(file, file.name);
  };

  const translateAudioBlob = async (blob, filename = "audio_clip.webm") => {
    setUploadingAudio(true);
    setFileTranslationResult(null);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("target_language", fileTargetLang);

    try {
      const res = await api.translateAudioFile(formData);
      setFileTranslationResult(res);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to translate audio file");
    } finally {
      setUploadingAudio(false);
    }
  };

  // Browser Audio Recording for File Translation
  const startAudioRecording = async () => {
    setErrorMsg("");
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        translateAudioBlob(audioBlob, "live_recording.webm");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setAudioRecording(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Microphone access denied or audio recording not supported.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && audioRecording) {
      mediaRecorderRef.current.stop();
      setAudioRecording(false);
    }
  };

  const handleCreateDraftFromVoice = (textToUse) => {
    if (!textToUse) return;
    sessionStorage.setItem("brandguard_imported_voice_draft", textToUse);
    router.push("/drafts/new");
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
                <Mic className="w-4 h-4" />
              </div>
              BrandGuard Voice Agent & Audio Studio
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Listen to spoken audio, translate multilingual copy, and converse hands-free with brand governance.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab("agent")}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                activeTab === "agent" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🎙️ Live Voice Agent
            </button>
            <button
              onClick={() => setActiveTab("file_translator")}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                activeTab === "file_translator" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🌐 Audio Translator & Whisper
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Live Interactive Voice Agent */}
        {activeTab === "agent" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Console: Voice Controls & Visualizer */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {agentMode === "conversation" ? "Conversational Brand Copilot" : "Live Multilingual Audio Translator"}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  {isListening
                    ? "Listening to your voice..."
                    : isProcessing
                    ? "Translating & consulting brand policy..."
                    : isSpeakingAgent
                    ? "Speaking response aloud..."
                    : "Tap Microphone to Speak"}
                </h3>
              </div>

              {/* Animated Interactive Sound Orb */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                )}
                {isSpeakingAgent && (
                  <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-pulse" />
                )}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  title={isListening ? "Stop listening" : "Start speaking"}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95 z-10 ${
                    isListening
                      ? "bg-rose-600 ring-4 ring-rose-200"
                      : isSpeakingAgent
                      ? "bg-teal-600 ring-4 ring-teal-200"
                      : "bg-gradient-to-tr from-emerald-600 to-teal-700 ring-4 ring-emerald-100"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Listen</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Transcript Preview while speaking */}
              {liveTranscript && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-medium italic animate-pulse">
                  "{liveTranscript}"
                </div>
              )}

              {/* Mode & Language Selectors */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-left text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Agent Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAgentMode("conversation")}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        agentMode === "conversation"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      🗣️ Brand Copilot
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgentMode("translation")}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        agentMode === "translation"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      🌐 Translate Audio
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Listening In:
                    </label>
                    <select
                      value={inputLanguage}
                      onChange={(e) => setInputLanguage(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {agentMode === "translation" && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Translate To:
                      </label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      >
                        <option value="en">English (US)</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="hi">Hindi</option>
                        <option value="ja">Japanese</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Feed: Conversation & Translation Transcript */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-[520px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-emerald-600" />
                  Live Audio & Translation Feed
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {voiceHistory.length} voice interaction{voiceHistory.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                {voiceHistory.map((entry, idx) => {
                  const isUser = entry.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                        <span>{isUser ? "You (Spoken)" : "BrandGuard Voice Agent"}</span>
                        <span>•</span>
                        <span className="uppercase">{entry.language || "en-US"}</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                          isUser
                            ? "bg-slate-900 text-white rounded-tr-none shadow-xs"
                            : "bg-slate-50 text-slate-900 border border-slate-200 rounded-tl-none shadow-xs"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{entry.content}</div>

                        {!isUser && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleToggleSpeakMessage(entry.content, entry.language)}
                              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              Listen Aloud
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCreateDraftFromVoice(entry.content)}
                              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-slate-400" />
                              Send to Draft
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Audio File & Whisper Translation Studio */}
        {activeTab === "file_translator" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileAudio className="w-5 h-5 text-indigo-600" />
                    Groq Whisper Audio Transcription & Translation Studio
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record voice clips or upload audio files to translate audio into brand-compliant copy using Whisper Large v3.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">Target Language:</label>
                  <select
                    value={fileTargetLang}
                    onChange={(e) => setFileTargetLang(e.target.value)}
                    className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="fr">French (Français)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="ja">Japanese (日本語)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons: Record or Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Method 1: Record Microphone Audio */}
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Record Spoken Audio Clip</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Speak in any language, then click stop to translate</p>
                  </div>
                  <button
                    type="button"
                    onClick={audioRecording ? stopAudioRecording : startAudioRecording}
                    disabled={uploadingAudio}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mx-auto ${
                      audioRecording
                        ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {audioRecording ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        Stop & Translate Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        Record Audio Clip
                      </>
                    )}
                  </button>
                </div>

                {/* Method 2: Upload Audio File */}
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Upload Pre-recorded Audio File</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">MP3, WAV, M4A, WEBM, or OGG up to 25 MB</p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Choose Audio File</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      disabled={uploadingAudio}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {uploadingAudio && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Processing audio with Groq Whisper & translating to target language...</span>
                </div>
              )}

              {/* Translation Result Card */}
              {fileTranslationResult && (
                <div className="p-5 bg-slate-900 text-white rounded-xl space-y-4 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Audio Translation Completed ({fileTranslationResult.audio_model})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          speakText(fileTranslationResult.translated_text, {
                            lang: `${fileTargetLang}-US`
                          })
                        }
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        Listen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateDraftFromVoice(fileTranslationResult.translated_text)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Create Draft
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Translated Text:
                      </span>
                      <p className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-100 font-medium">
                        "{fileTranslationResult.translated_text}"
                      </p>
                    </div>

                    {fileTranslationResult.transcript && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Original Whisper Audio Transcript:
                        </span>
                        <p className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px]">
                          "{fileTranslationResult.transcript}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
