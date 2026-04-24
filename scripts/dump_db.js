// Script to dump all users and files for debugging jail/test issues
import pkg from 'mongodb';

const { MongoClient } = pkg;
const url = 'mongodb://localhost:27017';
const dbName = process.env.DB_DATABASE || 'files_manager';

async function dumpDb() {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const users = await db.collection('users').find({}).toArray();
  const files = await db.collection('files').find({}).toArray();
  console.log('--- USERS ---');
  users.forEach((u) => console.log(u));
  console.log('--- FILES ---');
  files.forEach((f) => console.log(f));
  await client.close();
}

dumpDb();
