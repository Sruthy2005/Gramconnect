const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function processLocations() {
  console.log('=== STARTING KERALA ADMINISTRATIVE HIERARCHY COMPILATION ===');
  
  const inFilePath = path.join(__dirname, 'node_modules', 'postalcodes-india', 'data', 'IN.txt');
  const outFilePath = path.join(__dirname, 'data', 'keralaLocations.js');
  
  if (!fs.existsSync(inFilePath)) {
    console.error(`Error: Raw data file not found at ${inFilePath}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(inFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const rawRecords = [];

  const districtSpellingMap = {
    'kasargod': 'Kasaragod',
    'kasaragod': 'Kasaragod',
    'ernakulam': 'Ernakulam',
    'alappuzha': 'Alappuzha',
    'kottayam': 'Kottayam',
    'thiruvananthapuram': 'Thiruvananthapuram',
    'thrissur': 'Thrissur',
    'trichur': 'Thrissur',
    'quilon': 'Kollam',
    'kollam': 'Kollam',
    'calicut': 'Kozhikode',
    'kozhikode': 'Kozhikode',
    'cannanore': 'Kannur',
    'kannur': 'Kannur',
    'palghat': 'Palakkad',
    'palakkad': 'Palakkad',
    'malappuram': 'Malappuram',
    'wayanad': 'Wayanad',
    'idukki': 'Idukki',
    'pathanamthitta': 'Pathanamthitta'
  };

  const spellingCorrections = {
    'Changanacherry': 'Changanassery',
    'Kanjirapally': 'Kanjirappally',
    'Ozhavur Panchayat': 'Uzhavoor Panchayat',
    'Ozhavur East Panchayat': 'Uzhavoor East Panchayat',
    'Angamally Panchayat': 'Angamaly Panchayat',
    'Angamally South Panchayat': 'Angamaly South Panchayat',
    'Aryad North Panchayat': 'Aryad Panchayat',
    'Varkala South Panchayat': 'Varkala South Panchayat'
  };

  function capitalize(str) {
    if (!str) return '';
    return str.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  for await (const line of rl) {
    const parts = line.split('\t');
    if (parts.length < 8) continue;

    const state = parts[3].trim();
    if (state !== 'Kerala') continue;

    const pinCode = parts[1].trim();
    const placeRaw = parts[2].trim();
    const districtRaw = parts[5].trim();
    let subDistrictRaw = parts[7].trim();

    const distKey = districtRaw.toLowerCase();
    const district = districtSpellingMap[distKey] || capitalize(districtRaw);

    if (!subDistrictRaw) {
      subDistrictRaw = district;
    }
    let subDistrict = capitalize(subDistrictRaw);
    if (spellingCorrections[subDistrict]) {
      subDistrict = spellingCorrections[subDistrict];
    }

    let cleanPlace = placeRaw
      .replace(/\s+[HSO]\.O\.?$/i, '')
      .replace(/\s+SO$/i, '')
      .replace(/\s+BO$/i, '')
      .trim();
    
    cleanPlace = capitalize(cleanPlace);
    if (!cleanPlace.endsWith('Panchayat') && !cleanPlace.endsWith('Municipality') && !cleanPlace.endsWith('Corporation')) {
      cleanPlace = cleanPlace + ' Panchayat';
    }

    if (spellingCorrections[cleanPlace]) {
      cleanPlace = spellingCorrections[cleanPlace];
    }

    rawRecords.push({
      district,
      subDistrict,
      place: cleanPlace,
      pinCode
    });
  }

  const districtsMap = new Map(); // districtName -> Set of subDistricts
  const panchayatsMap = new Map(); // subDistrictName -> Map of placeName -> Set of pinCodes

  // Process standard records
  for (const rec of rawRecords) {
    // Add sub-district to district
    if (!districtsMap.has(rec.district)) {
      districtsMap.set(rec.district, new Set());
    }
    districtsMap.get(rec.district).add(rec.subDistrict);

    // Add place to sub-district
    if (!panchayatsMap.has(rec.subDistrict)) {
      panchayatsMap.set(rec.subDistrict, new Map());
    }
    const subDistPlaces = panchayatsMap.get(rec.subDistrict);
    if (!subDistPlaces.has(rec.place)) {
      subDistPlaces.set(rec.place, new Set());
    }
    subDistPlaces.get(rec.place).add(rec.pinCode);
  }

  // Inject Custom / Alias Blocks
  const customBlockDef = [
    {
      district: 'Kottayam',
      block: 'Uzhavoor',
      keywords: ['Uzhavoor', 'Ozhavur', 'Veliyannoor', 'Kurichithanam', 'Monippally', 'Marangattupilly', 'Ramapuram', 'Kidangoor', 'Kanakkary']
    },
    {
      district: 'Kottayam',
      block: 'Changanassery',
      keywords: ['Changanacherry', 'Changanasery', 'Changanassery', 'Chingavanam', 'Kangazha', 'Kurichy', 'Madappally', 'Paippad', 'Thrikkodithanam', 'Vazhappally']
    },
    {
      district: 'Kottayam',
      block: 'Kanjirappally',
      keywords: ['Kanjirapally', 'Kanjirappally', 'Ponkunnam', 'Chirakadavu', 'Erumely', 'Manimala', 'Mundakayam', 'Koratty', 'Koovappally']
    },
    {
      district: 'Ernakulam',
      block: 'Angamaly',
      keywords: ['Angamaly', 'Angamally', 'Karukutty', 'Mookkannoor', 'Manjapra', 'Malayattoor', 'Kalady', 'Kanjoor', 'Sreemoolanagaram']
    },
    {
      district: 'Alappuzha',
      block: 'Aryad',
      keywords: ['Aryad', 'Mannancherry', 'Mararikulam', 'Muhamma', 'Pathirappally']
    },
    {
      district: 'Thiruvananthapuram',
      block: 'Varkala',
      keywords: ['Varkala', 'Edava', 'Elakamon', 'Chemmaruthy', 'Ottoor', 'Ayroor', 'Madavoor']
    }
  ];

  for (const def of customBlockDef) {
    if (!districtsMap.has(def.district)) {
      districtsMap.set(def.district, new Set());
    }
    districtsMap.get(def.district).add(def.block);

    if (!panchayatsMap.has(def.block)) {
      panchayatsMap.set(def.block, new Map());
    }
    const blockPlaces = panchayatsMap.get(def.block);

    for (const rec of rawRecords) {
      if (rec.district !== def.district) continue;
      const matchesKeyword = def.keywords.some(kw => rec.place.toLowerCase().includes(kw.toLowerCase()));
      if (matchesKeyword) {
        if (!blockPlaces.has(rec.place)) {
          blockPlaces.set(rec.place, new Set());
        }
        blockPlaces.get(rec.place).add(rec.pinCode);
      }
    }
  }

  // Build final structured JSON object
  const districtsJSON = {};
  const panchayatsJSON = {};

  const sortedDistricts = Array.from(districtsMap.keys()).sort();
  for (const dist of sortedDistricts) {
    districtsJSON[dist] = Array.from(districtsMap.get(dist)).sort();
  }

  const sortedSubDistricts = Array.from(panchayatsMap.keys()).sort();
  for (const subDist of sortedSubDistricts) {
    const placesMap = panchayatsMap.get(subDist);
    const sortedPlaces = Array.from(placesMap.keys()).sort();
    
    panchayatsJSON[subDist] = sortedPlaces.map(place => {
      const pinCodes = Array.from(placesMap.get(place)).sort();
      return {
        name: place,
        pinCodes: pinCodes
      };
    });
  }

  const outputObject = {
    state: 'Kerala',
    districts: districtsJSON,
    panchayats: panchayatsJSON
  };

  const fileContent = `// Auto-compiled Kerala locations database
// Generated dynamically from GeoNames database in postalcodes-india
const keralaLocations = ${JSON.stringify(outputObject, null, 2)};

module.exports = keralaLocations;
`;

  fs.writeFileSync(outFilePath, fileContent, 'utf-8');
  console.log(`\nSuccessfully compiled and wrote ${outFilePath}`);
  console.log(`Total Districts compiled: ${sortedDistricts.length}`);
  console.log(`Total Blocks/Sub-districts compiled: ${sortedSubDistricts.length}`);
}

processLocations().catch(err => {
  console.error('Error compiling hierarchy:', err);
  process.exit(1);
});
