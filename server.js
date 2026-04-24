import express from 'express';
import routes from './routes/index';
import dbClient from './utils/db';

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use('/', routes);


const waitForDb = async () => {
  // eslint-disable-next-line no-console
  while (!dbClient.isAlive()) {
    console.log('Waiting for MongoDB connection...');
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

waitForDb().then(() => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
  });
});
