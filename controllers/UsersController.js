import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';

async function postNew(req, res) {
  const email = req.body.email;
  if (!email) {
    res.status(400).json({ 'error': 'Missing email' });
    return;
  }
  const password = req.body.password;
  if (!password) {
    res.status(400).json({ 'error': 'Missing password' });
    return;
  }

  dbClient.db.collection('users').findOne({email: email})
    .then((user) => {
      if (user) {
        res.status(400).json({ 'error': 'Already exist' });
        return;
      }
    })
    .catch((err) => {
      console.log(err);
    });
    const hashPassword = sha1(password);
    const result = await dbClient.db.collection('users').insertOne({ email: email, password: hashPassword });
    res.status(201).json({ email: email, id: result.insertedId });
}