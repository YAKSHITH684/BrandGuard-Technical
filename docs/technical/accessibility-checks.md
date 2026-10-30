# Technical Specification: Accessibility and Contrast Verification Checks

## 1. Overview and Standards Compliance

BrandGuard enforces the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standards across all digital and visual marketing assets, in accordance with Brand Guidelines Section 5:
- **Color Contrast**: Ensures copy is legible for users with low vision or color vision deficiencies.
- **Descriptive Hyperlinks**: Prohibits ambiguous link anchors that impair screen-reader navigation.
- **Alternative Text (Alt Text)**: Mandates informative descriptive text for visual assets.

---

## 2. WCAG 2.1 Color Contrast Mathematics (`backend/app/checks/contrast.py`)

The contrast module deterministically computes the relative luminance and contrast ratio between foreground text and background colors.

### 2.1 Relative Luminance Calculation
Given an 8-bit sRGB color value $C \in [0, 255]$, normalize to $C_{\text{srgb}} = C / 255.0$ and calculate linear channel luminance $c$:

$$c = \begin{cases} \frac{C_{\text{srgb}}}{12.92} & \text{if } C_{\text{srgb}} \le 0.03928 \\ \left(\frac{C_{\text{srgb}} + 0.055}{1.055}\right)^{2.4} & \text{if } C_{\text{srgb}} > 0.03928 \end{cases}$$

Relative luminance $L$ is computed using the standard ITU-R BT.709 coefficients:

$$L = 0.2126 \times r + 0.7152 \times g + 0.0722 \times b$$

### 2.2 Contrast Ratio Formula
Given the lighter color luminance $L_1$ and darker color luminance $L_2$ ($L_1 > L_2$):

$$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

### 2.3 WCAG 2.1 AA Conformance Thresholds
- **Standard Body Text**: Minimum contrast ratio of **4.5:1**.
- **Large Text (18pt+ or 14pt Bold)**: Minimum contrast ratio of **3.0:1**.

---

## 3. Structural Accessibility Checks (`backend/app/checks/accessibility.py`)

### 3.1 Non-Descriptive Hyperlink Detection
Screen readers frequently present users with a list of links extracted from a page. Anchors such as "click here" offer zero context out of sentence flow.
- **Pattern Matcher**: Flags anchors matching generic strings:
  `click here`, `read more`, `learn more`, `here`, `link`, `download`, `more info`.
- **Severity**: `MEDIUM`
- **Recommended Action**: Replaces anchor with descriptive destination text (e.g. *Read the 2026 Enterprise Security Whitepaper*).

### 3.2 Image Alternative Text (Alt Text) Validation
Scans HTML or Markdown markup embedded in drafts:
- **Missing Alt Attribute**: Flags `<img>` tags lacking an `alt` attribute entirely.
- **Empty Alt on Informative Visuals**: Warns when charts or diagrams contain `alt=""`.
- **Generic Placeholders**: Flags low-effort descriptions such as `alt="image"`, `alt="graphic"`, or `alt="screenshot"`.
- **Recommended Action**: Generates an informative description explaining the key data takeaways of the diagram.
