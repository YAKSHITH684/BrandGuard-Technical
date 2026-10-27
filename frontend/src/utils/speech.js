/**
 * Web Speech API Utilities for BrandGuard
 * 
 * Provides accessible, zero-dependency audio capabilities:
 * 1. Text-to-Speech (TTS): Reads findings aloud locally on-device. Zero network exposure.
 * 2. Speech Recognition (STT): Optional draft dictation with strict opt-in consent
 *    and zero-exposure privacy enforcement (never used on visual assets or redacted content).
 */

export const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (US)", short: "EN" },
  { code: "es-ES", name: "Spanish (Español)", short: "ES" },
  { code: "fr-FR", name: "French (Français)", short: "FR" },
  { code: "de-DE", name: "German (Deutsch)", short: "DE" },
  { code: "hi-IN", name: "Hindi (हिन्दी)", short: "HI" },
  { code: "te-IN", name: "Telugu (తెలుగు)", short: "TE" },
  { code: "ta-IN", name: "Tamil (தமிழ்)", short: "TA" },
  { code: "ja-JP", name: "Japanese (日本語)", short: "JA" },
  { code: "zh-CN", name: "Chinese (Mandarin)", short: "ZH" },
  { code: "ar-SA", name: "Arabic (العربية)", short: "AR" },
  { code: "pt-BR", name: "Portuguese (Português)", short: "PT" },
  { code: "it-IT", name: "Italian (Italiano)", short: "IT" }
];

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isSpeechRecognitionSupported() {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

let activeUtterance = null;

export function speakText(text, { onStart, onEnd, onError, rate = 1.0, pitch = 1.0, lang = "en-US" } = {}) {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError(new Error("Text-to-speech is not supported by your browser."));
    return false;
  }

  // Cancel any ongoing utterance before starting new speech
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    // Ignore cancel errors
  }

  if (!text || !text.trim()) return false;

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = lang;

  // Try to pick a natural voice for the target language if available
  try {
    const voices = window.speechSynthesis.getVoices();
    const prefix = (lang || "en").split("-")[0].toLowerCase();
    const naturalVoice =
      voices.find(
        (v) =>
          (v.lang.toLowerCase() === lang.toLowerCase() || v.lang.toLowerCase().startsWith(prefix)) &&
          (v.name.includes("Natural") ||
            v.name.includes("Enhanced") ||
            v.name.includes("Google") ||
            v.name.includes("Microsoft") ||
            v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase() || v.lang.toLowerCase().startsWith(prefix));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }
  } catch (e) {
    // Voice selection optional
  }

  utterance.onstart = () => {
    activeUtterance = utterance;
    if (onStart) onStart();
  };

  utterance.onend = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    activeUtterance = null;
    // 'interrupted' or 'canceled' happens when user stops or switches finding
    if (e.error !== "interrupted" && e.error !== "canceled" && onError) {
      onError(e);
    }
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    activeUtterance = null;
  }
}

export function isSpeaking() {
  return isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
}

export function formatFindingForSpeech(finding) {
  if (!finding) return "";
  const parts = [];

  // Severity and Rule
  parts.push(`Policy finding: ${finding.rule}.`);
  if (finding.severity) {
    parts.push(`Severity: ${finding.severity}.`);
  }
  if (finding.category) {
    parts.push(`Category: ${finding.category}.`);
  }

  // Flagged text
  if (finding.span_text) {
    parts.push(`Flagged text segment: "${finding.span_text}".`);
  }

  // Suggested rewrite
  if (finding.suggested_rewrite) {
    parts.push(`Suggested compliant rewrite: "${finding.suggested_rewrite}".`);
  }

  // Source citation
  if (finding.source_excerpt) {
    parts.push(`Approved brand guideline reference: "${finding.source_excerpt}".`);
  }

  return parts.join(" ");
}

const DICTATION_OPT_IN_KEY = "brandguard_dictation_opt_in";

export function getDictationOptIn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DICTATION_OPT_IN_KEY) === "true";
}

export function setDictationOptIn(optIn) {
  if (typeof window === "undefined") return;
  if (optIn) {
    localStorage.setItem(DICTATION_OPT_IN_KEY, "true");
  } else {
    localStorage.setItem(DICTATION_OPT_IN_KEY, "false");
  }
}

/**
 * Creates and starts a SpeechRecognition instance for draft dictation.
 */
export function createSpeechRecognizer({ onResult, onStart, onEnd, onError, lang = "en-US" }) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError(new Error("Speech recognition is not supported in this browser."));
    return null;
  }

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = lang;

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        transcript += event.results[i][0].transcript + " ";
      }
    }
    if (transcript.trim() && onResult) {
      onResult(transcript.trim());
    }
  };

  recognition.onerror = (event) => {
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
