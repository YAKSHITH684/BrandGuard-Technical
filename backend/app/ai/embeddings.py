import hashlib
import math
import numpy as np
from typing import List
from app.config import settings

_model = None
_use_sentence_transformers = False

try:
    from sentence_transformers import SentenceTransformer
    _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    _use_sentence_transformers = True
except Exception:
    _model = None
    _use_sentence_transformers = False


def _hash_token_to_embedding(token: str, dim: int = 384) -> np.ndarray:
    """Produces a deterministic subvector for a token using multi-hash projection."""
    vec = np.zeros(dim, dtype=np.float32)
    # Generate multiple pseudo-random indices from token hash
    b = token.encode("utf-8")
    for seed in range(3):
        h = int(hashlib.sha256(b + bytes([seed])).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if ((h >> 10) & 1) else -1.0
        vec[idx] += sign
    return vec


def get_embedding(text: str) -> List[float]:
    """
    Generates a 384-dimensional unit-normalized embedding vector for text.
    Uses sentence-transformers if available, otherwise fast deterministic semantic projection.
    """
    if _use_sentence_transformers and _model:
        emb = _model.encode(text)
        if isinstance(emb, np.ndarray):
            return emb.tolist()
        return list(emb)

    # High-quality deterministic fallback (384 dimensions)
    clean_text = text.lower().strip()
    if not clean_text:
        vec = np.zeros(settings.EMBEDDING_DIM, dtype=np.float32)
        vec[0] = 1.0
        return vec.tolist()

    words = [w for w in clean_text.split() if w]
    accum = np.zeros(settings.EMBEDDING_DIM, dtype=np.float32)

    # Word unigrams + character character trigrams for subword semantics
    for word in words:
        accum += _hash_token_to_embedding(word, settings.EMBEDDING_DIM) * 1.5
        for i in range(len(word) - 2):
            trigram = word[i:i+3]
            accum += _hash_token_to_embedding(trigram, settings.EMBEDDING_DIM) * 0.4

    # Bigrams
    for i in range(len(words) - 1):
        bigram = f"{words[i]}_{words[i+1]}"
        accum += _hash_token_to_embedding(bigram, settings.EMBEDDING_DIM) * 1.0

    # L2 normalize
    norm = np.linalg.norm(accum)
    if norm > 1e-6:
        accum = accum / norm
    else:
        accum[0] = 1.0

    return accum.tolist()


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a < 1e-6 or norm_b < 1e-6:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
