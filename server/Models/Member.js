import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    planType: { 
      type: String, 
      enum: ['Monthly', 'Quarterly', 'Annual'], 
      required: true, 
      default: 'Monthly' 
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    amountPaid: { type: Number, required: true, min: 0 },
    healthNotes: { type: String, default: 'None', trim: true },
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    lastCheckIn: { type: Date, default: null } // New Field
  },
  { timestamps: true }
);

export default mongoose.model('Member', memberSchema);