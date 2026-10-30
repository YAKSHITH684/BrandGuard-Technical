# Retrieval-Augmented Generation (RAG) Workflow

## 1. Grounding Engine Overview

Large Language Models frequently suffer from hallucinations or apply generic external grammar rules that contradict proprietary corporate policies. BrandGuard solves this with a **strictly grounded Retrieval-Augmented Generation (RAG)** architecture:
- Every rule violation must cite a specific chunk ID stored in the database.
- Every claim verification must map against a dated enterprise fact-sheet chunk.
- If a claim cannot be verified against the active knowledge base, it is flagged as `Unsupported` rather than hallucinating an affirmation.

```
+-------------------------------------------------------------------------+
|                        Ingestion Phase (Offline)                        |
|   1. Upload Guidelines/Fact Sheets (PDF, DOCX, MD, TXT)                 |
|   2. Section-Aware Chunking & Date Metadata Extraction                  |
|   3. 384-Dimensional Dense Vector Embedding Generation                  |
|   4. Persist to PostgreSQL (pgvector) or SQLite Vector Index            |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------+------------------------------------+
|                         Review Phase (Online)                           |
|   1. Content Creator Submits Draft Text                                 |
|   2. Embed Draft Semantics into 384-Dimensional Query Vector            |
|   3. Cosine Nearest-Neighbor Search retrieves Top-k Context Chunks      |
|   4. Formulate Enriched Grounded Prompt to Groq LLM                     |
|   5. Validate Returned Chunk Citations against Source Chunk Index       |
+-------------------------------------------------------------------------+
```

---

## 2. Document Ingestion and Chunking (`backend/app/services/ingestion.py`)

### 2.1 Supported Document Formats
- **Markdown (`.md`) & Plain Text (`.txt`)**: Preserves native header hierarchies and lists.
- **Portable Document Format (`.pdf`)**: Extracts raw text blocks and removes layout artifacts.
- **Microsoft Word (`.docx`)**: Traverses document paragraph nodes and table cells.

### 2.2 Section-Aware Chunking Strategy
Generic fixed-window chunking (e.g., splitting every 500 characters) frequently severs rules from their context. BrandGuard uses **hierarchical section chunking**:
1. Splits on major markdown headings (`#`, `##`, `###`).
2. Extracts metadata attributes from the section header:
   - `effective_date`: Date from which the policy is active.
   - `expiry_date`: Deprecation date.
   - `policy_category`: Terminology, claim, privacy, or accessibility.
3. Chunks are sized between 150 and 600 tokens with a 50-token overlap to maintain coherence across boundary sentences.

---

## 3. Vector Embedding and Nearest-Neighbor Retrieval (`backend/app/ai/retrieval.py`)

### 3.1 384-Dimensional Dense Vectors
Text chunks are passed to the embedding engine, generating normalized 384-dimensional dense vectors capturing conceptual semantics rather than mere keyword overlap.

### 3.2 Cosine Similarity Matching
When a draft is submitted, the retrieval service computes the cosine distance between the draft query vector $\vec{q}$ and stored chunk vectors $\vec{c}_i$:

$$\text{Similarity}(\vec{q}, \vec{c}_i) = \frac{\vec{q} \cdot \vec{c}_i}{\|\vec{q}\| \|\vec{c}_i\|}$$

- In **PostgreSQL**: Executed directly within the database engine using the pgvector cosine distance operator `<=>`:
  ```sql
  SELECT id, content, section_title, 1 - (embedding <=> :query_vec) AS similarity
  FROM source_chunks
  WHERE source_id = :source_id
  ORDER BY embedding <=> :query_vec ASC
  LIMIT 5;
  ```
- In **SQLite Fallback**: Computed dynamically in Python using vectorized NumPy dot products, ensuring zero external setup requirements for local developers.

---

## 4. Citation Validation & Grounding Integrity

To eliminate LLM hallucination of false chunk IDs:
1. The synthesis worker extracts all `source_chunk_id` attributes returned in the Groq JSON response.
2. Queries the `source_chunks` database table to verify that the chunk exists and belongs to an active source.
3. If the chunk ID does not exist, the finding is marked with an unverified flag or reassigned to the nearest parent section.
4. The exact text excerpt from the verified chunk is rendered in the frontend finding card, giving creators complete transparency into why the text was flagged.
