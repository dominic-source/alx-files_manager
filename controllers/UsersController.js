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
  const result = await collection.insertOne({ email, password: hashPassword });
  collection.findOne({ email })
    .then((user) => {
      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }
      return res.status(201).json({ email, id: result.insertedId });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: 'Internal server error' });
    });
  return res.status(201).json({ email, id: result.insertedId });
}

module.exports = { postNew };
