const User = require('../models/User');
const generateToken = require('../utils/generateToken');

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    gender: user.gender,
    age: user.age,
    height: user.height,
    weight: user.weight,
    goalWeight: user.goalWeight,
    dietPreference: user.dietPreference,
    budget: user.budget,
    fitnessLevel: user.fitnessLevel,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    caloriePlan: user.caloriePlan || null,
    points: user.points,
    level: user.level,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak
  };
}

async function registerUser(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: 'Email already in use.' });
  }

  const user = await User.create({
    name,
    email,
    password,
    onboardingCompleted: false
  });

  return res.status(201).json({
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  return res.json({
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
}

async function getMe(req, res) {
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user: sanitizeUser(user) });
}

async function updateProfile(req, res) {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const fields = [
    'name',
    'gender',
    'age',
    'height',
    'weight',
    'goalWeight',
    'dietPreference',
    'budget',
    'fitnessLevel'
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  return res.json({ user: sanitizeUser(user) });
}

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile
};
