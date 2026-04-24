// Script to insert a test file for GET /files/:id endpoint
import pkg from 'mongodb';

const { MongoClient, ObjectId } = pkg;
const url = 'mongodb://localhost:27017';
const dbName = process.env.DB_DATABASE || 'files_manager';

async function insertFile() {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  const files = db.collection('files');
  // Find the test user
  const user = await users.findOne({ email: 'bob@dylan.com' });
  if (!user) {
    console.error('Test user not found.');
    process.exit(1);
  }
  // Remove if already exists
  await files.deleteMany({ _id: new ObjectId('5f1e8896c7ba06511e683b25') });
  // Insert test file
  await files.insertOne({
    _id: new ObjectId('5f1e8896c7ba06511e683b25'),
    userId: user._id,
    name: 'testfile.txt',
    type: 'file',
    isPublic: false,
    parentId: '0',
  });
  await client.close();
  console.log('Test file inserted.');
}

insertFile();
