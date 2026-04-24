import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import pkg from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = pkg;
const getFolderPath = () => process.env.FOLDER_PATH || '/tmp/files_manager';
class FilesController {
    static async getShow(req, res) {
      if (!dbClient.isAlive() || !dbClient.db) {
        return res.status(503).json({ error: 'Database unavailable' });
      }
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      let file;
      try {
        file = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: ObjectId(userId) });
      } catch (e) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (!file) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({
        id: file._id.toString(),
        userId: file.userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId === '0' ? 0 : file.parentId.toString(),
      });
    }

    static async getIndex(req, res) {
      if (!dbClient.isAlive() || !dbClient.db) {
        return res.status(503).json({ error: 'Database unavailable' });
      }
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const parentId = req.query.parentId || '0';
      const page = parseInt(req.query.page, 10) || 0;
      const match = { userId: ObjectId(userId), parentId: parentId === '0' ? '0' : ObjectId(parentId) };
      const files = await dbClient.db.collection('files')
        .aggregate([
          { $match: match },
          { $sort: { _id: 1 } },
          { $skip: page * 20 },
          { $limit: 20 },
        ]).toArray();
      const result = files.map((file) => ({
        id: file._id.toString(),
        userId: file.userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId === '0' ? 0 : file.parentId.toString(),
      }));
      return res.status(200).json(result);
    }
  static async postUpload(req, res) {
    if (!dbClient.isAlive() || !dbClient.db) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    let parentFile = null;
    let parentIdToStore = '0';
    let parentIdForResponse = 0;
    if (parentId && parentId !== 0 && parentId !== '0') {
      try {
        parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      } catch (e) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
      parentIdToStore = ObjectId(parentId);
      parentIdForResponse = parentId;
    }

    const fileDoc = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentIdToStore,
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(fileDoc);
      return res.status(201).json({
        id: result.insertedId.toString(),
        userId: userId.toString(),
        name,
        type,
        isPublic,
        parentId: parentIdForResponse,
      });
    }

    // For file or image
    const folderPath = getFolderPath();
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    const localPath = path.join(folderPath, uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
    fileDoc.localPath = localPath;
    const result = await dbClient.db.collection('files').insertOne(fileDoc);
    return res.status(201).json({
      id: result.insertedId.toString(),
      userId: userId.toString(),
      name,
      type,
      isPublic,
      parentId: parentIdForResponse,
    });
  }
}

export default FilesController;
