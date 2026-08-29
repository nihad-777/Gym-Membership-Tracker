import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'trainer', 'member'],
      default: 'member',
    },
    phone: { type: String, default: '' },
    // Role-specific references
    assignedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    planType: { type: String, enum: ['Monthly', 'Quarterly', 'Annual'], default: 'Monthly' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) },
    amountPaid: { type: Number, default: 0 },
    healthNotes: { type: String, default: 'None' },
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    attendance: [{ date: { type: Date, default: Date.now } }],
    workouts: [{ day: String, exercise: String, sets: Number, reps: Number }],
    dietPlan: { type: String, default: 'Standard high-protein balanced diet.' },
    weightLogs: [{ date: { type: Date, default: Date.now }, weight: Number }]
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);