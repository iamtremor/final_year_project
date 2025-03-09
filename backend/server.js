const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
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
const blockchainRoutes = require('./routes/blockchainRoutes');
app.get("/api/documents/student", async (req, res) => {
  console.log("Authenticated User ID:", req.user.id); // Check user ID
  const documents = await Document.find({ userId: req.user.id });
  console.log("Documents Found:", documents); // See if documents exist
  res.json(documents);
});
app.use('/api/blockchain', blockchainRoutes);
// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
