const assert = require('assert');
const {
  getSentenceEmbedding,
  cosineSimilarity,
  calculateHaversineDistance,
  calculateGeoProximityScore,
  calculateCategoryScore,
  calculateDuplicateConfidence
} = require('../utils/duplicateDetector');

async function runUnitTests() {
  console.log('--- Running Duplicate Detector Unit Tests ---');

  // Test 1: Sentence Embedding generation
  console.log('\n[TEST 1] Generating sentence embeddings...');
  const text1 = 'Heavy potholes and cracks on the main highway road near junction';
  const text2 = 'Major potholes on the highway causing vehicles to lose balance';
  const text3 = 'Streetlight lamp post bulb is fused and road is pitch dark at night';

  const emb1 = await getSentenceEmbedding(text1);
  const emb2 = await getSentenceEmbedding(text2);
  const emb3 = await getSentenceEmbedding(text3);

  assert.strictEqual(emb1.length, 384, 'Embedding length should be 384');
  assert.strictEqual(emb2.length, 384, 'Embedding length should be 384');
  assert.strictEqual(emb3.length, 384, 'Embedding length should be 384');
  console.log('Embeddings generated with dimension:', emb1.length);

  // Test 2: Cosine Similarity between semantically similar vs dissimilar texts
  console.log('\n[TEST 2] Testing cosine similarity...');
  const sim12 = cosineSimilarity(emb1, emb2);
  const sim13 = cosineSimilarity(emb1, emb3);
  console.log(`Similarity (Potholes vs Potholes): ${sim12.toFixed(3)}`);
  console.log(`Similarity (Potholes vs Streetlight): ${sim13.toFixed(3)}`);

  assert.ok(sim12 > sim13, 'Similar texts should have higher cosine similarity than dissimilar texts');
  assert.ok(sim12 >= 0.65, 'Similar texts should have cosine similarity >= 0.65');

  // Test 3: Haversine GPS Distance
  console.log('\n[TEST 3] Testing GPS Haversine distance...');
  // Kochi Junction 1 to nearby spot (~110 meters away)
  const lat1 = 9.981600, lon1 = 76.299900;
  const lat2 = 9.982400, lon2 = 76.300500;
  const distNear = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  console.log(`Nearby distance: ${distNear.toFixed(1)} meters`);
  assert.ok(distNear > 80 && distNear < 150, 'Distance should be approximately 100-130m');

  // Distant location (~25km away)
  const latFar = 10.150000, lonFar = 76.400000;
  const distFar = calculateHaversineDistance(lat1, lon1, latFar, lonFar);
  console.log(`Far distance: ${(distFar / 1000).toFixed(1)} km`);
  assert.ok(distFar > 20000, 'Distance should be > 20km');

  // Test 4: Geo Proximity Score
  console.log('\n[TEST 4] Testing geo proximity score decay...');
  const geoNear = calculateGeoProximityScore(distNear);
  const geoFar = calculateGeoProximityScore(distFar);
  console.log(`Geo score for ${distNear.toFixed(0)}m: ${geoNear.toFixed(2)}`);
  console.log(`Geo score for ${(distFar / 1000).toFixed(0)}km: ${geoFar.toFixed(2)}`);
  assert.ok(geoNear >= 0.80, 'Nearby location should have high geo score');
  assert.strictEqual(geoFar, 0.0, 'Location > 2km should have 0 geo score');

  // Test 5: Category Alignment
  console.log('\n[TEST 5] Testing category matching...');
  const catExact = calculateCategoryScore('Road Damage', 'Road Damage');
  const catCanonical = calculateCategoryScore('Garbage', 'Garbage/Waste');
  const catDiff = calculateCategoryScore('Road Damage', 'Streetlight');
  console.log(`Exact match score: ${catExact}`);
  console.log(`Canonical match score: ${catCanonical}`);
  console.log(`Different category score: ${catDiff}`);
  assert.strictEqual(catExact, 1.0);
  assert.ok(catCanonical >= 0.9);
  assert.strictEqual(catDiff, 0.0);

  // Test 6: Combined Duplicate Confidence Score
  console.log('\n[TEST 6] Testing multi-factor combined confidence score...');
  // Scenario A: Duplicate complaint (same category, high semantic similarity, 100m away)
  const confDup = calculateDuplicateConfidence(0.88, 0.95, 1.0, 110);
  console.log(`Scenario A (Duplicate: high similarity, nearby, same category): ${(confDup * 100).toFixed(0)}%`);
  assert.ok(confDup >= 0.70, 'Should exceed duplicate threshold >= 0.70');

  // Scenario B: Distinct complaint (different category, far away)
  const confDistinct = calculateDuplicateConfidence(0.20, 0.0, 0.0, 25000);
  console.log(`Scenario B (Distinct: low similarity, far away, diff category): ${(confDistinct * 100).toFixed(0)}%`);
  assert.ok(confDistinct < 0.35, 'Should be well below duplicate threshold');

  console.log('\nAll Duplicate Detector Unit Tests Passed Successfully!');
}

runUnitTests().catch(err => {
  console.error('Duplicate Detector Unit Test Failed:', err);
  process.exit(1);
});
