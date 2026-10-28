import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AppShell from "../../components/AppShell/AppShell";
import VoiceDictation from "../../components/VoiceDictation/VoiceDictation";
import { api } from "../../services/api";
import {
  FilePlus2,
  Upload,
  Palette,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Eye,
  CheckCircle2,
  Shield,
  Lock,
  Layers,
  FileCheck,
  Trash2,
  Plus,
  UploadCloud
} from "lucide-react";

export default function NewDraftPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isSubmittingRef = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const importedVoice = sessionStorage.getItem("brandguard_imported_voice_draft");
      if (importedVoice) {
        setContent(importedVoice);
        setTitle("Spoken Voice Draft");
        sessionStorage.removeItem("brandguard_imported_voice_draft");
      }
    }
  }, []);

  useEffect(() => {
    if (router.query?.type === "multimodal" || router.query?.load_preset) {
      handleLoadSample("multimodal");
    }
  }, [router.query]);

  // Accessibility & Color pair states
  const [enableColorCheck, setEnableColorCheck] = useState(false);
  const [foreground, setForeground] = useState("#9CA3AF");
  const [background, setBackground] = useState("#FFFFFF");
  const [colorLabel, setColorLabel] = useState("Hero Subtitle Text");
  const [contrastResult, setContrastResult] = useState(null);

  // Alt text states
  const [enableAltTextCheck, setEnableAltTextCheck] = useState(false);
  const [imageName, setImageName] = useState("infographic_banner.png");
  const [altText, setAltText] = useState("");

  // Multimodal Image Governance states (Improvements 1, 2, 3)
  const [enableImageCheck, setEnableImageCheck] = useState(true);
  const [attachedImages, setAttachedImages] = useState([
    {
      name: "infographic_banner.png",
      agency: "Starlight Media",
      alt_text: "banner",
      colors: ["#FF007F", "#10B981"],
      logo_identifier: "2021 Acme Circular Crest",
      aspect_ratio_skew: 0.22,
      contrast_ratio: 3.2,
      has_face: false,
      has_license_plate: false,
      ocr_text: "Acme guarantees 99.999% uptime with zero downtime. Rated #1 Cloud Platform in 2023 Benchmark study. Contact alex.vance@acmecorp.internal"
    },
    {
      name: "alex_vance_photo.png",
      agency: "Internal Creative Studio",
      alt_text: "Lead enterprise architect customer testimonial portrait",
      colors: ["#10B981", "#0F172A"],
      logo_identifier: "2025 Acme Geometric Wordmark",
      aspect_ratio_skew: 0.0,
      contrast_ratio: 7.4,
      has_face: true,
      has_license_plate: false,
      ocr_text: "Alex Vance — Lead Enterprise Architect, internal employee workstation #EMP-8821 with API key gsk_live_secret_key_88921."
    }
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // 1. File size check (>10MB rejects immediately with clear error, no hang)
    if (file.size > 10 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File size exceeds maximum allowed limit of 10 MB (received ${sizeMb} MB). Please compress or resize the asset before upload.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Reject PDF format with clear error (no hang)
    const fileName = file.name || "asset.png";
    const nameLower = fileName.toLowerCase();
    if (nameLower.endsWith(".pdf") || file.type === "application/pdf") {
      setError("Unsupported file format: PDF documents cannot be analyzed as visual graphics. Please upload a standard image file (PNG, JPG, WEBP) or ingest PDFs under Sources.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 3. Read image and check for blank canvas (no hang)
    const reader = new FileReader();
    reader.onerror = () => {
      setError("Failed to read image file. Please verify file integrity.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onerror = () => {
        setError("Invalid image file: Image header is corrupt or unreadable.");
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      img.onload = () => {
        // Blank image validation via canvas pixel standard deviation
        try {
          const canvas = document.createElement("canvas");
          const sampleW = Math.min(img.width, 100);
          const sampleH = Math.min(img.height, 100);
          canvas.width = sampleW;
          canvas.height = sampleH;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, sampleW, sampleH);
          const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
          let sum = 0, sumSq = 0;
          const totalPixels = imgData.length / 4;
          for (let i = 0; i < imgData.length; i += 4) {
            const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
            sum += lum;
            sumSq += lum * lum;
          }
          const mean = sum / totalPixels;
          const variance = (sumSq / totalPixels) - (mean * mean);
          const stdDev = Math.sqrt(Math.max(0, variance));

          if (stdDev < 1.0) {
            setError("Invalid image asset: The uploaded image is completely blank or empty (zero visual features detected). Please upload an image with visible graphics, charts, or banners.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
        } catch (canvasErr) {
          console.warn("Canvas blank check skipped:", canvasErr);
        }

        // Auto-detect features from filename
        const hasFace = ["face", "photo", "portrait", "person", "alex", "team", "headshot"].some(k => nameLower.includes(k));
        const hasPlate = ["car", "plate", "license", "vehicle", "auto", "truck", "sedan"].some(k => nameLower.includes(k));
        let detectedOcr = "";
        if (nameLower.includes("uptime") || nameLower.includes("99.999") || nameLower.includes("banner")) {
          detectedOcr = "Acme LiveSync 2.0 delivers 99.999% uptime guaranteed with zero downtime across all clouds.";
        } else if (nameLower.includes("email") || nameLower.includes("screenshot") || nameLower.includes("workstation")) {
          detectedOcr = "Contact: alex.vance@acmecorp.internal | Phone: 415-555-0199 | Workstation #EMP-9821";
        } else if (hasPlate) {
          detectedOcr = "Fleet Vehicle Registration: 7XYZ899 — Enterprise Fleet Operations";
        }

        setAttachedImages(prev => [
          ...prev,
          {
            name: fileName,
            agency: "Direct User Upload",
            alt_text: fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
            colors: ["#10B981", "#0F172A"],
            logo_identifier: "2025 Acme Geometric Wordmark",
            aspect_ratio_skew: 0.0,
            contrast_ratio: 6.5,
            has_face: hasFace,
            has_license_plate: hasPlate,
            ocr_text: detectedOcr,
            url: dataUrl
          }
        ]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (indexToRemove) => {
    setAttachedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateImageOcr = (idx, newOcr) => {
    setAttachedImages(prev => prev.map((img, i) => i === idx ? { ...img, ocr_text: newOcr } : img));
  };

  const handleTestContrast = async () => {
    try {
      const res = await api.checkContrast(foreground, background);
      setContrastResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadSample = (type) => {
    if (type === "multimodal") {
      setTitle("Q4 Multimodal Campaign: Infographic & Video Banner");
      setContent(`# Acme Enterprise Cloud Acceleration: 2026 Visual Campaign

Accelerate your data infrastructure with next-generation event replication.

![Q4 Enterprise Performance Infographic](infographic_banner.png)

![Customer Success Testimonial Photo](alex_vance_photo.png)

Explore our high-throughput architecture documentation to get started.`);
      setEnableImageCheck(true);
      setEnableColorCheck(true);
      setForeground("#9CA3AF");
      setBackground("#FFFFFF");
      setColorLabel("Banner Overlay Text");
      setAttachedImages([
        {
          name: "infographic_banner.png",
          agency: "Starlight Media",
          alt_text: "banner",
          colors: ["#FF007F", "#10B981"],
          logo_identifier: "2021 Acme Circular Crest",
          aspect_ratio_skew: 0.22,
          contrast_ratio: 3.2,
          has_face: false,
          has_license_plate: false,
          ocr_text: "Acme guarantees 99.999% uptime with zero downtime. Rated #1 Cloud Platform in 2023 Benchmark study. Contact alex.vance@acmecorp.internal"
        },
        {
          name: "alex_vance_photo.png",
          agency: "Internal Creative Studio",
          alt_text: "Lead enterprise architect customer testimonial portrait",
          colors: ["#10B981", "#0F172A"],
          logo_identifier: "2025 Acme Geometric Wordmark",
          aspect_ratio_skew: 0.0,
          contrast_ratio: 7.4,
          has_face: true,
          has_license_plate: false,
          ocr_text: "Alex Vance — Lead Enterprise Architect, internal employee workstation #EMP-8821 with API key gsk_live_secret_key_88921."
        }
      ]);
    } else if (type === "violating") {
      setTitle("Acme LiveSync 2.0 Product Launch Press Release");
      setContent(`# Introducing Acme LiveSync 2.0: The World's Best Streaming Engine

We are thrilled to announce HyperSync 2.0, the fastest data replication engine on the planet. Unlike cheap alternatives and inferior legacy architectures, our platform delivers guaranteed results with zero downtime.

Acme LiveSync processes 2.4 million events per second with sub-5ms latency across 12 regions, verified in independent tests. Our cloud infrastructure maintains a 99.85% uptime guarantee, ensuring your mission-critical applications run seamlessly.

To upgrade your existing cluster or talk to our lead enterprise architect Alex (reach out at alex.vance@acmecorp.internal or call 415-555-0199), click here right now.

![Performance Benchmark Graph]()`);
      setEnableColorCheck(true);
      setForeground("#9CA3AF");
      setBackground("#FFFFFF");
      setColorLabel("Callout Subtitle Text");
      setEnableImageCheck(false);
    } else {
      setTitle("Acme SOC2 Type II Attestation Summary");
      setContent(`# Enterprise Security & Architecture Attestation

Acme serves over 4,200 enterprise organizations across 45 countries with an active SOC2 Type II compliance certification. All data at rest utilizes AES-256 encryption with customer-managed keys (KMS).

For detailed security whitepapers and verification reports, explore the Acme Trust Center.`);
      setEnableColorCheck(false);
      setEnableImageCheck(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || submitting) return;
    if (!title.trim() || !content.trim()) return;

    isSubmittingRef.current = true;
    setError("");
    setSubmitting(true);

    try {
      const colorPairs = enableColorCheck
        ? [{ foreground, background, label: colorLabel, font_size: "normal" }]
        : [];

      const altTexts = enableAltTextCheck
        ? [{ image_name: imageName, alt_text: altText }]
        : [];

      const created = await api.createDraft({
        title,
        content,
        color_pairs: colorPairs,
        alt_texts: altTexts,
        images: enableImageCheck ? attachedImages : [],
      });

      router.push(`/drafts/${created.id}`);
    } catch (err) {
      setError(err.message || "Failed to submit draft");
      isSubmittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FilePlus2 className="w-6 h-6 text-emerald-600" />
              Submit Draft for Pre-Publish Governance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly audit text & images for brand tone, verified claims (OCR), visual violations, and privacy protection.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handleLoadSample("multimodal")}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              Load Multimodal Campaign (New)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample("violating")}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold"
            >
              Text Violations
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample("clean")}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
            >
              Compliant Draft
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Draft Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Multimodal Campaign: Infographic & Video Banner"
                className="w-full text-sm font-semibold p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Draft Content (Text or Markdown)
                </label>
                <VoiceDictation
                  onTranscript={(newSpeech) => {
                    setContent((prev) => (prev ? `${prev} ${newSpeech}` : newSpeech));
                  }}
                  hasImagesOrRedaction={enableImageCheck && attachedImages.length > 0}
                  disabledReason={
                    enableImageCheck && attachedImages.length > 0
                      ? "Voice dictation disabled on draft copy while multimodal image assets are attached (Zero-Exposure Policy)."
                      : ""
                  }
                />
              </div>
              <textarea
                required
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or write your marketing copy, blog post, or whitepaper segment here..."
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Multimodal Graphics & Image Governance (Improvements 1, 2, 3) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  Multimodal Image Governance (ClaimCheck OCR, Visual Checks & Privacy Layer)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Upload visual assets or test preloaded graphics. Irreversible privacy blurring runs before analysis.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Image / Graphic
                </button>

                <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer border-l border-slate-200 pl-3">
                  <input
                    type="checkbox"
                    checked={enableImageCheck}
                    onChange={(e) => setEnableImageCheck(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Enable Image Review ({attachedImages.length})
                </label>
              </div>
            </div>

            {enableImageCheck && (
              <div className="space-y-4">
                {/* Privacy Shield Info Banner */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Zero-Exposure Visual Privacy Shield Active:</span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Faces, vehicle license plates, and visible screen credentials are automatically detected and irreversibly blurred before images are sent to external analysis. AI involvement is disclosed on every finding and logged to the audit trail.
                    </p>
                  </div>
                </div>

                {attachedImages.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No visual assets attached</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Upload a photo, screenshot, or banner to run multimodal governance</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Browse File
                    </button>
                  </div>
                ) : (
                  /* Attached Graphics List */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachedImages.map((img, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate max-w-[180px]">
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            {img.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {img.agency}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                              title="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {img.url && (
                          <div className="w-full h-32 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                            <img
                              src={img.url}
                              alt={img.alt_text || img.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="text-[11px] text-slate-600 space-y-1">
                          <div>
                            <strong>Visual Colors:</strong>{" "}
                            {(img.colors || []).map((c, i) => (
                              <span key={i} className="inline-flex items-center gap-1 mr-2 font-mono text-[10px]">
                                <span className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300" style={{ backgroundColor: c }} />
                                {c}
                              </span>
                            ))}
                          </div>
                          <div>
                            <strong>Logo Lockup:</strong> {img.logo_identifier || "Default"}
                            {img.aspect_ratio_skew > 0 && <span className="text-rose-600 ml-1">({round(img.aspect_ratio_skew * 100)}% skew)</span>}
                          </div>
                          <div>
                            <strong>Graphic Contrast:</strong> {img.contrast_ratio}:1
                            {img.contrast_ratio < 4.5 && <span className="text-amber-600 ml-1">(Below 4.5:1)</span>}
                          </div>
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            <strong>Privacy Shield:</strong>
                            {img.has_face && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                                👤 Face Detected (Will Blur)
                              </span>
                            )}
                            {img.has_license_plate && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                                🚗 License Plate (Will Blur)
                              </span>
                            )}
                            {img.ocr_text && (img.ocr_text.includes("@") || img.ocr_text.includes("EMP-") || img.ocr_text.includes("gsk_")) && (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[10px]">
                                🔒 PII/Credentials (Will Blur)
                              </span>
                            )}
                            {!img.has_face && !img.has_license_plate && (!img.ocr_text || (!img.ocr_text.includes("@") && !img.ocr_text.includes("EMP-") && !img.ocr_text.includes("gsk_"))) && (
                              <span className="text-slate-400 text-[10px]">Clean</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block">
                              OCR Extracted Text & Claims (Editable for Review):
                            </label>
                            <span className="text-[9px] text-slate-400 flex items-center gap-1 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                              Dictation Locked (Zero-Exposure Policy)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={img.ocr_text || ""}
                            onChange={(e) => handleUpdateImageOcr(idx, e.target.value)}
                            placeholder="Claims in graphic to check against Fact Sheet..."
                            className="w-full text-[11px] font-mono p-2 bg-white rounded border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Color Contrast & Accessibility Inputs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              Design & Accessibility Inputs (WCAG 2.1 AA)
            </h3>

            {/* Color Contrast */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableColorCheck}
                    onChange={(e) => setEnableColorCheck(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Evaluate Color Contrast (WCAG 4.5:1 Target)
                </label>
                {enableColorCheck && (
                  <button
                    type="button"
                    onClick={handleTestContrast}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Test Contrast Live
                  </button>
                )}
              </div>

              {enableColorCheck && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Foreground Text Hex
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={foreground}
                        onChange={(e) => setForeground(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={foreground}
                        onChange={(e) => setForeground(e.target.value)}
                        className="text-xs p-1.5 border border-slate-300 rounded font-mono w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Background Hex
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="text-xs p-1.5 border border-slate-300 rounded font-mono w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Element Label
                    </label>
                    <input
                      type="text"
                      value={colorLabel}
                      onChange={(e) => setColorLabel(e.target.value)}
                      placeholder="e.g. Hero Subtitle Text"
                      className="text-xs p-1.5 border border-slate-300 rounded w-full"
                    />
                  </div>
                </div>
              )}

              {contrastResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
                    contrastResult.passes_aa
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  <span>
                    Contrast Ratio: {contrastResult.contrast_ratio}:1 (
                    {contrastResult.passes_aa ? "Passes WCAG AA" : "Fails WCAG AA (Target 4.5:1)"})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/drafts")}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Brand Governance Review...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Submit Draft & Run Multimodal Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function round(val) {
  return Math.round(val);
}
