const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedFoodDatabase } = require('./utils/seedFoodDatabase');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Offline AI Coach' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/life', require('./routes/lifeRoutes'));
app.use('/api/coach', require('./routes/coachRoutes'));
app.use('/api/nutrition', require('./routes/nutritionRoutes'));
app.use('/api/planning', require('./routes/planningRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try {
    await seedFoodDatabase();
  } catch (error) {
    console.error('Food seed warning:', error.message);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});
