import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Volume2,
  AlertTriangle,
  X,
  CheckCircle2,
  Info
} from "lucide-react";
import {
  isSpeechRecognitionSupported,
  getDictationOptIn,
  setDictationOptIn,
  createSpeechRecognizer
} from "../../utils/speech";

export default function VoiceDictation({
  onTranscript,
  disabled = false,
  disabledReason = "",
  hasImagesOrRedaction = false,
  className = ""
}) {
  const [supported, setSupported] = useState(true);
  const [optedIn, setOptedIn] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const recognizerRef = useRef(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    setOptedIn(getDictationOptIn());

    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const handleStartListening = () => {
    setErrorMessage("");
    try {
      const recognizer = createSpeechRecognizer({
        onStart: () => setIsListening(true),
        onEnd: () => setIsListening(false),
        onResult: (newText) => {
          if (onTranscript && newText) {
            onTranscript(newText);
          }
        },
        onError: (err) => {
          console.error("Speech recognition error:", err);
          setIsListening(false);
          if (err.error === "not-allowed") {
            setErrorMessage("Microphone permission denied by browser settings.");
          } else if (err.error === "no-speech") {
            // normal pause in speech
          } else {
            setErrorMessage(`Speech recognition error: ${err.error || "unknown"}`);
          }
        }
      });

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
      }
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setErrorMessage("Could not initialize microphone input.");
    }
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleToggleClick = () => {
    if (disabled || hasImagesOrRedaction) return;

    if (isListening) {
      handleStopListening();
      return;
    }

    if (!optedIn) {
      setShowPrivacyModal(true);
      return;
    }

    handleStartListening();
  };

  const handleConfirmOptIn = () => {
    setDictationOptIn(true);
    setOptedIn(true);
    setShowPrivacyModal(false);
    handleStartListening();
  };

  const handleRevokeOptIn = (e) => {
    e.stopPropagation();
    if (isListening) handleStopListening();
    setDictationOptIn(false);
    setOptedIn(false);
  };

  if (!supported) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-[11px] text-slate-400 ${className}`}>
        <MicOff className="w-3.5 h-3.5 text-slate-400" />
        <span>Dictation unavailable (requires Chrome, Edge, or Safari)</span>
      </div>
    );
  }

  const isRestrictedByPrivacy = hasImagesOrRedaction || disabled;
  const restrictionTooltip =
    disabledReason ||
    (hasImagesOrRedaction
      ? "Zero-Exposure Enforcement: Voice dictation is disabled on visual assets and redacted content to prevent third-party audio transmission."
      : "");

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {/* Main Microphone Button */}
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={isRestrictedByPrivacy}
          title={isRestrictedByPrivacy ? restrictionTooltip : isListening ? "Stop listening" : "Dictate draft copy"}
          aria-label={isListening ? "Stop dictation" : "Start draft dictation"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
            isRestrictedByPrivacy
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : isListening
              ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400/40"
              : optedIn
              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
          }`}
        >
          {isRestrictedByPrivacy ? (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Dictation Disabled</span>
            </>
          ) : isListening ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <Mic className="w-3.5 h-3.5 text-white" />
              <span>Listening... (Click to stop)</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dictate Copy</span>
            </>
          )}
        </button>

        {/* Zero-Exposure Privacy Warning when restricted */}
        {isRestrictedByPrivacy && (
          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="font-medium">{restrictionTooltip}</span>
          </span>
        )}

        {/* Opt-in Privacy Badge */}
        {!isRestrictedByPrivacy && optedIn && (
          <div className="flex items-center gap-1.5 text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Cloud STT Opted In</span>
            <button
              type="button"
              onClick={handleRevokeOptIn}
              title="Revoke browser speech recognition opt-in"
              className="text-slate-400 hover:text-rose-600 ml-1 underline"
            >
              Revoke
            </button>
          </div>
        )}

        {/* Error notification if microphone fails */}
        {errorMessage && (
          <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
            {errorMessage}
          </span>
        )}
      </div>

      {/* Zero-Exposure Dictation Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Voice Dictation Privacy Disclosure
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Browser Web Speech API & Zero-Exposure Policy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
              <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Privacy Notice: Browser Cloud Processing
              </p>
              <p>
                <strong>Text-to-speech</strong> (reading findings aloud) runs 100% locally on your computer with zero network exposure.
              </p>
              <p>
                However, <strong>speech recognition</strong> in Chromium-based browsers (Google Chrome, Microsoft Edge) often transmits audio fragments to the browser vendor's servers for acoustic transcription.
              </p>
              <p>
                To preserve BrandGuard's <strong>Zero-Exposure guarantee</strong>:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Dictation is strictly <strong>opt-in</strong> and requires your explicit consent.</li>
                <li>Dictation is <strong>permanently locked and disabled</strong> on image assets, OCR transcriptions, and privacy-redacted content.</li>
                <li>You can revoke your consent at any time from this toolbar.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Keep Disabled
              </button>
              <button
                type="button"
                onClick={handleConfirmOptIn}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                I Understand & Opt In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
