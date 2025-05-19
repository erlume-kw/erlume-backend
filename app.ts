const express = require('express');
const app = express();
const userRoutes = require('../routes/userRoutes');

// Middleware to parse JSON body
app.use(express.json());

// Use the userRoutes for user-related routes
app.use('/api', userRoutes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});