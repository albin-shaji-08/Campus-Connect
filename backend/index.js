// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/authRoutes');
const Admin = require('./models/Admin');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const bannerRoutes = require('./routes/bannerRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const { startReminderScheduler } = require('./utils/reminderService');


const app = express();

const frontendEnv = process.env.FRONTEND_URL;
const allowedDevOrigins = [frontendEnv, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);
console.log('Configured allowed CORS origins:', allowedDevOrigins);

// Dynamic origin handler: allow requests when origin is in the allowed list, or allow all in non-production by echoing origin.
app.use(cors({
  origin: function (origin, callback) {
    // No origin (curl/postman/server) - allow
    if (!origin) return callback(null, true);
    // If origin is in our allowed list, allow
    if (allowedDevOrigins.includes(origin)) return callback(null, true);
    // In development, be permissive and echo the origin (useful when many dev servers used)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CORS: allowing dev origin:', origin);
      return callback(null, true);
    }
    // Otherwise block
    console.warn('CORS: rejecting origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/banners', bannerRoutes); 
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

const createDefaultAdmin = async () => {
  const email = 'admin@email.com';
  const password = 'admin@123';

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await Admin.create({ email, password: hashedPassword });
      console.log('✅ Default admin created.');
    } else {
      console.log('✅ Default admin already exists.');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
};

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB; // optional override
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set. Please set it in your environment or backend/.env');
  process.exit(1);
}

const connectOpts = {};
if (MONGO_DB) connectOpts.dbName = MONGO_DB;

mongoose.connect(MONGO_URI, connectOpts)
  .then(async () => {
    // Log what DB we're connected to. If dbName was supplied, that's used; otherwise inferred from URI
    const usedDb = mongoose.connection?.name || (MONGO_DB || '(unknown)');
    console.log('✅ MongoDB connected. Using database:', usedDb);
    await createDefaultAdmin(); // Create admin after DB connection
    
    // Start reminder scheduler
    startReminderScheduler();
    
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
