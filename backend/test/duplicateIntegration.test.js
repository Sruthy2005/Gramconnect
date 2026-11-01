const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const assert = require('assert');
const app = require('../app');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Panchayat = require('../models/Panchayat');

async function testDuplicateIntegration() {
  console.log('================================================================');
  console.log('--- Starting Integration Test for AI Duplicate Complaint Detection ---');
  console.log('================================================================');

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set. Skipping live DB integration test.');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Spin up an ephemeral HTTP server for this test suite
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/issues`;
  console.log(`Test server running on ephemeral port ${port}.`);

  // Find or create test citizen
  let citizen = await User.findOne({ role: 'citizen' });
  if (!citizen) {
    citizen = await User.create({
      fullName: 'Test Citizen DupAI',
      email: `testcitizen_dup_${Date.now()}@gramconnect.local`,
      password: 'Password@123',
      role: 'citizen',
      district: 'Ernakulam',
      panchayat: 'Aluva',
      isVerified: true,
      status: 'Active'
    });
  }

  // Find active Panchayat from database
  let panchayat = await Panchayat.findOne({ isDeleted: { $ne: true } });
  if (!panchayat) {
    panchayat = await Panchayat.create({
      name: 'Aluva Municipality',
      district: 'Ernakulam',
      status: 'Active',
      panchayatCode: 'ALU-ERN-001'
    });
  }

  const token = jwt.sign(
    { id: citizen._id },
    process.env.JWT_SECRET || 'supersecretjwtkeyforgramconnectauth123!',
    { expiresIn: '1d' }
  );

  const createdComplaintIds = [];

  try {
    // Step 1: Create an existing active baseline complaint A
    console.log('\n[SETUP] Creating initial baseline complaint A...');
    const complaintA = await Complaint.create({
      complaintId: `CMP-${Date.now()}-TESTA`,
      user: citizen._id,
      panchayatId: panchayat._id,
      title: 'Massive pothole on Aluva bypass road',
      description: 'There is a very large dangerous pothole right in front of the Aluva metro station on the main road causing heavy traffic congestion and risk of serious motorcycle accidents.',
      category: 'Road Damage',
      priority: 'High',
      status: 'Pending',
      state: 'Kerala',
      district: panchayat.district,
      taluk: 'Aluva',
      localBodyType: 'Municipality',
      localBody: panchayat.name,
      city: panchayat.name,
      ward: 'Ward 4',
      landmark: 'Near Pillar 145',
      pincode: '683101',
      latitude: 10.1076,
      longitude: 76.3516
    });
    createdComplaintIds.push(complaintA._id);
    console.log('✓ Baseline complaint A created:', complaintA.complaintId);

    // Step 2: Test Preview Duplicate with a semantically similar issue nearby
    console.log('\n[TEST 1] Testing POST /api/issues/check-duplicate (Semantically similar issue nearby)...');
    const duplicateCandidate = {
      title: 'Deep crater on bypass road by metro',
      description: 'Dangerous large pothole on the bypass road next to metro station pillar causing riders to fall and traffic bottleneck.',
      category: 'Road Damage',
      latitude: 10.1080,
      longitude: 76.3520, // ~60 meters away
      district: panchayat.district,
      city: panchayat.name
    };

    const checkRes = await fetch(`${baseUrl}/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(duplicateCandidate)
    });

    assert.strictEqual(checkRes.status, 200, `Expected 200 but got ${checkRes.status}`);
    const checkData = await checkRes.json();
    console.log('  Result:', {
      isDuplicate: checkData.isDuplicate,
      matchLevel: checkData.matchLevel,
      confidence: checkData.confidence,
      matchedComplaintId: checkData.matchedComplaint?.complaintId,
      distanceMeters: checkData.distanceMeters
    });

    assert.strictEqual(checkData.isDuplicate, true, 'Candidate should be flagged as a duplicate');
    assert.strictEqual(checkData.matchLevel, 'definite', 'Match level should be definite');
    assert.ok(checkData.confidence >= 0.70, `Confidence should be >= 0.70, got ${checkData.confidence}`);
    assert.strictEqual(checkData.matchedComplaint._id, complaintA._id.toString(), 'Should match complaint A');
    assert.ok(checkData.distanceMeters < 150, `Distance should be under 150m, got ${checkData.distanceMeters}`);

    // Data Protection Check (Requirement 9):
    assert.strictEqual(checkData.matchedComplaint.user, undefined, 'Must not expose user reference');
    assert.strictEqual(checkData.matchedComplaint.email, undefined, 'Must not expose email');
    assert.strictEqual(checkData.matchedComplaint.password, undefined, 'Must not expose password');
    console.log('✓ Test 1 passed: Similar nearby complaint detected & citizen data protected.');

    // Step 3: Test Preview Duplicate with similar issue but distant location (Requirement 6 - False positive avoidance)
    console.log('\n[TEST 2] Testing POST /api/issues/check-duplicate (Similar complaint in different location)...');
    const distantSimilarCandidate = {
      title: 'Deep crater on highway road',
      description: 'Dangerous large pothole on the road causing riders to fall and traffic bottleneck.',
      category: 'Road Damage',
      latitude: 9.9816,
      longitude: 76.2999, // ~22km away in Kochi
      district: panchayat.district
    };

    const distantRes = await fetch(`${baseUrl}/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(distantSimilarCandidate)
    });

    assert.strictEqual(distantRes.status, 200);
    const distantData = await distantRes.json();
    console.log('  Distant issue check result:', {
      isDuplicate: distantData.isDuplicate,
      matchLevel: distantData.matchLevel,
      confidence: distantData.confidence,
      distanceMeters: distantData.distanceMeters
    });
    assert.strictEqual(distantData.isDuplicate, false, 'Distant issue must NOT be flagged as definite duplicate');
    assert.ok(distantData.confidence < 0.45, `Confidence must be penalized below 0.45, got ${distantData.confidence}`);
    console.log('✓ Test 2 passed: False positive across different locations successfully avoided.');

    // Step 4: Test Preview Duplicate with completely unrelated issue
    console.log('\n[TEST 3] Testing POST /api/issues/check-duplicate (Unrelated streetlight issue)...');
    const unrelatedCandidate = {
      title: 'Street lamp bulb broken in Ward 8',
      description: 'The street light pole fixture is completely dead and nighttime visibility is zero.',
      category: 'Streetlight',
      latitude: 10.1076,
      longitude: 76.3516,
      district: panchayat.district
    };

    const unrelatedRes = await fetch(`${baseUrl}/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(unrelatedCandidate)
    });

    assert.strictEqual(unrelatedRes.status, 200);
    const unrelatedData = await unrelatedRes.json();
    console.log('  Unrelated issue check result:', {
      isDuplicate: unrelatedData.isDuplicate,
      matchLevel: unrelatedData.matchLevel,
      confidence: unrelatedData.confidence
    });
    assert.strictEqual(unrelatedData.isDuplicate, false, 'Unrelated issue should not be flagged as duplicate');
    assert.ok(unrelatedData.confidence < 0.35, 'Confidence should be < 0.35');
    console.log('✓ Test 3 passed: Unrelated issue recognized as distinct.');

    // Step 5: Test Missing GPS coordinates handling (Requirement 8)
    console.log('\n[TEST 4] Testing POST /api/issues/check-duplicate (Missing GPS coordinates)...');
    const missingGpsCandidate = {
      title: 'Massive pothole on bypass road',
      description: 'There is a very large dangerous pothole on the bypass road causing heavy traffic and accident risk.',
      category: 'Road Damage',
      district: panchayat.district
    };

    const missingGpsRes = await fetch(`${baseUrl}/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(missingGpsCandidate)
    });

    assert.strictEqual(missingGpsRes.status, 200);
    const missingGpsData = await missingGpsRes.json();
    console.log('  Missing GPS check result:', {
      isDuplicate: missingGpsData.isDuplicate,
      isPossibleDuplicate: missingGpsData.isPossibleDuplicate,
      matchLevel: missingGpsData.matchLevel,
      confidence: missingGpsData.confidence
    });
    assert.strictEqual(missingGpsData.isDuplicate, false, 'Without GPS, cannot claim definite duplicate');
    assert.strictEqual(missingGpsData.isPossibleDuplicate, true, 'Without GPS, provides possible match warning');
    assert.strictEqual(missingGpsData.matchLevel, 'possible', 'Match level should be possible');
    console.log('✓ Test 4 passed: Missing GPS coordinates handled cautiously as possible-match warning.');

    // Step 6: Test Complaint Submission via POST /api/issues (Allow citizen submission even with duplicate flag)
    console.log('\n[TEST 5] Submitting complaint with duplicate flag (Citizen decides to proceed)...');
    const submitRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: duplicateCandidate.title,
        description: duplicateCandidate.description,
        category: duplicateCandidate.category,
        priority: 'Medium',
        state: 'Kerala',
        district: panchayat.district,
        taluk: 'Aluva',
        localBodyType: 'Municipality',
        localBody: panchayat.name,
        city: panchayat.name,
        ward: 'Ward 4',
        landmark: 'Pillar 146',
        pincode: '683101',
        latitude: duplicateCandidate.latitude,
        longitude: duplicateCandidate.longitude,
        panchayatId: panchayat._id.toString()
      })
    });

    const submitData = await submitRes.json();
    assert.strictEqual(submitRes.status, 201, `Expected 201 Created but got ${submitRes.status}: ${submitData.message}`);
    const createdComplaint = submitData.complaint;
    createdComplaintIds.push(createdComplaint._id);

    console.log('  Created complaint duplicate metadata:', {
      id: createdComplaint._id,
      isDuplicate: createdComplaint.isDuplicate,
      duplicateOf: createdComplaint.duplicateOf,
      duplicateConfidence: createdComplaint.duplicateConfidence
    });

    assert.strictEqual(createdComplaint.isDuplicate, true, 'Complaint should have isDuplicate = true');
    assert.strictEqual(createdComplaint.duplicateOf.toString(), complaintA._id.toString(), 'duplicateOf should match complaint A ID');
    assert.ok(createdComplaint.duplicateConfidence >= 0.70, 'duplicateConfidence should be >= 0.70');
    console.log('✓ Test 5 passed: Citizen complaint saved and duplicate reference recorded.');

    // Step 7: Test Fetch Complaint Details to verify population
    console.log('\n[TEST 6] Fetching complaint details to verify duplicateOf population...');
    const getRes = await fetch(`${baseUrl}/${createdComplaint._id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    assert.strictEqual(getRes.status, 200);
    const getData = await getRes.json();
    const fetched = getData.complaint;
    assert.ok(fetched.duplicateOf, 'duplicateOf should be populated');
    assert.strictEqual(fetched.duplicateOf._id.toString(), complaintA._id.toString());
    console.log('  Populated duplicateOf title:', fetched.duplicateOf.title);
    console.log('✓ Test 6 passed: Complaint populated with linked duplicate metadata.');

    console.log('\n================================================================');
    console.log('All Duplicate Detection Integration Tests Passed Successfully!');
    console.log('================================================================');
  } finally {
    // Cleanup created test records
    if (createdComplaintIds.length > 0) {
      console.log(`\n[CLEANUP] Deleting ${createdComplaintIds.length} test complaints...`);
      await Complaint.deleteMany({ _id: { $in: createdComplaintIds } });
      console.log('Cleanup complete.');
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

testDuplicateIntegration().catch(err => {
  console.error('Integration Test Failed:', err);
  process.exit(1);
});
