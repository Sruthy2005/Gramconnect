const assert = require('assert');
const { classifyLocally, classifyComplaint, CATEGORIES } = require('../utils/aiCategorizer');

async function runTests() {
  console.log('--- Testing AI Complaint Categorizer ---');

  const testCases = [
    {
      title: 'Large potholes on highway',
      desc: 'The main road near junction 3 is full of deep potholes and craters causing motorcycle accidents.',
      expected: CATEGORIES.ROAD_DAMAGE
    },
    {
      title: 'Broken asphalt and cave-in',
      desc: 'The tar road has cracked and caved in near the school gate. Footpath is broken as well.',
      expected: CATEGORIES.ROAD_DAMAGE
    },
    {
      title: 'Overflowing garbage bin and trash dumping',
      desc: 'People are dumping plastic waste and food trash on the street. The dustbin is overflowing with foul smell.',
      expected: CATEGORIES.GARBAGE_WASTE
    },
    {
      title: 'Rotting waste not collected',
      desc: 'Solid waste and rubbish piles have accumulated on the corner for 10 days attracting flies and pests.',
      expected: CATEGORIES.GARBAGE_WASTE
    },
    {
      title: 'Clogged drainage and sewage overflow',
      desc: 'The street gutter is blocked with silt and filthy sewage water is overflowing onto pedestrian walk.',
      expected: CATEGORIES.DRAINAGE
    },
    {
      title: 'Open manhole on street',
      desc: 'The stormwater drain manhole cover is missing and dirty drain water is stagnant causing severe waterlogging.',
      expected: CATEGORIES.DRAINAGE
    },
    {
      title: 'Drinking water pipeline burst',
      desc: 'A municipal water supply pipe has cracked underground and clean drinking water is leaking profusely onto the lane.',
      expected: CATEGORIES.WATER_LEAKAGE
    },
    {
      title: 'Public tap leaking water',
      desc: 'The valve on the water distribution tank is broken and drinking water is gushing out continuously.',
      expected: CATEGORIES.WATER_LEAKAGE
    },
    {
      title: 'Flickering street light at night',
      desc: 'The lamp post bulb at the street corner is broken and flickering. The whole road is pitch dark after 7 PM.',
      expected: CATEGORIES.STREETLIGHT
    },
    {
      title: 'Damaged streetlight pole',
      desc: 'The LED street light on pole #45 has been completely off for three weeks making night travel unsafe.',
      expected: CATEGORIES.STREETLIGHT
    },
    {
      title: 'Fallen tree branch on playground',
      desc: 'A heavy banyan tree limb fell on the children play swing area during rain.',
      expected: CATEGORIES.OTHER
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = await classifyComplaint(tc.title, tc.desc);
    console.log(`[TEST] "${tc.title}" -> ${res.category} (conf: ${(res.confidence * 100).toFixed(0)}%, matches: ${res.matchedKeywords.join(', ')})`);
    assert.strictEqual(res.category, tc.expected, `Expected ${tc.expected} but got ${res.category} for "${tc.title}"`);
    passed++;
  }

  console.log(`\nAll ${passed}/${testCases.length} tests passed successfully!`);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
