import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import pkg from 'mongodb';
const { ObjectId } = pkg;

const getFolderPath = () => process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    if (!dbClient.isAlive()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, parentId = 0, isPublic = false, data } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    let parentFile = null;
    if (parentId && parentId !== 0 && parentId !== '0') {
      parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileDoc = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 || parentId === '0' ? '0' : parentId,
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(fileDoc);
      return res.status(201).json({
        id: result.insertedId.toString(),
        userId: userId.toString(),
        name,
        type,
        isPublic,
        parentId: fileDoc.parentId.toString(),
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
      parentId: fileDoc.parentId.toString(),
    });
  }
}

export default FilesController;
