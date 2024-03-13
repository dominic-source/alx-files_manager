import { ObjectId } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.get('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    let obj = {};
    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const collection = dbClient.db.collection('users');
      const resultUser = await collection.findOne({ _id: new ObjectId(userId) });
      if (!resultUser) return res.status(401).json({ error: 'Unauthorized' });
      // Get data
      const {
        name, type, isPublic = false, data,
      } = req.body;
      let {
        parentId = 0,
      } = req.body;
      const listType = ['folder', 'file', 'image'];
      if (!name) return res.status(400).json({ error: 'Missing name' });
      if (!type) return res.status(400).json({ error: 'Missing type' });
      if (!listType.includes(type)) return res.status(400).json({ error: 'Missing type' });
      if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });
      const fileCollection = dbClient.db.collection('files');
      if (parentId !== 0) {
        parentId = new ObjectId(parentId);
        const result = await fileCollection.findOne(
          { _id: parentId, userId: new ObjectId(userId) },
        );
        if (!result) return res.status(400).json({ error: 'Parent not found' });
        if (result.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
      }
      obj = {
        userId: new ObjectId(userId), name, type, isPublic, parentId,
      };
      if (type === 'folder') {
        // Add the folder to database
        const result = await fileCollection.insertOne(obj);
        if (result) {
          const ret = result.ops[0];
          ret.id = ret._id.toString();
          delete ret._id;
          if ('localPath' in ret) delete ret.localPath;
          return res.status(201).json(ret);
        }
        return res.status(401).json({ error: 'Unauthorized' });
      }
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
      const binaryData = Buffer.from(data, 'base64');
      const localPath = path.join(FOLDER_PATH, uuidv4());
      fs.writeFileSync(localPath, binaryData);
      obj.localPath = localPath;
      const result = await fileCollection.insertOne(obj);
      if (result) {
        const fileDoc = result.ops[0];
        if ('localPath' in fileDoc) delete fileDoc.localPath;
        fileDoc.id = fileDoc._id.toString();
        delete fileDoc._id;
        return res.status(201).json(fileDoc);
      }
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(201).json(obj);
  }

  static async getShow(req, res) {
    let fileResult = {};
    try {
      const _id = req.params.id;
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const token = req.get('X-Token');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const collection = dbClient.db.collection('users');
      const result = await collection.findOne({ _id: new ObjectId(userId) });
      if (!result) return res.status(401).json({ error: 'Unauthorized' });
      const fileCollection = dbClient.db.collection('files');
      fileResult = await fileCollection.findOne(
        { _id: new ObjectId(_id), userId: new ObjectId(userId) },
      );
      if (!fileResult) return res.status(404).json({ error: 'Not found' });
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    fileResult.id = fileResult._id.toString();
    fileResult.userId = fileResult.userId.toString();
    delete fileResult._id;
    if ('localPath' in fileResult) delete fileResult.localPath;
    return res.json(fileResult);
  }

  static async getIndex(req, res) {
    let resultFileCollection = [];
    try {
      const token = req.get('X-Token');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const collection = dbClient.db.collection('users');
      const result = await collection.findOne({ _id: new ObjectId(userId) });
      if (!result) return res.status(401).json({ error: 'Unauthorized' });
      const fileCollection = dbClient.db.collection('files');
      const { parentId = '0', page = 0 } = req.query;
      const startIndex = page * 20;
      const pipeline = [
        { $match: {} },
        { $skip: startIndex },
        { $limit: 20 },
      ];

      if (parentId !== '0') {
        pipeline[0].$match.parentId = new ObjectId(parentId);
      }
      resultFileCollection = await fileCollection.aggregate(pipeline).toArray();
      if (!resultFileCollection || resultFileCollection.length === 0) return res.json([]);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    for (let i = 0; i < resultFileCollection.length; i += 1) {
      const item = resultFileCollection[i];
      item.id = item._id.toString();
      delete item._id;
      item.userId = item.userId.toString();
      if ('localPath' in item) delete item.localPath;
      resultFileCollection[i] = item;
    }
    return res.json(resultFileCollection);
  }

  static async putPublish(req, res) {
    let update = {};
    try {
      const _id = req.params.id;
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const token = req.get('X-Token');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const collection = dbClient.db.collection('users');
      const result = await collection.findOne({ _id: new ObjectId(userId) });
      if (!result) return res.status(401).json({ error: 'Unauthorized' });
      const fileCollection = dbClient.db.collection('files');
      update = await fileCollection.findOneAndUpdate(
        { _id: new ObjectId(_id), userId: new ObjectId(userId) },
        { $set: { isPublic: true } },
        { returnOriginal: false },
      );
      if (!update || !update.value) return res.status(404).json({ error: 'Not found' });
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const newUpdate = update.value;
    newUpdate.id = newUpdate._id.toString();
    newUpdate.userId = newUpdate.userId.toString();
    newUpdate.parentId = newUpdate.parentId.toString();
    delete newUpdate._id;
    if ('localPath' in newUpdate) delete newUpdate.localPath;
    return res.status(200).json(newUpdate);
  }

  static async putUnpublish(req, res) {
    let update = {};
    try {
      const _id = req.params.id;
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const token = req.get('X-Token');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const collection = dbClient.db.collection('users');
      const result = await collection.findOne({ _id: new ObjectId(userId) });
      if (!result) return res.status(401).json({ error: 'Unauthorized' });
      const fileCollection = dbClient.db.collection('files');
      update = await fileCollection.findOneAndUpdate(
        { _id: new ObjectId(_id), userId: new ObjectId(userId) },
        { $set: { isPublic: false } },
        { returnOriginal: false },
      );
      if (!update || !update.value) return res.status(404).json({ error: 'Not found' });
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const newUpdate = update.value;
    newUpdate.id = newUpdate._id.toString();
    newUpdate.userId = newUpdate.userId.toString();
    newUpdate.parentId = newUpdate.parentId.toString();
    delete newUpdate._id;
    if ('localPath' in newUpdate) delete newUpdate.localPath;
    return res.status(200).json(newUpdate);
  }

  static async getFile(req, res) {
    try {
      const _id = req.params.id;
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const collection = dbClient.db.collection('files');
      const result = await collection.findOne({ _id: new ObjectId(_id) });
      if (!result) return res.status(404).json({ error: 'Not found' });
      const token = req.get('X-Token');
      let userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        userId = '';
      }
      if (!result.isPublic && result.userId !== userId) return res.status(404).json({ error: 'Not found' });
      if (result.type === 'folder') return res.status(400).json({ error: 'A folder doesn\'t have content' });
      if (!fs.existsSync(path.join(FOLDER_PATH, _id))) return res.status(404).json({ error: 'Not found' });
      const mType = mime.lookup(result.name);
      const options = {
        root: FOLDER_PATH,
      };

      res.set('Content-Type', mType);
      return res.sendFile(_id, options);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
module.exports = FilesController;
