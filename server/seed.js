import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';

dotenv.config();

const mockMembers = [
  {
    name: 'Rahul Sharma',
    phone: '9876543210',
    planType: 'Quarterly',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-09-01'),
    amountPaid: 2500,
    healthNotes: 'Locker #12, Mild Hypertension',
    status: 'Active'
  },
  {
    name: 'Ananya Verma',
    phone: '9123456780',
    planType: 'Monthly',
    startDate: new Date('2026-07-10'),
    endDate: new Date('2026-08-10'),
    amountPaid: 1000,
    healthNotes: 'Knee injury rehab',
    status: 'Expired'
  },
  {
    name: 'Faizan Khan',
    phone: '9988776655',
    planType: 'Annual',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2027-01-15'),
    amountPaid: 9500,
    healthNotes: 'Weightlifting trainer assigned',
    status: 'Active'
  },
  {
    name: 'Sneha Patel',
    phone: '9845123456',
    planType: 'Monthly',
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-09-01'),
    amountPaid: 1000,
    healthNotes: 'None',
    status: 'Active'
  },
  {
    name: 'Rohan Menon',
    phone: '9744112233',
    planType: 'Quarterly',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-07-01'),
    amountPaid: 2500,
    healthNotes: 'Asthma - keep inhaler in gym bag',
    status: 'Expired'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Member.insertMany(mockMembers);
    console.log('✅ Seed Data Inserted Successfully');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();