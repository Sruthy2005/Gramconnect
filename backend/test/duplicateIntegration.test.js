const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const assert = require('assert');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Panchayat = require('../models/Panchayat');

async function testDuplicateIntegration() {
  console.log('--- Starting Integration Test for AI Duplicate Complaint Detection ---');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

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

  const baseUrl = 'http://localhost:5000/api/issues';
  const createdComplaintIds = [];

  try {
    // Step 1: Create an existing active complaint A
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
    console.log('Baseline complaint A created with ID:', complaintA._id, 'complaintId:', complaintA.complaintId);

    // Step 2: Test Preview Duplicate Endpoint with a semantically similar issue nearby
    console.log('\n[TEST 1] Testing POST /api/issues/check-duplicate with similar nearby complaint...');
    const duplicateCandidate = {
      title: 'Deep crater on bypass road by metro',
      description: 'Dangerous large pothole on the bypass road next to metro station pillar causing riders to fall and traffic bottleneck.',
      category: 'Road Damage',
      latitude: 10.1080,
      longitude: 76.3520, // ~60 meters away
      district: panchayat.district
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
    console.log('Duplicate check result:', {
      isDuplicate: checkData.isDuplicate,
      confidence: checkData.confidence,
      matchedId: checkData.matchedComplaint?._id,
      matchedComplaintId: checkData.matchedComplaint?.complaintId,
      distanceMeters: checkData.distanceMeters,
      factors: checkData.factors
    });

    assert.strictEqual(checkData.isDuplicate, true, 'Candidate should be flagged as a duplicate');
    assert.ok(checkData.confidence >= 0.70, `Confidence should be >= 0.70, got ${checkData.confidence}`);
    assert.strictEqual(checkData.matchedComplaint._id, complaintA._id.toString(), 'Should match complaint A');
    assert.ok(checkData.distanceMeters < 150, `Distance should be under 150m, got ${checkData.distanceMeters}`);

    // Step 3: Test Preview Duplicate Endpoint with a completely different issue
    console.log('\n[TEST 2] Testing POST /api/issues/check-duplicate with distinct complaint...');
    const distinctCandidate = {
      title: 'Street lamp bulb broken in Ward 8',
      description: 'The street light pole fixture is completely dead and nighttime visibility is zero.',
      category: 'Streetlight',
      latitude: 9.9816,
      longitude: 76.2999, // ~20km away in Kochi
      district: panchayat.district
    };

    const distinctRes = await fetch(`${baseUrl}/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(distinctCandidate)
    });

    assert.strictEqual(distinctRes.status, 200);
    const distinctData = await distinctRes.json();
    console.log('Distinct issue check result:', {
      isDuplicate: distinctData.isDuplicate,
      confidence: distinctData.confidence
    });
    assert.strictEqual(distinctData.isDuplicate, false, 'Distinct issue should NOT be flagged as duplicate');
    assert.ok(distinctData.confidence < 0.60, 'Confidence should be well below 0.60');

    // Step 4: Test end-to-end complaint submission via POST /api/issues
    console.log('\n[TEST 3] Submitting duplicate complaint to POST /api/issues...');
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
    if (submitRes.status !== 201) {
      console.error('Submit complaint failed with status:', submitRes.status, 'body:', submitData);
    }
    assert.strictEqual(submitRes.status, 201, `Expected 201 Created but got ${submitRes.status}: ${submitData.message}`);
    const createdComplaint = submitData.complaint;
    createdComplaintIds.push(createdComplaint._id);

    console.log('Created complaint duplicate metadata:', {
      id: createdComplaint._id,
      isDuplicate: createdComplaint.isDuplicate,
      duplicateOf: createdComplaint.duplicateOf,
      duplicateConfidence: createdComplaint.duplicateConfidence
    });

    assert.strictEqual(createdComplaint.isDuplicate, true, 'Complaint should have isDuplicate = true');
    assert.strictEqual(createdComplaint.duplicateOf.toString(), complaintA._id.toString(), 'duplicateOf should match complaint A ID');
    assert.ok(createdComplaint.duplicateConfidence >= 0.70, 'duplicateConfidence should be >= 0.70');

    // Step 5: Test fetch complaint by ID and my complaints to verify population
    console.log('\n[TEST 4] Fetching complaint details to verify duplicateOf population...');
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
    console.log('Populated duplicateOf title:', fetched.duplicateOf.title);

    console.log('\nAll Duplicate Detection Integration Tests Passed Successfully!');
  } finally {
    // Cleanup created test records
    if (createdComplaintIds.length > 0) {
      console.log(`\n[CLEANUP] Deleting ${createdComplaintIds.length} test complaints...`);
      await Complaint.deleteMany({ _id: { $in: createdComplaintIds } });
      console.log('Cleanup complete.');
    }
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

testDuplicateIntegration().catch(err => {
  console.error('Integration Test Failed:', err);
  process.exit(1);
});
