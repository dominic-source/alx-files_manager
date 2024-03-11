import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(req, res) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();
    res.status(200).json({ redis: redisAlive, db: dbAlive });
  }

  static async getStats(req, res) {
    const userStats = await dbClient.nbUsers();
    const fileStats = await dbClient.nbFiles();
    res.status(200).json({ users: Number(userStats), files: Number(fileStats) });
  }
}

module.exports = AppController;
