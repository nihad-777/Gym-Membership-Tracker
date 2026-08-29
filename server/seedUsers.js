import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const users = [
  {
    name: 'Admin Manager',
    email: 'admin@gym.com',
    password: 'admin123',
    role: 'admin',
    phone: '9876543210'
  },
  {
    name: 'Coach Alex',
    email: 'trainer@gym.com',
    password: 'trainer123',
    role: 'trainer',
    phone: '9876543211'
  },
  {
    name: 'John Member',
    email: 'member@gym.com',
    password: 'member123',
    role: 'member',
    phone: '9876543212',
    planType: 'Quarterly',
    amountPaid: 2500,
    healthNotes: 'Lower back precaution',
    status: 'Active'
  }
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});
    await User.insertMany(users);
    console.log('✅ 3 User Accounts Created Successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seedUsers();