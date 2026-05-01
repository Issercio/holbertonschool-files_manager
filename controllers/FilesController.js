import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// FIX ligne 4 : suppression du export default prématuré (la classe n'était pas encore définie)
class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    const filesCollection = dbClient.db.collection('files');

    if (parentId !== 0) {
      const parentFile = await filesCollection.findOne({ _id: ObjectId(parentId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileDoc = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : ObjectId(parentId),
    };

    if (type === 'folder') {
      const result = await filesCollection.insertOne(fileDoc);
      return res.status(201).json({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    // eslint-disable-next-line global-require
    const fs = require('fs');
    // eslint-disable-next-line global-require
    const path = require('path');

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

    // FIX lignes 79/81 : fs.default n'existe pas, on utilise fs directement
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // eslint-disable-next-line global-require
    const { v4: uuidv4 } = require('uuid');
    const localPath = path.join(folderPath, uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    fileDoc.localPath = localPath;
    const result = await filesCollection.insertOne(fileDoc);
    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    let fileId;
    try {
      fileId = ObjectId(id);
    } catch (e) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({
      _id: fileId,
      userId: ObjectId(userId),
    });

    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { parentId, page = 0 } = req.query;
    const pageNum = parseInt(page, 10);
    const pageSize = 20;
    const skip = pageNum * pageSize;

    const filesCollection = dbClient.db.collection('files');

    // FIX ligne 118 : conditions redondantes simplifiées en une logique claire
    const matchQuery = { userId: ObjectId(userId) };
    if (!parentId || parentId === '0' || parentId === 0) {
      matchQuery.$or = [
        { parentId: 0 },
        { parentId: '0' },
        { parentId: { $exists: false } },
      ];
    } else {
      try {
        matchQuery.parentId = ObjectId(parentId);
      } catch (e) {
        return res.status(200).json([]);
      }
    }

    const files = await filesCollection.aggregate([
      { $match: matchQuery },
      { $skip: skip },
      { $limit: pageSize },
    ]).toArray();

    const result = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));

    return res.status(200).json(result);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    let fileId;
    try {
      fileId = ObjectId(id);
    } catch (e) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOneAndUpdate(
      { _id: fileId, userId: ObjectId(userId) },
      { $set: { isPublic: true } },
      { returnDocument: 'after' },
    );

    if (!file.value) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file.value._id,
      userId: file.value.userId,
      name: file.value.name,
      type: file.value.type,
      isPublic: file.value.isPublic,
      parentId: file.value.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    let fileId;
    try {
      fileId = ObjectId(id);
    } catch (e) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOneAndUpdate(
      { _id: fileId, userId: ObjectId(userId) },
      { $set: { isPublic: false } },
      { returnDocument: 'after' },
    );

    if (!file.value) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file.value._id,
      userId: file.value.userId,
      name: file.value.name,
      type: file.value.type,
      isPublic: file.value.isPublic,
      parentId: file.value.parentId,
    });
  }
}

export default FilesController;
