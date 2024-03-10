import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.state = false;
    this.client = createClient()
      .on('error', (errmessage) => {
        console.log(errmessage);
      })
      .on('ready', () => {
        console.log('redis server is connected!');
        this.state = true;
      });
  }

  isAlive() {
    if (this.client.connected) return true;
    return false;
  }

  async get(key) {
    const asyncGet = promisify(this.client.get).bind(this.client);
    const data = await asyncGet(key);
    return data;
  }

  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
