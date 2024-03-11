import sha1 from 'sha1';
import dbClient from '../utils/db';

async function postNew(req, res) {
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
  } catch (error){
    return res.status(500).json({ error });
  }
}

module.exports = { postNew };
