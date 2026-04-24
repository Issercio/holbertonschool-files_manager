// Script to initialize all test data for GET /files endpoints
import pkg from 'mongodb';
import sha1 from 'sha1';

const { MongoClient, ObjectId } = pkg;
const url = 'mongodb://localhost:27017';
const dbName = process.env.DB_DATABASE || 'files_manager';

async function initTestData() {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  const files = db.collection('files');

  // Remove and insert test user
  await users.deleteMany({ email: 'bob@dylan.com' });
  const userResult = await users.insertOne({
    email: 'bob@dylan.com',
    password: sha1('toto1234!'),
  });
  const userId = userResult.insertedId;

  // Remove and insert test file
  await files.deleteMany({ _id: new ObjectId('5f1e8896c7ba06511e683b25') });
  await files.insertOne({
    _id: new ObjectId('5f1e8896c7ba06511e683b25'),
    userId: userId,
    name: 'testfile.txt',
    type: 'file',
    isPublic: false,
    parentId: '0',
  });

  await client.close();
  console.log('Test data initialized.');
}

initTestData();
