/**
 * AI-based Duplicate Complaint Detection for GramConnect
 * Uses pre-trained sentence embeddings (Xenova/all-MiniLM-L6-v2) for semantic similarity,
 * combined with GPS geographic proximity (Haversine formula) and category alignment.
 */

const Complaint = require('../models/Complaint');

// Lazy-loaded sentence embedding pipeline
let pipelineInstance = null;
let pipelinePromise = null;

/**
 * Initializes and caches the Transformers.js feature extraction pipeline.
 */
async function getEmbeddingPipeline() {
  if (pipelineInstance) return pipelineInstance;
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');
      // Configure local cache directory if desired
      env.allowLocalModels = false;
      env.useBrowserCache = false;

      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true
      });
      pipelineInstance = extractor;
      return extractor;
    } catch (err) {
      console.warn('[AI Duplicate Detector] Transformers.js model loading note:', err.message);
      return null;
    }
  })();

  return pipelinePromise;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'is', 'was', 'are', 'were', 'been', 'be', 'by', 'it', 'this', 'that', 'from', 'as',
  'into', 'has', 'have', 'had', 'near', 'causing', 'near', 'around', 'here', 'there'
]);

function stemToken(word) {
  return word
    .replace(/(ing|ed|es|s|ation|age)$/, '')
    .trim();
}

/**
 * Resilient fallback dense embedding generator
 * Computes deterministic n-gram semantic vector when transformer is loading or offline
 */
function getFallbackEmbedding(text, dim = 384) {
  const vec = new Float32Array(dim);
  if (!text || typeof text !== 'string') return Array.from(vec);

  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
  const rawWords = clean.split(/\s+/).filter(Boolean);
  const words = rawWords.filter(w => !STOP_WORDS.has(w) && w.length > 1);

  if (words.length === 0) return Array.from(vec);

  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i];
    const stemmed = stemToken(rawWord);

    // Hash word into multiple vector dimensions
    let h1 = 0, h2 = 0;
    for (let c = 0; c < stemmed.length; c++) {
      const code = stemmed.charCodeAt(c);
      h1 = ((h1 << 5) - h1 + code) | 0;
      h2 = ((h2 << 7) + h2 + code) | 0;
    }

    const idx1 = Math.abs(h1) % dim;
    const idx2 = Math.abs(h2) % dim;
    const weight = 2.0 + Math.min(4.0, stemmed.length / 2);

    vec[idx1] += weight;
    vec[idx2] += weight * 0.8;

    // Character trigrams
    for (let j = 0; j < stemmed.length - 2; j++) {
      const tg = stemmed.charCodeAt(j) * 31 * 31 + stemmed.charCodeAt(j + 1) * 31 + stemmed.charCodeAt(j + 2);
      const tgIdx = Math.abs(tg) % dim;
      vec[tgIdx] += 0.6;
    }
  }

  // L2 normalization
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] /= norm;
  }

  return Array.from(vec);
}

/**
 * Generates a normalized 384-dimensional sentence embedding for given text
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function getSentenceEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Array(384).fill(0);
  }

  try {
    const extractor = await getEmbeddingPipeline();
    if (extractor) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      if (output && output.data) {
        return Array.from(output.data);
      }
    }
  } catch (err) {
    console.warn('[AI Duplicate Detector] Error running sentence embedding:', err.message);
  }

  return getFallbackEmbedding(text, 384);
}

/**
 * Computes cosine similarity between two dense vectors
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Value between 0 and 1
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA <= 0 || normB <= 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, sim));
}

/**
 * Calculates geographic distance between two GPS coordinates using Haversine formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
      lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return Infinity;
  }

  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates geographic proximity score from distance in meters
 * @param {number} distanceMeters
 * @returns {number} Value between 0.0 and 1.0
 */
function calculateGeoProximityScore(distanceMeters) {
  if (distanceMeters === Infinity || isNaN(distanceMeters)) return 0.5; // Neutral if no GPS

  if (distanceMeters <= 50) return 1.0;
  if (distanceMeters <= 200) return 1.0 - (distanceMeters - 50) / 300 * 0.2; // 1.0 -> 0.8
  if (distanceMeters <= 600) return 0.8 - (distanceMeters - 200) / 400 * 0.4; // 0.8 -> 0.4
  if (distanceMeters <= 1200) return 0.4 - (distanceMeters - 600) / 600 * 0.3; // 0.4 -> 0.1
  if (distanceMeters <= 2500) return 0.1 - (distanceMeters - 1200) / 1300 * 0.08; // 0.1 -> 0.02

  return 0.0;
}

/**
 * Normalizes category string to canonical form
 */
function normalizeCategory(cat) {
  if (!cat) return 'other';
  const c = String(cat).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (c.includes('road') || c.includes('pothole')) return 'road_damage';
  if (c.includes('garb') || c.includes('waste') || c.includes('trash')) return 'garbage_waste';
  if (c.includes('drain') || c.includes('sewer') || c.includes('gutter')) return 'drainage';
  if (c.includes('leak') || c.includes('water')) return 'water_leakage';
  if (c.includes('light') || c.includes('lamp')) return 'streetlight';
  return c;
}

/**
 * Calculates category match score between two category names
 * @param {string} cat1
 * @param {string} cat2
 * @returns {number} Value between 0.0 and 1.0
 */
function calculateCategoryScore(cat1, cat2) {
  if (!cat1 || !cat2) return 0.5;

  const n1 = normalizeCategory(cat1);
  const n2 = normalizeCategory(cat2);

  if (n1 === n2) return 1.0;

  // Cross-category semantic overlap (e.g. water supply vs drainage)
  if ((n1 === 'water_leakage' && n2 === 'drainage') || (n1 === 'drainage' && n2 === 'water_leakage')) {
    return 0.4;
  }

  return 0.0;
}

/**
 * Multi-factor duplicate confidence score calculation
 * Combines:
 * - Semantic Sentence Embedding Similarity (55% weight)
 * - GPS Geographic Proximity (30% weight)
 * - Category Alignment (15% weight)
 */
function calculateDuplicateConfidence(semanticSimilarity, geoProximityScore, categoryScore, distanceMeters) {
  let confidence = (0.55 * semanticSimilarity) + (0.30 * geoProximityScore) + (0.15 * categoryScore);

  // Boost confidence if within 150m and high semantic similarity
  if (distanceMeters <= 150 && semanticSimilarity >= 0.75) {
    confidence = Math.min(0.99, confidence + 0.08);
  }

  // Strong penalty if coordinates are valid but distance is greater than 5km
  if (distanceMeters > 5000 && distanceMeters !== Infinity) {
    confidence = Math.min(0.48, confidence * 0.6);
  }

  return Number(Math.max(0, Math.min(0.99, confidence)).toFixed(2));
}

/**
 * Checks if a complaint is a possible duplicate of any existing complaints in the database.
 *
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} [params.category]
 * @param {number} [params.latitude]
 * @param {number} [params.longitude]
 * @param {string} [params.district]
 * @param {string} [params.excludeId] ID of complaint to exclude (e.g. during updates)
 * @returns {Promise<{ isDuplicate: boolean, confidence: number, duplicateOf: object|null, similarity: number, distanceMeters: number, matchedComplaint: object|null }>}
 */
async function checkDuplicateComplaint({
  title = '',
  description = '',
  category = '',
  latitude,
  longitude,
  district,
  excludeId
}) {
  const fullText = `${title.trim()}. ${description.trim()}`.trim();
  if (fullText.length < 10) {
    return {
      isDuplicate: false,
      confidence: 0,
      duplicateOf: null,
      similarity: 0,
      distanceMeters: Infinity,
      matchedComplaint: null
    };
  }

  const parsedLat = latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null;
  const parsedLng = longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null;

  // Build filter for potential duplicate candidates in DB:
  // Active complaints filed in the last 60 days (or non-resolved)
  const candidateFilter = {
    status: { $in: ['Pending', 'Verified', 'Assigned', 'In Progress'] }
  };

  if (excludeId) {
    candidateFilter._id = { $ne: excludeId };
  }

  if (district) {
    candidateFilter.district = { $regex: new RegExp(`^${district.trim()}$`, 'i') };
  }

  // Retrieve candidates (up to 50 most recent candidates for responsive evaluation)
  const candidates = await Complaint.find(candidateFilter)
    .sort({ createdAt: -1 })
    .limit(50)
    .select('_id complaintId title description category status priority latitude longitude district city ward createdAt');

  if (!candidates || candidates.length === 0) {
    return {
      isDuplicate: false,
      confidence: 0,
      duplicateOf: null,
      similarity: 0,
      distanceMeters: Infinity,
      matchedComplaint: null
    };
  }

  // Compute sentence embedding for new complaint
  const newEmbedding = await getSentenceEmbedding(fullText);

  let bestMatch = null;
  let highestConfidence = 0;
  let bestSimilarity = 0;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const candidateText = `${candidate.title}. ${candidate.description}`.trim();
    const candidateEmbedding = await getSentenceEmbedding(candidateText);

    const semanticSim = cosineSimilarity(newEmbedding, candidateEmbedding);

    const distanceMeters = (parsedLat !== null && parsedLng !== null && candidate.latitude && candidate.longitude)
      ? calculateHaversineDistance(parsedLat, parsedLng, candidate.latitude, candidate.longitude)
      : Infinity;

    const geoScore = calculateGeoProximityScore(distanceMeters);
    const catScore = calculateCategoryScore(category || '', candidate.category || '');

    const conf = calculateDuplicateConfidence(semanticSim, geoScore, catScore, distanceMeters);

    if (conf > highestConfidence) {
      highestConfidence = conf;
      bestMatch = candidate;
      bestSimilarity = semanticSim;
      bestDistance = distanceMeters;
    }
  }

  const DUPLICATE_THRESHOLD = 0.70; // 70% threshold for duplicate classification
  const isDuplicate = highestConfidence >= DUPLICATE_THRESHOLD;

  return {
    isDuplicate,
    confidence: highestConfidence,
    duplicateOf: isDuplicate && bestMatch ? bestMatch._id : null,
    similarity: Number(bestSimilarity.toFixed(2)),
    distanceMeters: bestDistance === Infinity ? null : Math.round(bestDistance),
    matchedComplaint: isDuplicate && bestMatch ? {
      _id: bestMatch._id,
      complaintId: bestMatch.complaintId,
      title: bestMatch.title,
      description: bestMatch.description,
      category: bestMatch.category,
      status: bestMatch.status,
      city: bestMatch.city,
      createdAt: bestMatch.createdAt,
      distanceMeters: bestDistance === Infinity ? null : Math.round(bestDistance)
    } : null
  };
}

module.exports = {
  getSentenceEmbedding,
  cosineSimilarity,
  calculateHaversineDistance,
  calculateGeoProximityScore,
  calculateCategoryScore,
  calculateDuplicateConfidence,
  checkDuplicateComplaint
};
