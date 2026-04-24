import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    this.isConnected = false;
    this.client.on('connect', () => {
      this.isConnected = true;
    });
    this.client.on('end', () => {
      this.isConnected = false;
    });
    this.client.connect();
  }

  isAlive() {
    return this.isConnected;
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (err) {
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, { EX: duration });
    } catch (err) {
      // Optionally log error
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      // Optionally log error
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
