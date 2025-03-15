const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Document = require('./models/Document');
const auth = require('./middleware/auth');
require('dotenv').config();
const { initializeJobs } = require('./jobs/scheduler');
// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Exact match of your frontend URL
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Access-Control-Allow-Credentials'
  ]
}));
app.options('*', cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/blockchain', require('./routes/blockchainRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes')); // Add this line
app.use('/api/dashboard', require('./routes/dashboardRoutes'))
app.use('/api/clearance', require('./routes/clearanceRoutes'));
// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.post('/test-upload', (req, res) => {
  res.json({ message: 'Test upload endpoint reached' });
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Initialize scheduled jobs
  try {
    initializeJobs();
    console.log('Scheduled jobs initialized successfully');
  } catch (error) {
    console.error('Error initializing scheduled jobs:', error);
  }
});