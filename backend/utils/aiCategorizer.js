/**
 * AI Complaint Categorizer for GramConnect
 * Automatically classifies civic grievance complaints into canonical categories:
 * - Road Damage
 * - Garbage/Waste
 * - Drainage
 * - Water Leakage
 * - Streetlight
 * - Other
 */

const CATEGORIES = {
  ROAD_DAMAGE: 'Road Damage',
  GARBAGE_WASTE: 'Garbage/Waste',
  DRAINAGE: 'Drainage',
  WATER_LEAKAGE: 'Water Leakage',
  STREETLIGHT: 'Streetlight',
  OTHER: 'Other'
};

// Department mapping for each canonical category
const CATEGORY_DEPARTMENT_MAP = {
  'Road Damage': 'Public Works Department (PWD)',
  'Garbage/Waste': 'Sanitation Department',
  'Drainage': 'Sewage & Drainage Board',
  'Water Leakage': 'Water Authority',
  'Streetlight': 'Electricity Board',
  'Other': 'General Panchayat Administration'
};

// Lexical & semantic rules with keyword weights
const CLASSIFICATION_RULES = {
  [CATEGORIES.ROAD_DAMAGE]: {
    phrases: [
      { pattern: /\b(road\s*damage|damaged\s*road|broken\s*road|bad\s*road)\b/i, weight: 6 },
      { pattern: /\b(pot\s*holes?|potholed?)\b/i, weight: 6 },
      { pattern: /\b(caved?\s*in|sink\s*hole|road\s*sinking)\b/i, weight: 5 },
      { pattern: /\b(tar(ring)?|re-?tarring|asphalt|blacktop)\b/i, weight: 4 },
      { pattern: /\b(speed\s*breaker|curb|kerb|road\s*divider)\b/i, weight: 4 },
      { pattern: /\b(footpath|pedestrian\s*walkway|pavement\s*broken)\b/i, weight: 4 },
      { pattern: /\b(crater|road\s*patch|cracked\s*road|uneven\s*road)\b/i, weight: 4 },
      { pattern: /\b(highway|main\s*road|street\s*surface|gravel)\b/i, weight: 2 }
    ],
    negatives: [
      { pattern: /\b(street\s*light|lamp\s*post|drinking\s*water|pipe\s*burst)\b/i, penalty: 2 }
    ]
  },

  [CATEGORIES.GARBAGE_WASTE]: {
    phrases: [
      { pattern: /\b(garbage|trash|rubbish|litter)\b/i, weight: 5 },
      { pattern: /\b(waste\s*dump(ing)?|dump\s*yard|waste\s*pile|pile\s*of\s*waste)\b/i, weight: 6 },
      { pattern: /\b(dustbin|waste\s*bin|bin\s*overflow(ing)?)\b/i, weight: 5 },
      { pattern: /\b(plastic\s*waste|solid\s*waste|bio-?\s*waste|food\s*waste)\b/i, weight: 5 },
      { pattern: /\b(uncollected\s*waste|uncollected\s*garbage|waste\s*clearing)\b/i, weight: 6 },
      { pattern: /\b(rotting\s*waste|foul\s*smell|stench|stinking)\b/i, weight: 4 },
      { pattern: /\b(sanitation|sweeper|cleanliness|swachh)\b/i, weight: 3 },
      { pattern: /\b(waste|debris)\b/i, weight: 3 }
    ],
    negatives: [
      { pattern: /\b(pipe\s*leak|sewer|drainage|manhole)\b/i, penalty: 2 }
    ]
  },

  [CATEGORIES.DRAINAGE]: {
    phrases: [
      { pattern: /\b(drainage|drain|drains)\b/i, weight: 5 },
      { pattern: /\b(sewer|sewage|sewerage)\b/i, weight: 6 },
      { pattern: /\b(clogged\s*drain|blocked\s*drain|choked\s*drain)\b/i, weight: 6 },
      { pattern: /\b(gutter|open\s*gutter|blocked\s*gutter|gutter\s*overflow)\b/i, weight: 6 },
      { pattern: /\b(manhole|open\s*manhole|manhole\s*cover)\b/i, weight: 6 },
      { pattern: /\b(sewage\s*overflow(ing)?|drain\s*overflow(ing)?)\b/i, weight: 6 },
      { pattern: /\b(storm\s*drain|culvert|wastewater|waste\s*water)\b/i, weight: 5 },
      { pattern: /\b(stagnant\s*drain|drain\s*water|canal\s*blocked)\b/i, weight: 5 },
      { pattern: /\b(water\s*logging|waterlogging)\b/i, weight: 4 }
    ],
    negatives: [
      { pattern: /\b(drinking\s*water|tap\s*leak|pipe\s*leak|water\s*supply)\b/i, penalty: 3 }
    ]
  },

  [CATEGORIES.WATER_LEAKAGE]: {
    phrases: [
      { pattern: /\b(water\s*leak(age)?|leaking\s*water|water\s*is\s*leaking)\b/i, weight: 6 },
      { pattern: /\b(pipe\s*leak(age)?|leaking\s*pipe|broken\s*pipe)\b/i, weight: 6 },
      { pattern: /\b(pipeline\s*burst|burst\s*pipe|pipe\s*burst)\b/i, weight: 6 },
      { pattern: /\b(drinking\s*water\s*(leak|wasted|gushing)|clean\s*water\s*leak)\b/i, weight: 6 },
      { pattern: /\b(water\s*pipe|water\s*main|main\s*line\s*pipe)\b/i, weight: 5 },
      { pattern: /\b(tap\s*leak(ing)?|public\s*tap|leaking\s*tap)\b/i, weight: 5 },
      { pattern: /\b(tank\s*overflow(ing)?|overhead\s*tank)\b/i, weight: 5 },
      { pattern: /\b(valve\s*leak|water\s*meter\s*leak|water\s*gushing)\b/i, weight: 5 },
      { pattern: /\b(water\s*supply|water\s*connection)\b/i, weight: 3 }
    ],
    negatives: [
      { pattern: /\b(sewer|sewage|manhole|gutter|clogged\s*drain)\b/i, penalty: 4 }
    ]
  },

  [CATEGORIES.STREETLIGHT]: {
    phrases: [
      { pattern: /\b(street\s*lights?|streetlights?)\b/i, weight: 6 },
      { pattern: /\b(lamp\s*posts?|lampposts?|light\s*poles?)\b/i, weight: 6 },
      { pattern: /\b(light\s*not\s*working|light\s*off|lights\s*are\s*off)\b/i, weight: 5 },
      { pattern: /\b(dark\s*street|dark\s*road|darkness\s*at\s*night|pitch\s*dark)\b/i, weight: 5 },
      { pattern: /\b(flickering\s*(light|bulb)|bulb\s*(fused|broken|damaged))\b/i, weight: 5 },
      { pattern: /\b(blackout\s*on\s*road|no\s*light\s*on\s*street)\b/i, weight: 5 },
      { pattern: /\b(led\s*street\s*light|solar\s*street\s*light)\b/i, weight: 5 },
      { pattern: /\b(lamp|lighting|light\s*fixture)\b/i, weight: 2 }
    ],
    negatives: [
      { pattern: /\b(pot\s*hole|sewage|garbage|water\s*leak)\b/i, penalty: 2 }
    ]
  }
};

/**
 * Normalizes text for processing
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().trim();
}

/**
 * Deterministic rule-based classifier
 * Evaluates match weights across all categories and computes confidence.
 *
 * @param {string} title
 * @param {string} description
 * @returns {{ category: string, confidence: number, matchedKeywords: string[], scores: object }}
 */
function classifyLocally(title, description) {
  const combinedText = `${cleanText(title)} ${cleanText(description)}`;

  const scores = {};
  const matchedPhrases = {};

  for (const [category, rules] of Object.entries(CLASSIFICATION_RULES)) {
    let score = 0;
    const matches = [];

    // Title matches carry double weight
    const cleanedTitle = cleanText(title);
    const cleanedDesc = cleanText(description);

    for (const rule of rules.phrases) {
      const matchTitle = cleanedTitle.match(rule.pattern);
      const matchDesc = cleanedDesc.match(rule.pattern);

      if (matchTitle) {
        score += rule.weight * 2;
        matches.push(matchTitle[0]);
      } else if (matchDesc) {
        score += rule.weight;
        matches.push(matchDesc[0]);
      }
    }

    // Apply negative penalties if any
    if (rules.negatives) {
      for (const neg of rules.negatives) {
        if (combinedText.match(neg.pattern)) {
          score = Math.max(0, score - neg.penalty);
        }
      }
    }

    scores[category] = score;
    matchedPhrases[category] = matches;
  }

  // Find category with highest score
  let bestCategory = CATEGORIES.OTHER;
  let highestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }

  // Threshold: at least 3 points needed for a confident category assignment
  if (highestScore < 3) {
    return {
      category: CATEGORIES.OTHER,
      confidence: 0.65,
      matchedKeywords: [],
      scores
    };
  }

  // Calculate normalized confidence score (between 0.75 and 0.99)
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const ratio = totalScore > 0 ? highestScore / totalScore : 0.5;
  const confidence = Math.min(0.99, Math.max(0.75, Number((0.65 + ratio * 0.34).toFixed(2))));

  return {
    category: bestCategory,
    confidence,
    matchedKeywords: matchedPhrases[bestCategory] || [],
    scores
  };
}

/**
 * Primary AI Categorizer entrypoint
 * Uses local classifier and optionally enhances with Gemini if API key is present.
 *
 * @param {string} title
 * @param {string} description
 * @returns {Promise<{ category: string, confidence: number, matchedKeywords: string[], isAiDetected: boolean }>}
 */
async function classifyComplaint(title, description) {
  // Always compute local classification first
  const localResult = classifyLocally(title, description);

  // If GEMINI_API_KEY is available and valid, we can attempt an enhanced check with short timeout
  if (process.env.GEMINI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const prompt = `Classify this civic issue into EXACTLY ONE of these categories:
- Road Damage
- Garbage/Waste
- Drainage
- Water Leakage
- Streetlight
- Other

Title: ${title}
Description: ${description}

Respond ONLY with JSON format: {"category": "...", "confidence": 0.95}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textContent) {
          const parsed = JSON.parse(textContent);
          const validCategories = Object.values(CATEGORIES);
          if (validCategories.includes(parsed.category)) {
            return {
              category: parsed.category,
              confidence: Number(parsed.confidence) || 0.95,
              matchedKeywords: localResult.matchedKeywords,
              isAiDetected: true
            };
          }
        }
      }
    } catch {
      // Graceful fallback to deterministic local classifier on any error or timeout
    }
  }

  return {
    category: localResult.category,
    confidence: localResult.confidence,
    matchedKeywords: localResult.matchedKeywords,
    isAiDetected: true
  };
}

module.exports = {
  CATEGORIES,
  CATEGORY_DEPARTMENT_MAP,
  classifyComplaint,
  classifyLocally
};
