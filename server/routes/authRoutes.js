import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase(), password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      planType: user.planType,
      healthNotes: user.healthNotes,
      status: user.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;