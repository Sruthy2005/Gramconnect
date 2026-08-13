const mongoose = require('mongoose');

async function dropIndex() {
  const mongoURI = 'mongodb://localhost:27017/gramconnect'; // default database name
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.');

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Get index info
    const panchayatsColl = mongoose.connection.db.collection('panchayats');
    const indexes = await panchayatsColl.indexes();
    console.log('Current indexes on panchayats:', indexes);

    // Drop index if exists
    const hasCodeIndex = indexes.some(idx => idx.name === 'panchayatCode_1');
    if (hasCodeIndex) {
      console.log('Dropping unique index: panchayatCode_1...');
      await panchayatsColl.dropIndex('panchayatCode_1');
      console.log('Index dropped successfully.');
    } else {
      console.log('No panchayatCode_1 index found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

dropIndex();
