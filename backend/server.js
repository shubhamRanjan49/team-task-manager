const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]
  .filter(Boolean)
  .flatMap((origin) => origin.split(','))
  .map((origin) => origin.trim());

const isAllowedVercelPreviewOrigin = (origin) => {
  if (!process.env.CLIENT_URL) return false;

  try {
    const requestUrl = new URL(origin);
    const configuredUrls = process.env.CLIENT_URL
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => new URL(value));

    return configuredUrls.some((configuredUrl) => {
      if (!configuredUrl.hostname.endsWith('.vercel.app')) return false;
      if (requestUrl.protocol !== 'https:') return false;
      if (!requestUrl.hostname.endsWith('.vercel.app')) return false;

      const configuredProject = configuredUrl.hostname.replace('.vercel.app', '');
      const requestProject = requestUrl.hostname.replace('.vercel.app', '');

      return requestProject === configuredProject || requestProject.startsWith(`${configuredProject}-`);
    });
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isAllowedVercelPreviewOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/', (req, res) => {
  res.json({ message: 'Team Task Manager API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/team-task-manager';

let mongoConnectionPromise;

const connectToMongo = () => {
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGO_URI).catch((err) => {
      mongoConnectionPromise = null;
      throw err;
    });
  }

  return mongoConnectionPromise;
};

connectToMongo().catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
