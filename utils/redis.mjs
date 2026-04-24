
import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  get(key) {
    return new Promise((resolve) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          resolve(null);
        } else {
          resolve(reply);
        }
      });
    });
  }

  set(key, value, duration) {
    return new Promise((resolve) => {
      this.client.set(key, value, 'EX', duration, (err, reply) => {
        if (err) {
          resolve(null);
        } else {
          resolve(reply);
        }
      });
    });
  }

  del(key) {
    return new Promise((resolve) => {
      this.client.del(key, (err, reply) => {
        if (err) {
          resolve(null);
        } else {
          resolve(reply);
        }
      });
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;
