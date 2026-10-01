const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const assert = require('assert');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Panchayat = require('../models/Panchayat');

async function testIntegration() {
  console.log('--- Starting Integration Test for Automatic Complaint Categorization ---');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Find or create test citizen
  let citizen = await User.findOne({ role: 'citizen' });
  if (!citizen) {
    citizen = await User.create({
      fullName: 'Test Citizen AI',
      email: `testcitizen_${Date.now()}@gramconnect.local`,
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
      name: 'Kottayam Municipality',
      district: 'Kottayam',
      status: 'Active',
      panchayatCode: 'KOT-KOT-001'
    });
  }

  const token = jwt.sign(
    { id: citizen._id },
    process.env.JWT_SECRET || 'supersecretjwtkeyforgramconnectauth123!',
    { expiresIn: '1d' }
  );

  const baseUrl = 'http://localhost:5000/api/issues';

  // Test 1: POST /api/issues/classify
  console.log('\n[TEST 1] Testing /api/issues/classify endpoint...');
  const classifyRes = await fetch(`${baseUrl}/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Deep craters on the bypass highway',
      description: 'The tarred road has multiple deep craters and broken asphalt causing accidents.'
    })
  });

  assert.strictEqual(classifyRes.status, 200, `Expected 200 from /classify but got ${classifyRes.status}`);
  const classifyData = await classifyRes.json();
  console.log('Classify response:', classifyData);
  assert.strictEqual(classifyData.category, 'Road Damage');
  assert.ok(classifyData.confidence >= 0.75);

  // Test 2: POST /api/issues automatic classification during complaint submission
  console.log('\n[TEST 2] Testing automatic classification on complaint creation...');

  const complaintsToTest = [
    {
      title: 'Water Pipe Bursting on Road',
      description: 'The municipal drinking water supply pipe has cracked and fresh clean water is leaking and gushing across the entire street for hours.',
      expectedCategory: 'Water Leakage',
      expectedDept: 'Water Authority'
    },
    {
      title: 'Sewage overflowing from blocked gutter',
      description: 'The stormwater drainage system is completely choked with silt and foul black sewage water is overflowing onto the road.',
      expectedCategory: 'Drainage',
      expectedDept: 'Sewage & Drainage Board'
    },
    {
      title: 'Garbage dump accumulating near temple',
      description: 'Piles of domestic plastic waste and uncollected rotten rubbish are dumped at the road corner creating an unbearable foul stench.',
      expectedCategory: 'Garbage/Waste',
      expectedDept: 'Sanitation Department'
    },
    {
      title: 'Pitch dark junction light pole off',
      description: 'The streetlight fixture and lamp post bulb have been broken for two weeks leaving the roadway completely dark at night.',
      expectedCategory: 'Streetlight',
      expectedDept: 'Electricity Board'
    }
  ];

  const createdIds = [];

  for (const item of complaintsToTest) {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: item.title,
        description: item.description,
        category: 'Auto-detect', // Tests auto-detect via AI
        state: 'Kerala',
        district: panchayat.district,
        taluk: 'Aluva',
        localBody: panchayat.name,
        localBodyType: 'Municipality',
        city: 'Kochi',
        pincode: '682001',
        latitude: 9.9816,
        longitude: 76.2999,
        priority: 'Normal'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201, `Failed to submit complaint: ${data.message}`);
    assert.ok(data.complaint, 'Response missing complaint object');
    assert.strictEqual(data.aiCategory, item.expectedCategory, `Expected AI category ${item.expectedCategory}, got ${data.aiCategory}`);
    assert.strictEqual(data.complaint.category, item.expectedCategory, `Expected final category ${item.expectedCategory}, got ${data.complaint.category}`);
    assert.strictEqual(data.complaint.assignedDepartment, item.expectedDept, `Expected dept ${item.expectedDept}, got ${data.complaint.assignedDepartment}`);

    console.log(`[PASS] "${item.title}" -> AI Category: ${data.aiCategory} (Dept: ${data.complaint.assignedDepartment})`);
    createdIds.push(data.complaint._id);
  }

  // Test 3: Citizen retrieves complaints via GET /api/issues/my
  console.log('\n[TEST 3] Verifying citizen retrieval of aiCategory...');
  const myRes = await fetch(`${baseUrl}/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(myRes.status, 200);
  const myData = await myRes.json();
  assert.ok(myData.complaints.length > 0);
  const sample = myData.complaints.find(c => createdIds.includes(c._id));
  assert.ok(sample, 'Created complaint not found in my list');
  assert.ok(sample.aiCategory, 'Sample complaint missing aiCategory in response');
  console.log(`[PASS] Citizen view confirmed: Complaint ${sample.complaintId} has aiCategory: "${sample.aiCategory}"`);

  // Clean up created test complaints
  await Complaint.deleteMany({ _id: { $in: createdIds } });
  console.log(`Cleaned up ${createdIds.length} test complaints.`);

  await mongoose.disconnect();
  console.log('\n--- All Integration Tests Passed Successfully! ---');
}

testIntegration().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
