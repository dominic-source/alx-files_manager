import dbClient from '../utils/db.js';
import redisClient from  '../utils/redis.js';

function getStatus(req, res) {
  const redisAlive = redisClient.isAlive();
  const dbAlive = dbClient.isAlive();
  res.status(200).json({ "redis": redisAlive, "db": dbAlive });
  return;
}

async function getStats(req, res) {
  const userStats = await dbClient.nbUsers();
  const fileStats = await dbClient.nbFiles();
  res.status(200).json({ "users": Number(userStats), "files": Number(fileStats) });
  return;
}
module.exports = {getStatus, getStats};
