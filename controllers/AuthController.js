import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authorization = req.get('Authorization').split(' ')[1];
    const [email, password] = Buffer.from(authorization, 'base64').toString('utf-8').split(':');
    const hashPassword = sha1(password);
    const collection = await dbClient.db.collection('users');
    try {
      const coll = await collection.findOne({ email, password: hashPassword });
      if (!coll) return res.status(401).json({ error: 'Unauthorized' });

      const token = uuidv4();
      const key = `auth_${token}`;
      redisClient.set(key, coll._id.toString(), 86400);
      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.get('X-Token');
    const key = `auth_${token}`;
    try {
      const data = await redisClient.get(key);
      if (!data) return res.status(401).json({ error: 'Unauthorized' });
      redisClient.del(key);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
}

module.exports = AuthController;
