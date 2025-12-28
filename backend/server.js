const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();
const PORT = 5000;

const JWT_SECRET = process.env.JWT_SECRET;

const PUBLIC_STORAGE_DIR = path.join(__dirname, 'public_storage');
const PRIVATE_STORAGE_DIR = path.join(__dirname, 'private_storage');

if (!fs.existsSync(PUBLIC_STORAGE_DIR)) {
    fs.mkdirSync(PUBLIC_STORAGE_DIR);
}

app.use(express.json());

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader && authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

app.get('/api/auth', (req, res) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401);
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401);
        }

        return res.status(200);
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.USERNAME && password === process.env.PASSWORD) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
});

app.post('/api/upload', authMiddleware, multer().single('file'), (req, res) => {
    console.log(req.file, req.body)
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { isPublic } = req.body;

    const fileId = nanoid(12);
    const ext = path.extname(file.originalname);

    // determine storage directory
    const storageDir = isPublic ? PUBLIC_STORAGE_DIR : PRIVATE_STORAGE_DIR

    const filePath = path.join(storageDir, fileId + ext);

    // write to storage
    fs.writeFileSync(filePath, file.buffer);

    // save metadata
    const meta = {
        fileId,
        originalName: file.originalname,
        path: filePath,
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date()
    };
    fs.writeFileSync(path.join(storageDir, fileId + '.json'), JSON.stringify(meta));

    // return file URL
    const fileUrl = isPublic ? `/files/public/${fileId}${ext}` : `/files/private/${fileId}${ext}`;
    return res.json({ url: fileUrl });
});

app.get('/files/private/:file', authMiddleware, (req, res) => {
  const filePath = path.join(PRIVATE_STORAGE_DIR, req.params.file);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  return res.sendFile(filePath);
});

app.get('/files/private', authMiddleware, (req, res) => {
    const files = fs.readdirSync(PRIVATE_STORAGE_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
            const meta = JSON.parse(fs.readFileSync(path.join(PRIVATE_STORAGE_DIR, f)));
            return {
                fileId: meta.fileId,
                originalName: meta.originalName,
                size: meta.size,
                type: meta.type,
                uploadedAt: meta.uploadedAt,
                url: `/files/private/${meta.fileId}${path.extname(meta.originalName)}`
            };
        });
    return res.json(files);
});

app.get('/files/public', (req, res) => {
    const files = fs.readdirSync(PUBLIC_STORAGE_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
            const meta = JSON.parse(fs.readFileSync(path.join(PUBLIC_STORAGE_DIR, f)));
            return {
                fileId: meta.fileId,
                originalName: meta.originalName,
                size: meta.size,
                type: meta.type,
                uploadedAt: meta.uploadedAt,
                url: `/files/public/${meta.fileId}${path.extname(meta.originalName)}`
            };
        });
    return res.json(files);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});