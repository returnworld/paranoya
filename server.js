const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Session configuration - proper session handling with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'paranoya-secret-key',
  resave: false,
  saveUninitialized: false, // Only save sessions when they are modified
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/paranoya',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 * 30, // 30 days in seconds
    touchAfter: 24 * 3600 // Lazy session update every 24 hours
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 * 30, // 30 days in milliseconds
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    sameSite: 'lax',
    // Add these settings to ensure cookie persistence
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000 * 30) // 30 days from now
  },
  // Ensure session ID is generated consistently
  genid: function(req) {
    return require('crypto').randomBytes(16).toString('hex');
  }
}));

// Serve static files from public directory
app.use(express.static('public'));

// Route for welcome page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paranoya', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

connectDB();

// Import models
const Visit = require('./models/Visit');

// Helper function to get geolocation based on IP
const getGeolocationFromIP = async (ip) => {
  try {
    // Skip geolocation for local IP addresses
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return {
        country: null,
        city: null,
        region: null,
        latitude: null,
        longitude: null,
        timezone: null,
        isp: null
      };
    }

    // Using ip-api.com for geolocation lookup (free tier)
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'Paranoya-Visitor-Logger/1.0'
      }
    });
    
    if (response.data.status === 'success') {
      return {
        country: response.data.country || null,
        city: response.data.city || null,
        region: response.data.regionName || null,
        latitude: response.data.lat || null,
        longitude: response.data.lon || null,
        timezone: response.data.timezone || null,
        isp: response.data.isp || null
      };
    } else {
      throw new Error('Geolocation API returned error: ' + response.data.message);
    }
  } catch (error) {
    console.error('Error fetching geolocation:', error.message);
    // Return a default object if geolocation fails
    return {
      country: null,
      city: null,
      region: null,
      latitude: null,
      longitude: null,
      timezone: null,
      isp: null
    };
  }
};

// API endpoint to log visitor
app.post('/api/log-visit', async (req, res) => {
  try {
    // Get IP address (check for proxy headers first)
    const ip = req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Clean IP address (remove IPv6 prefix if present)
    const cleanIP = ip ? ip.replace(/^::ffff:/, '') : 'unknown';
    
    // Get session ID from express-session (built-in)
    const sessionId = req.sessionID;
    
    // Add data to session to ensure it gets saved (required for saveUninitialized: false)
    if (!req.session.visits) {
      req.session.visits = [];
    }
    req.session.visits.push({
      timestamp: new Date(),
      ip: cleanIP
    });
    
    // Get geolocation data
    const geoData = await getGeolocationFromIP(cleanIP);
    
    // Create new visit record - save every visit
    const visit = new Visit({
      ip: cleanIP,
      sessionId: sessionId,
      visitTime: new Date(),
      geolocation: geoData
    });
    await visit.save();
    
    res.status(200).json({
      message: 'Visit logged successfully',
      sessionId: sessionId,
      visit: {
        ip: visit.ip,
        sessionId: visit.sessionId,
        visitTime: visit.visitTime,
        geolocation: visit.geolocation
      }
    });
  } catch (error) {
    console.error('Error logging visit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get all visitors stats (HTML page)
app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

// API endpoint to get all visits stats (JSON)
app.get('/api/stats', async (req, res) => {
  try {
    // Get all visits sorted by visit time descending
    const visits = await Visit.find().sort({ visitTime: -1 });
    const totalVisits = visits.length;
    
    // Calculate unique sessions
    const uniqueSessions = [...new Set(visits.map(v => v.sessionId))].length;
    
    // Group visits by session
    const sessionsMap = new Map();
    visits.forEach(visit => {
      const sessionKey = visit.sessionId || 'legacy-' + visit.ip; // Handle old records without sessionId
      
      if (!sessionsMap.has(sessionKey)) {
        sessionsMap.set(sessionKey, {
          sessionId: visit.sessionId,
          ip: visit.ip,
          visits: [],
          geolocation: visit.geolocation,
          totalVisits: 0,
          firstVisit: visit.visitTime,
          lastVisit: visit.visitTime
        });
      }
      
      const sessionData = sessionsMap.get(sessionKey);
      sessionData.visits.push(visit);
      sessionData.totalVisits++;
      
      // Update first and last visit times
      if (new Date(visit.visitTime) < new Date(sessionData.firstVisit)) {
        sessionData.firstVisit = visit.visitTime;
      }
      if (new Date(visit.visitTime) > new Date(sessionData.lastVisit)) {
        sessionData.lastVisit = visit.visitTime;
      }
    });
    
    // Convert map values to array and sort by last visit time
    const sessions = Array.from(sessionsMap.values()).sort((a, b) =>
      new Date(b.lastVisit) - new Date(a.lastVisit)
    );
    
    res.status(200).json({
      totalRecords: totalVisits,
      uniqueSessions: uniqueSessions,
      sessions: sessions
    });
  } catch (error) {
    console.error('Error fetching visit stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;