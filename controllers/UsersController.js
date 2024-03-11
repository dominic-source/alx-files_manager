import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const collection = dbClient.db.collection('users');
    const hashPassword = sha1(password);
    let data;
    try {
      data = await collection.findOne({ email });
      if (data) return res.status(400).json({ error: 'Already exist' });
      const result = await collection.insertOne({ email, password: hashPassword });
      return res.status(201).json({ email, id: result.insertedId });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  static async getMe(req, res) {
    const token = req.get('X-Token');
    const key = `auth_${token}`;
    try {
      const data = await redisClient.get(key);
      if (!data) return res.status(401).json({ error: 'Unauthorized' });
      const collection = dbClient.db.collection('users');
      const user = await collection.findOne({ _id: ObjectId(data) });
      if (user) return res.status(200).json({ email: user.email, id: user._id.toString() });
      return res.status(200).json({ error: 'No user found' });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
}
module.exports = UsersController;
