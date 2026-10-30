# Technical Specification: Readability Analysis and Scoring Algorithms

## 1. Overview and Purpose

Complex, jargon-heavy marketing copy alienates enterprise prospects and obscures value propositions. Brand Guidelines Section 1 explicitly mandates:
> *"All public content must target a Flesch Reading Ease score of 60 or above. Avoid compound sentences with more than 35 words."*

The **Readability Analysis Module** (`backend/app/checks/readability.py`) deterministically scores drafts using standardized linguistic metrics without external API calls.

---

## 2. Mathematical Formulations

### 2.1 Flesch Reading Ease (FRE)
Calculates reading ease on a scale from 0 to 100, where higher scores indicate clearer, more accessible copy:

$$\text{FRE} = 206.835 - 1.015 \times \left(\frac{\text{Total Words}}{\text{Total Sentences}}\right) - 84.6 \times \left(\frac{\text{Total Syllables}}{\text{Total Words}}\right)$$

| Score Range | Reading Difficulty | Target Audience Equivalent |
|:---:|---|---|
| **90 – 100** | Very Easy | 5th grade student (Conversational) |
| **70 – 89** | Fairly Easy | 7th – 8th grade student |
| **60 – 69** | Standard | **Enterprise Target (Clear B2B copy)** |
| **50 – 59** | Fairly Difficult | High school student |
| **30 – 49** | Difficult | College undergraduate |
| **0 – 29** | Very Confusing | Technical academic journal |

### 2.2 Flesch-Kincaid Grade Level (FKGL)
Translates reading complexity into US academic grade levels:

$$\text{FKGL} = 0.39 \times \left(\frac{\text{Total Words}}{\text{Total Sentences}}\right) + 11.8 \times \left(\frac{\text{Total Syllables}}{\text{Total Words}}\right) - 15.59$$

---

## 3. Linguistic Tokenization Algorithms

### 3.1 Sentence Boundary Disambiguation
Naive period-splitting fails on enterprise acronyms and common abbreviations. BrandGuard uses regex-assisted sentence boundary detection:
- Ignores periods within abbreviations (`e.g.`, `i.e.`, `vs.`, `Inc.`, `Co.`, `Dr.`, `SLA`).
- Ignores decimal numbers (`99.95%`, `2.4M`).
- Splits only on terminating punctuation (`.`, `!`, `?`) followed by whitespace and an uppercase letter.

### 3.2 Syllable Counting Engine
The syllable counter implements rule-based English phonetic heuristics:
1. Converts word tokens to lowercase and strips non-alphabetic characters.
2. Counts continuous vowel groups (`a, e, i, o, u, y`) as single syllables to account for diphthongs (e.g. "ea", "ou").
3. Deducts silent terminal vowels:
   - Trailing silent `e` (e.g. "make", "plate").
   - Trailing `ed` suffixes when not preceded by `d` or `t`.
4. Enforces a floor of at least 1 syllable for every valid word token.

---

## 4. Policy Enforcement and Finding Generation

The engine flags two distinct readability violations:
1. **Low Reading Ease**: If $\text{FRE} < 60.0$, generates a `MEDIUM` severity finding indicating that copy is overly dense and recommends simplifying sentence structure.
2. **Excessive Sentence Length**: If any single sentence contains $> 35$ words, generates a `HIGH` severity finding citing Brand Guidelines Section 1 and highlighting the run-on sentence for splitting.
