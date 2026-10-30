# Technical Specification: OCR Processing and Visual Extraction Pipeline

## 1. Multimodal Governance Overview

Enterprise marketing copy is frequently created as visual assets: banners, infographics, slide screenshots, and social graphics. Traditional text-only scanners completely miss non-compliant copy embedded inside PNG, JPEG, or WebP files.

The **OCR Processing Subsystem** (`backend/app/ai/ocr.py`) extracts text from visual drafts, groups bounding boxes into coherent sentences, and feeds the extracted text into the identical compliance and ClaimCheck engines used for written copy.

```
+--------------------------------------------------------------------------+
|                  Uploaded Graphic (PNG / JPEG / WebP)                    |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Image Pre-Processing & Normalization                    |
|   - Color space normalization (RGB conversion)                           |
|   - Grayscale conversion & adaptive thresholding                         |
|   - Noise reduction and contrast enhancement                             |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  OCR Engine Execution (Tesseract / EasyOCR)              |
|   - Identifies word bounding boxes: (x, y, width, height)                |
|   - Computes per-word OCR confidence score                               |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Spatial Line Reconstruction                             |
|   Groups neighboring words on horizontal baselines into sentences        |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Unified Governance Dispatch                             |
|   Extracted text sent to: Banned Terms, ClaimCheck, Privacy Redaction    |
+--------------------------------------------------------------------------+
```

---

## 2. Image Pre-Processing Techniques

Raw marketing graphics often have busy backgrounds or low contrast that impair optical character recognition. The pipeline applies pre-processing steps:
1. **Dimension Normalization**: Rescales oversized images to a standard operational width ($1600\text{px}$) while preserving aspect ratio.
2. **Contrast Maximization**: Applies contrast-limited adaptive histogram equalization (CLAHE) to distinguish text from gradient backgrounds.
3. **Binarization**: Uses Otsu's thresholding to generate clear monochrome masks when evaluating banner headers.

---

## 3. Spatial Line Reconstruction Algorithm

OCR engines return discrete bounding boxes for individual words. To evaluate brand claims and sentence structure, these boxes must be reassembled into logical sentences:
1. Sorts bounding boxes vertically by their top coordinate ($y$).
2. Groups words whose vertical centers fall within $\pm 0.5 \times \text{font\_height}$ into a single line.
3. Sorts words within each line horizontally by their left coordinate ($x$).
4. Concatenates words separated by spaces, merging hyphenated words across lines.

---

## 4. Multimodal Finding Delivery

Once extracted:
- The extracted text is displayed in the frontend **Multimodal Governance Console** alongside the uploaded graphic.
- Any finding triggered by the extracted copy includes visual coordinate metadata:
  ```json
  {
    "flagged_text": "HyperSync",
    "rule_name": "Prohibited Deprecated Product Name",
    "bounding_box": {"x": 120, "y": 45, "width": 180, "height": 32},
    "severity": "CRITICAL"
  }
  ```
- This metadata allows the frontend to highlight the exact visual region on the image.
