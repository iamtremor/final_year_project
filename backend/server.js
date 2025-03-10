const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Document = require('./models/Document'); // Add missing import
const auth = require('./middleware/auth'); // Import auth middleware
require('dotenv').config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/blockchain', require('./routes/blockchainRoutes'));

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));