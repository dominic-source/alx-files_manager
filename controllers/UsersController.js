import sha1 from 'sha1';
import dbClient from '../utils/db';

async function postNew(req, res) {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Missing email' });
  }
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'Missing password' });
  }
  const collection = dbClient.db.collection('users');
  collection.findOne({ email })
    .then((user) => {
      if (user) {
        res.status(400).json({ error: 'Already exist' });
      }
    })
    .catch((err) => {
      console.log(err);
    });
  const hashPassword = sha1(password);
  const result = await collection.insertOne({ email, password: hashPassword });
  res.status(201).json({ email, id: result.insertedId });
}

module.exports = { postNew };
