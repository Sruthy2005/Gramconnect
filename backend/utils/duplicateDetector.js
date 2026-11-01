/**
 * AI-based Duplicate Complaint Detection for GramConnect
 * Uses sentence embeddings (Transformers.js with Xenova/all-MiniLM-L6-v2)
 * combined with semantic concept expansion, GPS geographic proximity (Haversine formula),
 * canonical category matching, status weighting, and recency decay.
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
      env.allowLocalModels = false;
      env.useBrowserCache = false;

      // Wrap pipeline creation in a timeout to prevent hanging on network/serverless issues
      const pipelineTask = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transformers pipeline initialization timed out')), 5000)
      );

      const extractor = await Promise.race([pipelineTask, timeoutPromise]);
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
  'into', 'has', 'have', 'had', 'near', 'causing', 'around', 'here', 'there', 'please',
  'fix', 'help', 'our', 'my', 'village', 'area', 'locality', 'problem', 'issue', 'complaint'
]);

// Civic concept dictionary for robust synonym/semantic mapping even in fallback mode
const CIVIC_CONCEPT_SYNONYMS = {
  pothole: [
    'pothole', 'potholes', 'crater', 'craters', 'hole', 'holes', 'tar', 'tarring',
    'asphalt', 'cavein', 'cavedin', 'sinkhole', 'brokenroad', 'badroad', 'rut', 'ruts', 'uneven'
  ],
  road: [
    'road', 'highway', 'street', 'lane', 'avenue', 'junction', 'flyover',
    'pavement', 'footpath', 'bypass', 'crossroad', 'walkway'
  ],
  garbage: [
    'garbage', 'trash', 'waste', 'rubbish', 'litter', 'debris', 'dump', 'dumping',
    'dustbin', 'bin', 'stench', 'smell', 'rotting', 'cleanliness', 'swachh'
  ],
  drainage: [
    'drain', 'drainage', 'gutter', 'sewer', 'sewage', 'manhole', 'culvert',
    'waterlogging', 'stormwater', 'choked', 'clogged', 'blocked', 'overflow'
  ],
  waterleak: [
    'leak', 'leaking', 'leakage', 'burst', 'pipeline', 'pipe', 'tap',
    'gushing', 'spill', 'drinkingwater', 'cleanwater', 'watersupply'
  ],
  streetlight: [
    'light', 'streetlight', 'streetlights', 'lamp', 'lamppost', 'pole',
    'dark', 'darkness', 'flickering', 'bulb', 'blackout', 'night'
  ]
};

function stemToken(word) {
  return word
    .toLowerCase()
    .replace(/(ing|ed|es|s|ation|age|ly)$/, '')
    .trim();
}

/**
 * Resilient fallback dense embedding generator
 * Computes deterministic n-gram and civic-concept semantic vector when transformer is loading or offline
 */
function getFallbackEmbedding(text, dim = 384) {
  const vec = new Float32Array(dim);
  if (!text || typeof text !== 'string') return Array.from(vec);

  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
  const rawWords = clean.split(/\s+/).filter(Boolean);
  const words = rawWords.filter(w => !STOP_WORDS.has(w) && w.length > 1);

  if (words.length === 0) return Array.from(vec);

  // Concept expansion: activate canonical concepts if synonyms appear
  const compactText = clean.replace(/\s+/g, '');
  for (const [canonical, syns] of Object.entries(CIVIC_CONCEPT_SYNONYMS)) {
    const matched = syns.some(s => clean.includes(s) || compactText.includes(s));
    if (matched) {
      words.push(`__concept_${canonical}__`);
    }
  }

  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i];
    const stemmed = stemToken(rawWord);

    // Hash word into multiple vector dimensions
    let h1 = 0;
    let h2 = 0;
    for (let c = 0; c < stemmed.length; c++) {
      const code = stemmed.charCodeAt(c);
      h1 = ((h1 << 5) - h1 + code) | 0;
      h2 = ((h2 << 7) + h2 + code) | 0;
    }

    const idx1 = Math.abs(h1) % dim;
    const idx2 = Math.abs(h2) % dim;
    const isConcept = rawWord.startsWith('__concept_');
    const weight = isConcept ? 6.0 : (1.8 + Math.min(2.5, stemmed.length / 2));

    vec[idx1] += weight;
    vec[idx2] += weight * 0.85;

    // Character trigrams
    for (let j = 0; j < stemmed.length - 2; j++) {
      const tg = stemmed.charCodeAt(j) * 31 * 31 + stemmed.charCodeAt(j + 1) * 31 + stemmed.charCodeAt(j + 2);
      const tgIdx = Math.abs(tg) % dim;
      vec[tgIdx] += 0.4;
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
 * Uses Transformers.js with timeout guard, falling back to deterministic semantic vectors.
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
      // Guard inference with a 2500ms timeout
      const inferencePromise = extractor(text, { pooling: 'mean', normalize: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Inference timed out')), 2500)
      );

      const output = await Promise.race([inferencePromise, timeoutPromise]);
      if (output && output.data) {
        return Array.from(output.data);
      }
    }
  } catch (err) {
    // Graceful fallback to resilient n-gram concept vector
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
  if (
    lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
    lat1 === null || lon1 === null || lat2 === null || lon2 === null ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
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
  if (distanceMeters === Infinity || distanceMeters === null || isNaN(distanceMeters)) {
    return 0.5; // Neutral baseline when GPS is unavailable
  }

  if (distanceMeters <= 50) return 1.0;
  if (distanceMeters <= 200) return 1.0 - ((distanceMeters - 50) / 150) * 0.2; // 1.0 -> 0.8
  if (distanceMeters <= 600) return 0.8 - ((distanceMeters - 200) / 400) * 0.4; // 0.8 -> 0.4
  if (distanceMeters <= 1500) return 0.4 - ((distanceMeters - 600) / 900) * 0.3; // 0.4 -> 0.1
  if (distanceMeters <= 3000) return 0.1 - ((distanceMeters - 1500) / 1500) * 0.08; // 0.1 -> 0.02

  return 0.0;
}

/**
 * Normalizes category string to canonical form
 */
function normalizeCategory(cat) {
  if (!cat) return 'other';
  const c = String(cat).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (c.includes('road') || c.includes('pothole') || c.includes('traffic')) return 'road_damage';
  if (c.includes('garb') || c.includes('waste') || c.includes('trash') || c.includes('environ')) return 'garbage_waste';
  if (c.includes('drain') || c.includes('sewer') || c.includes('gutter')) return 'drainage';
  if (c.includes('leak') || c.includes('water')) return 'water_leakage';
  if (c.includes('light') || c.includes('lamp') || c.includes('electr')) return 'streetlight';
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
 * Calculates recency decay score for existing complaints
 * Newer complaints receive higher duplicate likelihood weighting.
 * @param {Date|string} createdAt
 * @returns {number} Value between 0.1 and 1.0
 */
function calculateRecencyScore(createdAt) {
  if (!createdAt) return 0.8;
  const ageInDays = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (ageInDays <= 7) return 1.0;
  if (ageInDays <= 30) return 1.0 - ((ageInDays - 7) / 23) * 0.15; // 1.0 -> 0.85
  if (ageInDays <= 60) return 0.85 - ((ageInDays - 30) / 30) * 0.20; // 0.85 -> 0.65
  if (ageInDays <= 90) return 0.65 - ((ageInDays - 60) / 30) * 0.25; // 0.65 -> 0.40
  return Math.max(0.1, 0.40 - ((ageInDays - 90) / 90) * 0.30);
}

/**
 * Calculates status score
 * Active non-resolved complaints receive highest weight.
 * @param {string} status
 * @returns {number}
 */
function calculateStatusScore(status) {
  if (!status) return 0.8;
  switch (status) {
    case 'In Progress':
    case 'Assigned':
    case 'Verified':
    case 'Pending':
      return 1.0;
    case 'Resolved':
      return 0.45; // Recent resolved complaints can still be duplicate submissions
    case 'Rejected':
      return 0.1;
    default:
      return 0.7;
  }
}

/**
 * Multi-factor duplicate confidence score calculation
 * Combines:
 * - Semantic Sentence Embedding Similarity (50% weight)
 * - GPS Geographic Proximity (30% weight)
 * - Category Alignment (12% weight)
 * - Recency & Status Weighting (8% weight)
 *
 * Enforces strict false-positive penalties:
 * - Distance > 3km applies strong reduction factor (< 0.45 confidence)
 * - Missing GPS caps confidence at <= 0.68 ('possible' match only, never definite)
 * - Proximity boost when distance <= 200m and semantic similarity >= 0.70
 */
function calculateDuplicateConfidence(
  semanticSimilarity,
  geoProximityScore,
  categoryScore,
  distanceMeters,
  recencyScore = 1.0,
  statusScore = 1.0
) {
  const temporalScore = (recencyScore * 0.6) + (statusScore * 0.4);

  let confidence =
    (0.50 * semanticSimilarity) +
    (0.30 * geoProximityScore) +
    (0.12 * categoryScore) +
    (0.08 * temporalScore);

  // Proximity boost if very close (<= 200m) and high semantic similarity
  if (distanceMeters <= 200 && semanticSimilarity >= 0.70) {
    confidence = Math.min(0.99, confidence + 0.08);
  }

  // Strong penalty for different locations (> 3km) to prevent false positives
  if (distanceMeters > 3000 && distanceMeters !== Infinity && !isNaN(distanceMeters)) {
    confidence = Math.min(0.44, confidence * 0.45);
  }

  // If GPS is missing, cap confidence at 0.68 so it cannot be claimed as a definite duplicate
  if (distanceMeters === Infinity || distanceMeters === null || isNaN(distanceMeters)) {
    confidence = Math.min(0.68, confidence);
  }

  // Penalty if semantic similarity is very low (dissimilar text)
  if (semanticSimilarity < 0.40) {
    confidence = Math.min(0.35, confidence * 0.6);
  }

  return Number(Math.max(0, Math.min(0.99, confidence)).toFixed(2));
}

/**
 * Checks if a complaint is a duplicate of any existing complaints in the database.
 *
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} [params.category]
 * @param {number} [params.latitude]
 * @param {number} [params.longitude]
 * @param {string} [params.district]
 * @param {string} [params.city]
 * @param {string} [params.ward]
 * @param {string} [params.excludeId] ID of complaint to exclude
 * @param {string|null} [params.panchayatId] MongoDB ObjectId to scope search to one panchayat
 * @returns {Promise<{
 *   isDuplicate: boolean,
 *   isPossibleDuplicate: boolean,
 *   matchLevel: 'definite'|'possible'|'none',
 *   confidence: number,
 *   duplicateOf: object|null,
 *   similarity: number,
 *   distanceMeters: number|null,
 *   factors: object,
 *   matchedComplaint: object|null
 * }>}
 */
async function checkDuplicateComplaint({
  title = '',
  description = '',
  category = '',
  latitude,
  longitude,
  district = '',
  city = '',
  ward = '',
  excludeId,
  panchayatId
}) {
  const fullText = `${title.trim()}. ${description.trim()}`.trim();
  if (fullText.length < 10) {
    return {
      isDuplicate: false,
      isPossibleDuplicate: false,
      matchLevel: 'none',
      confidence: 0,
      duplicateOf: null,
      similarity: 0,
      distanceMeters: null,
      factors: { semanticSimilarity: 0, geoProximityScore: 0, categoryScore: 0, recencyScore: 0 },
      matchedComplaint: null
    };
  }

  const parsedLat = latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null;
  const parsedLng = longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null;
  const hasCoordinates = parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng);

  // Retrieve candidate active complaints (or recently resolved within 14 days)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const candidateFilter = {
    $or: [
      { status: { $in: ['Pending', 'Verified', 'Assigned', 'In Progress'] } },
      { status: 'Resolved', updatedAt: { $gte: twoWeeksAgo } }
    ]
  };

  if (excludeId) {
    candidateFilter._id = { $ne: excludeId };
  }

  // Scope to panchayat when provided (prevents cross-panchayat false positives)
  if (panchayatId) {
    const mongoose = require('mongoose');
    candidateFilter.panchayatId = typeof panchayatId === 'string'
      ? new mongoose.Types.ObjectId(panchayatId)
      : panchayatId;
  } else if (district && district.trim()) {
    const cleanDist = district.trim().replace(/\s*district\s*/gi, '').trim();
    candidateFilter.district = { $regex: new RegExp(cleanDist, 'i') };
  }

  // Retrieve candidates (up to 50 most recent candidates for responsive evaluation)
  let candidates = await Complaint.find(candidateFilter)
    .sort({ createdAt: -1 })
    .limit(50)
    .select('_id complaintId title description category status priority latitude longitude district city ward landmark createdAt');

  // If district filter yielded no candidates, broaden search across recent complaints (within same panchayat if given)
  if ((!candidates || candidates.length === 0) && district) {
    const broadFilter = {
      $or: [
        { status: { $in: ['Pending', 'Verified', 'Assigned', 'In Progress'] } },
        { status: 'Resolved', updatedAt: { $gte: twoWeeksAgo } }
      ]
    };
    if (excludeId) broadFilter._id = { $ne: excludeId };
    if (panchayatId) {
      const mongoose = require('mongoose');
      broadFilter.panchayatId = typeof panchayatId === 'string'
        ? new mongoose.Types.ObjectId(panchayatId)
        : panchayatId;
    }
    candidates = await Complaint.find(broadFilter)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id complaintId title description category status priority latitude longitude district city ward landmark createdAt');
  }

  if (!candidates || candidates.length === 0) {
    return {
      isDuplicate: false,
      isPossibleDuplicate: false,
      matchLevel: 'none',
      confidence: 0,
      duplicateOf: null,
      similarity: 0,
      distanceMeters: null,
      factors: { semanticSimilarity: 0, geoProximityScore: 0, categoryScore: 0, recencyScore: 0 },
      matchedComplaint: null
    };
  }

  // Compute sentence embedding for new complaint
  const newEmbedding = await getSentenceEmbedding(fullText);

  let bestMatch = null;
  let highestConfidence = 0;
  let bestSimilarity = 0;
  let bestDistance = Infinity;
  let bestFactors = { semanticSimilarity: 0, geoProximityScore: 0, categoryScore: 0, recencyScore: 0 };

  for (const candidate of candidates) {
    const candidateText = `${candidate.title}. ${candidate.description}`.trim();
    const candidateEmbedding = await getSentenceEmbedding(candidateText);

    const semanticSim = cosineSimilarity(newEmbedding, candidateEmbedding);

    const distanceMeters = (hasCoordinates && candidate.latitude !== undefined && candidate.longitude !== undefined && candidate.latitude !== null && candidate.longitude !== null)
      ? calculateHaversineDistance(parsedLat, parsedLng, candidate.latitude, candidate.longitude)
      : Infinity;

    const geoScore = calculateGeoProximityScore(distanceMeters);
    const catScore = calculateCategoryScore(category || '', candidate.category || '');
    const recencyScore = calculateRecencyScore(candidate.createdAt);
    const statusScore = calculateStatusScore(candidate.status);

    const conf = calculateDuplicateConfidence(
      semanticSim,
      geoScore,
      catScore,
      distanceMeters,
      recencyScore,
      statusScore
    );

    if (conf > highestConfidence) {
      highestConfidence = conf;
      bestMatch = candidate;
      bestSimilarity = semanticSim;
      bestDistance = distanceMeters;
      bestFactors = {
        semanticSimilarity: Number(semanticSim.toFixed(2)),
        geoProximityScore: Number(geoScore.toFixed(2)),
        categoryScore: Number(catScore.toFixed(2)),
        recencyScore: Number(recencyScore.toFixed(2))
      };
    }
  }

  // Thresholds:
  // definite match: >= 0.75 (high semantic similarity + verified close proximity)
  // possible match: >= 0.50 and < 0.75 (similar complaint found, or uncertain GPS)
  // none: < 0.50
  const DUPLICATE_DEFINITE_THRESHOLD = 0.75;
  const DUPLICATE_POSSIBLE_THRESHOLD = 0.50;

  let matchLevel = 'none';
  if (highestConfidence >= DUPLICATE_DEFINITE_THRESHOLD) {
    matchLevel = 'definite';
  } else if (highestConfidence >= DUPLICATE_POSSIBLE_THRESHOLD) {
    matchLevel = 'possible';
  }

  const isDuplicate = matchLevel === 'definite';
  const isPossibleDuplicate = matchLevel === 'possible' || matchLevel === 'definite';

  // Protect citizen data: sanitize description and do not expose personal citizen information (Requirement 9)
  const sanitizedDescription = bestMatch && bestMatch.description
    ? (bestMatch.description.length > 200 ? `${bestMatch.description.slice(0, 200)}...` : bestMatch.description)
    : '';

  return {
    isDuplicate,
    isPossibleDuplicate,
    matchLevel,
    confidence: highestConfidence,
    duplicateOf: (isPossibleDuplicate && bestMatch) ? bestMatch._id : null,
    similarity: Number(bestSimilarity.toFixed(2)),
    distanceMeters: bestDistance === Infinity ? null : Math.round(bestDistance),
    factors: bestFactors,
    matchedComplaint: (isPossibleDuplicate && bestMatch) ? {
      _id: bestMatch._id,
      complaintId: bestMatch.complaintId,
      title: bestMatch.title,
      description: sanitizedDescription,
      category: bestMatch.category,
      status: bestMatch.status,
      priority: bestMatch.priority || 'Normal',
      city: bestMatch.city,
      ward: bestMatch.ward || '',
      landmark: bestMatch.landmark || '',
      createdAt: bestMatch.createdAt,
      distanceMeters: bestDistance === Infinity ? null : Math.round(bestDistance),
      similarity: Number(bestSimilarity.toFixed(2)),
      confidence: highestConfidence,
      matchLevel
    } : null
  };
}

module.exports = {
  getSentenceEmbedding,
  getFallbackEmbedding,
  cosineSimilarity,
  calculateHaversineDistance,
  calculateGeoProximityScore,
  calculateCategoryScore,
  calculateRecencyScore,
  calculateStatusScore,
  calculateDuplicateConfidence,
  checkDuplicateComplaint
};
