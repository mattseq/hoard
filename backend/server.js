const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();
const PORT = 5000;

const JWT_SECRET = 'supersecretkey';

const STORAGE_DIR = path.join(__dirname, 'storage');

if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR);
}

app.use(express.json());

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    }

    res.status(401).json({ message: 'Invalid credentials' });
});

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

app.post('/api/upload', authMiddleware, multer().single('file'), (req, res) => {
    console.log(req.file)
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileId = nanoid(12);
    const ext = path.extname(file.originalname);
    const filePath = path.join(STORAGE_DIR, fileId + ext);

    fs.writeFileSync(filePath, file.buffer);

    const meta = {
        fileId,
        originalName: file.originalname,
        path: filePath,
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date()
    };
    fs.writeFileSync(path.join(STORAGE_DIR, fileId + '.json'), JSON.stringify(meta));

    res.json({ url: `/files/${fileId}${ext}` });
});

// app.get('/files/:file', (req, res) => {
//   const filePath = path.join(STORAGE_DIR, req.params.file);
//   if (!fs.existsSync(filePath)) return res.sendStatus(404);
//   res.sendFile(filePath);
// });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});