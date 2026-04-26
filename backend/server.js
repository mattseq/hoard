const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

const SESSION_SECRET_KEY = process.env.SESSION_SECRET_KEY;

const PUBLIC_STORAGE_DIR = path.join(__dirname, "storage/public");
const PRIVATE_STORAGE_DIR = path.join(__dirname, "storage/private");

if (!fs.existsSync(PUBLIC_STORAGE_DIR)) {
  fs.mkdirSync(PUBLIC_STORAGE_DIR);
}
if (!fs.existsSync(PRIVATE_STORAGE_DIR)) {
  fs.mkdirSync(PRIVATE_STORAGE_DIR);
}

const knex = require("knex")({
  client: "better-sqlite3",
  connection: {
    filename: path.join(__dirname, "storage/file_metadata.db"),
  },
  useNullAsDefault: true,
});

knex.schema.hasTable("files").then((exists) => {
  if (!exists) {
    return knex.schema.createTable("files", (table) => {
      table.string("fileId").primary();
      table.string("originalName");
      table.string("path");
      table.string("url");
      table.integer("size");
      table.string("type");
      table.timestamp("uploadedAt").defaultTo(knex.fn.now());
      table.boolean("isPublic");
      table.string("owner").nullable();
    });
  }
});

knex.schema.hasTable("users").then((exists) => {
  if (!exists) {
    return knex.schema.createTable("users", (table) => {
      table.string("username").primary();
      table.string("password");
    });
  }
});

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  }),
);

function authMiddleware(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

app.get("/api/auth", authMiddleware, (req, res) => {
  return res.status(200).json({ loggedIn: true });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.USERNAME && password === process.env.PASSWORD) {
    req.session.user = { username };
    return res.status(200).json({ success: true });
  }

  const user = await knex("users").where({ username }).first();
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  if (await bcrypt.compare(password, user.password)) {
    req.session.user = { username };
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

app.post("/api/signup", async (req, res) => {
  const { username, password } = req.body;

  if (username == process.env.USERNAME) {
    return res.status(400).json({ message: "Username already taken" });
  }

  const existingUser = await knex("users").where({ username }).first();
  if (existingUser) {
    return res.status(400).json({ message: "Username already taken" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await knex("users").insert({
    username,
    password: hashedPassword,
  });

  req.session.user = { username };
  return res.status(200).json({ success: true });
});

app.post("/api/upload/public", multer().single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileId = nanoid(12);
  const ext = path.extname(file.originalname);

  const filePath = path.join(PUBLIC_STORAGE_DIR, fileId + ext);

  // write to storage
  fs.writeFileSync(filePath, file.buffer);

  // save metadata
  const meta = {
    fileId,
    originalName: file.originalname,
    path: filePath,
    url: `/files/public/${fileId}${ext}`,
    size: file.size,
    type: file.mimetype,
    uploadedAt: new Date().toISOString(),
    isPublic: true,
    owner: null,
  };

  await knex("files").insert(meta);

  // return file URL
  const fileUrl = `/files/public/${fileId}${ext}`;
  return res.json({ url: fileUrl });
});

app.post(
  "/api/upload/private",
  authMiddleware,
  multer().single("file"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileId = nanoid(12);
    const ext = path.extname(file.originalname);

    const filePath = path.join(PRIVATE_STORAGE_DIR, fileId + ext);

    // write to storage
    fs.writeFileSync(filePath, file.buffer);

    // save metadata
    const meta = {
      fileId,
      originalName: file.originalname,
      path: filePath,
      url: `/files/private/${fileId}${ext}`,
      size: file.size,
      type: file.mimetype,
      uploadedAt: new Date().toISOString(),
      isPublic: false,
      owner: req.session.user.username,
    };
    await knex("files").insert(meta);

    // return file URL
    const fileUrl = `/files/private/${fileId}${ext}`;
    return res.json({ url: fileUrl });
  },
);

app.get("/files/private/:file", authMiddleware, async (req, res) => {
  const queriedPath = path.join(PRIVATE_STORAGE_DIR, req.params.file);
  const file = await knex("files").where({ path: queriedPath }).first();

  if (file && file.owner != req.session.user.username) {
    return res.sendStatus(404);
  }

  const filePath = path.join(PRIVATE_STORAGE_DIR, req.params.file);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  return res.sendFile(filePath);
});

app.delete("/files/public/:fileId", async (req, res) => {
  const fileId = req.params.fileId;
  const file = await knex("files").where({ fileId, isPublic: true }).first();

  if (!file) return res.status(404).json({ message: "File not found" });

  // delete from storage
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  // delete metadata
  await knex("files").where({ fileId, isPublic: true }).del();

  return res.json({ message: "File deleted" });
});

app.delete("/files/private/:fileId", authMiddleware, async (req, res) => {
  const fileId = req.params.fileId;
  const file = await knex("files")
    .where({ fileId, isPublic: false, owner: req.session.user.username })
    .first();

  if (!file) return res.sendStatus(404).json({ message: "File not found" });

  // delete from storage
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  // delete metadata
  await knex("files").where({ fileId, isPublic: false }).del();

  return res.json({ message: "File deleted" });
});

app.get("/files/private", authMiddleware, async (req, res) => {
  try {
    const files = await knex("files").where({
      isPublic: false,
      owner: req.session.user.username,
    });

    return res.json(files);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching private files" });
  }
});

app.get("/files/public", async (req, res) => {
  try {
    const files = await knex("files").where({ isPublic: true });

    return res.json(files);
  } catch {
    return res.status(500).json({ message: "Error fetching public files" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
