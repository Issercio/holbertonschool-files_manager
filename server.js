import express from 'express';
import routes from './routes/index.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/', routes);


import dbClient from './utils/db.mjs';

const waitForDb = async () => {
  while (!dbClient.isAlive()) {
    // eslint-disable-next-line no-console
    console.log('Waiting for MongoDB connection...');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

waitForDb().then(() => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
  });
});
