const assert = require('assert');
const {
  getSentenceEmbedding,
  getFallbackEmbedding,
  cosineSimilarity,
  calculateHaversineDistance,
  calculateGeoProximityScore,
  calculateCategoryScore,
  calculateRecencyScore,
  calculateStatusScore,
  calculateDuplicateConfidence
} = require('../utils/duplicateDetector');

async function runUnitTests() {
  console.log('====================================================');
  console.log('--- Running AI Duplicate Complaint Detection Tests ---');
  console.log('====================================================');

  // Test 1: Sentence Embedding generation
  console.log('\n[TEST 1] Generating sentence embeddings...');
  const text1 = 'Large pothole on the road near junction';
  const text2 = 'Road has a big hole near the junction';
  const text3 = 'Streetlight lamp post bulb is fused and road is pitch dark';

  const emb1 = await getSentenceEmbedding(text1);
  const emb2 = await getSentenceEmbedding(text2);
  const emb3 = await getSentenceEmbedding(text3);

  assert.strictEqual(emb1.length, 384, 'Embedding length should be 384');
  assert.strictEqual(emb2.length, 384, 'Embedding length should be 384');
  assert.strictEqual(emb3.length, 384, 'Embedding length should be 384');
  console.log('✓ Embeddings generated with dimension:', emb1.length);

  // Test 2: Cosine Similarity between semantically similar vs dissimilar texts
  console.log('\n[TEST 2] Testing cosine similarity...');
  const sim12 = cosineSimilarity(emb1, emb2);
  const sim13 = cosineSimilarity(emb1, emb3);
  console.log(`  Similarity ("Large pothole on road" vs "Road has a big hole"): ${sim12.toFixed(3)}`);
  console.log(`  Similarity ("Large pothole on road" vs "Streetlight is fused"): ${sim13.toFixed(3)}`);

  assert.ok(sim12 > sim13, 'Similar texts should have significantly higher cosine similarity than dissimilar texts');
  assert.ok(sim12 >= 0.65, `Semantically similar texts should have cosine similarity >= 0.65, got ${sim12.toFixed(3)}`);
  assert.ok(sim13 < 0.40, `Unrelated texts should have low cosine similarity < 0.40, got ${sim13.toFixed(3)}`);
  console.log('✓ Semantic similarity comparison verified.');

  // Test 3: Haversine GPS Distance Calculation
  console.log('\n[TEST 3] Testing GPS Haversine distance...');
  // Kochi Location A to nearby Location B (~110 meters away)
  const lat1 = 9.981600, lon1 = 76.299900;
  const lat2 = 9.982400, lon2 = 76.300500;
  const distNear = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  console.log(`  Nearby distance: ${distNear.toFixed(1)} meters`);
  assert.ok(distNear > 80 && distNear < 150, 'Distance should be approximately 100-130m');

  // Distant location (~21.7 km away)
  const latFar = 10.150000, lonFar = 76.400000;
  const distFar = calculateHaversineDistance(lat1, lon1, latFar, lonFar);
  console.log(`  Far distance: ${(distFar / 1000).toFixed(1)} km`);
  assert.ok(distFar > 20000, 'Distance should be > 20km');
  console.log('✓ Haversine distance calculations verified.');

  // Test 4: Geo Proximity Score Decay
  console.log('\n[TEST 4] Testing geo proximity score decay...');
  const geoNear = calculateGeoProximityScore(distNear);
  const geoFar = calculateGeoProximityScore(distFar);
  const geoMissing = calculateGeoProximityScore(Infinity);
  console.log(`  Geo score for ${distNear.toFixed(0)}m: ${geoNear.toFixed(2)}`);
  console.log(`  Geo score for ${(distFar / 1000).toFixed(0)}km: ${geoFar.toFixed(2)}`);
  console.log(`  Geo score for missing GPS: ${geoMissing.toFixed(2)}`);
  assert.ok(geoNear >= 0.80, 'Nearby location should have high geo score (>= 0.80)');
  assert.strictEqual(geoFar, 0.0, 'Location > 3km should have 0.0 geo score');
  assert.strictEqual(geoMissing, 0.5, 'Missing GPS should default to 0.5 neutral score');
  console.log('✓ Geo proximity decay verified.');

  // Test 5: Category Alignment & Canonical Mapping
  console.log('\n[TEST 5] Testing category matching...');
  const catExact = calculateCategoryScore('Road Damage', 'Road Damage');
  const catCanonical = calculateCategoryScore('Garbage', 'Garbage/Waste');
  const catRelated = calculateCategoryScore('Water Leakage', 'Drainage');
  const catDiff = calculateCategoryScore('Road Damage', 'Streetlight');
  console.log(`  Exact match score: ${catExact}`);
  console.log(`  Canonical match score: ${catCanonical}`);
  console.log(`  Related categories score: ${catRelated}`);
  console.log(`  Different category score: ${catDiff}`);
  assert.strictEqual(catExact, 1.0);
  assert.ok(catCanonical >= 0.9);
  assert.ok(catRelated >= 0.3 && catRelated <= 0.5);
  assert.strictEqual(catDiff, 0.0);
  console.log('✓ Category matching verified.');

  // Test 6: Recency & Status Weighting
  console.log('\n[TEST 6] Testing recency & status weighting...');
  const recentDate = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const recRecent = calculateRecencyScore(recentDate);
  const rec30 = calculateRecencyScore(thirtyDaysAgo);
  const rec90 = calculateRecencyScore(ninetyDaysAgo);
  console.log(`  Recency score (today): ${recRecent.toFixed(2)}`);
  console.log(`  Recency score (30 days ago): ${rec30.toFixed(2)}`);
  console.log(`  Recency score (90 days ago): ${rec90.toFixed(2)}`);
  assert.ok(recRecent > rec30 && rec30 > rec90, 'Recency score should decay over time');

  const statusPending = calculateStatusScore('Pending');
  const statusResolved = calculateStatusScore('Resolved');
  assert.strictEqual(statusPending, 1.0);
  assert.ok(statusResolved < 0.6);
  console.log('✓ Recency and status scores verified.');

  // Test 7: SCENARIO 1 - Exact Duplicates
  console.log('\n[TEST 7] SCENARIO 1: Exact Duplicates (Same text, same location)...');
  const confExact = calculateDuplicateConfidence(1.0, 1.0, 1.0, 10, 1.0, 1.0);
  console.log(`  Exact duplicate confidence: ${(confExact * 100).toFixed(0)}%`);
  assert.ok(confExact >= 0.85, 'Exact duplicate should have confidence >= 85%');
  console.log('✓ Scenario 1 passed: Exact duplicate classified with high confidence.');

  // Test 8: SCENARIO 2 - Semantically Similar at Same Location
  console.log('\n[TEST 8] SCENARIO 2: Semantically Similar at Same Location ("large pothole" vs "big hole")...');
  // 80 meters away, category Road Damage match, 3 days old
  const confSemanticNear = calculateDuplicateConfidence(sim12, 0.96, 1.0, 80, 1.0, 1.0);
  console.log(`  Semantic similar nearby confidence: ${(confSemanticNear * 100).toFixed(0)}%`);
  assert.ok(confSemanticNear >= 0.75, `Should exceed duplicate threshold (>= 0.75), got ${confSemanticNear}`);
  console.log('✓ Scenario 2 passed: Semantically similar complaints detected as duplicate.');

  // Test 9: SCENARIO 3 - Similar Complaints at Different Locations (False Positive Avoidance)
  console.log('\n[TEST 9] SCENARIO 3: Similar Complaints at Different Locations (False Positive Avoidance)...');
  // High semantic similarity (0.85), but 22km away
  const confDistant = calculateDuplicateConfidence(0.85, 0.0, 1.0, 22000, 1.0, 1.0);
  console.log(`  Distant similar issue confidence (22km apart): ${(confDistant * 100).toFixed(0)}%`);
  assert.ok(confDistant < 0.45, `Distant issue should receive penalty and be < 0.45, got ${confDistant}`);
  console.log('✓ Scenario 3 passed: False positives across distant locations strictly prevented.');

  // Test 10: SCENARIO 4 - Unrelated Complaints (Different issues at same location)
  console.log('\n[TEST 10] SCENARIO 4: Unrelated Complaints (Pothole vs Streetlight)...');
  const confUnrelated = calculateDuplicateConfidence(sim13, 1.0, 0.0, 30, 1.0, 1.0);
  console.log(`  Unrelated issues confidence: ${(confUnrelated * 100).toFixed(0)}%`);
  assert.ok(confUnrelated < 0.35, `Unrelated issues should have confidence < 0.35, got ${confUnrelated}`);
  console.log('✓ Scenario 4 passed: Unrelated complaints correctly recognized as distinct.');

  // Test 11: SCENARIO 5 - Missing GPS Coordinates Handling
  console.log('\n[TEST 11] SCENARIO 5: Missing GPS Coordinates Handling...');
  // High similarity (0.80), same category, but GPS is missing (distance = Infinity)
  const confMissingGPS = calculateDuplicateConfidence(0.80, 0.5, 1.0, Infinity, 1.0, 1.0);
  console.log(`  Missing GPS confidence: ${(confMissingGPS * 100).toFixed(0)}%`);
  assert.ok(confMissingGPS <= 0.68, 'Missing GPS should be capped at <= 0.68 (possible match only, never definite)');
  assert.ok(confMissingGPS >= 0.50, 'Should still provide a possible-match warning (>= 0.50)');
  console.log('✓ Scenario 5 passed: Missing GPS produces cautious possible-match warning without claiming definite duplicate.');

  // Test 12: SCENARIO 6 - Fallback Concept Embedding Resilience
  console.log('\n[TEST 12] SCENARIO 6: Fallback Concept Embedding Resilience...');
  const fb1 = getFallbackEmbedding('large pothole on the road');
  const fb2 = getFallbackEmbedding('road has a big hole');
  const fbSim = cosineSimilarity(fb1, fb2);
  console.log(`  Fallback concept similarity ("large pothole" vs "big hole"): ${fbSim.toFixed(3)}`);
  assert.ok(fbSim >= 0.65, `Fallback vector must capture concept similarity >= 0.65, got ${fbSim.toFixed(3)}`);
  console.log('✓ Scenario 6 passed: Fallback embedding successfully captures domain synonyms offline.');

  console.log('\n====================================================');
  console.log('All 12 AI Duplicate Detection Tests Passed Successfully!');
  console.log('====================================================');
}

runUnitTests().catch(err => {
  console.error('Duplicate Detector Unit Test Failed:', err);
  process.exit(1);
});
