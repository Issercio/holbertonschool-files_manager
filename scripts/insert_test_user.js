// Script to insert test user for API tests
import pkg from 'mongodb';
const { MongoClient } = pkg;
import sha1 from 'sha1';

const url = 'mongodb://localhost:27017';
const dbName = process.env.DB_DATABASE || 'files_manager';

async function insertUser() {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  // Remove if already exists
  await users.deleteMany({ email: 'bob@dylan.com' });
  // Insert test user
  await users.insertOne({
    email: 'bob@dylan.com',
    password: sha1('toto1234!'),
  });
  await client.close();
  console.log('Test user inserted.');
}

insertUser();
