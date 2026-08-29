import express from 'express';
import Member from '../models/Member.js';

const router = express.Router();

// Helper: Calculate End Date based on Plan Type
const calculateEndDate = (startDateStr, planType) => {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  const end = new Date(start);

  if (planType === 'Monthly') {
    end.setMonth(end.getMonth() + 1);
  } else if (planType === 'Quarterly') {
    end.setMonth(end.getMonth() + 3);
  } else if (planType === 'Annual') {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
};

// 1. GET all members (with search & status filter)
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const members = await Member.find(query).sort({ createdAt: -1 });
    const now = new Date();

    // Dynamically update status based on current date
    const updatedMembers = await Promise.all(
      members.map(async (m) => {
        const currentStatus = new Date(m.endDate) >= now ? 'Active' : 'Expired';
        if (m.status !== currentStatus) {
          m.status = currentStatus;
          await m.save();
        }
        return m;
      })
    );

    res.json(updatedMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const members = await Member.find();

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => new Date(m.endDate) >= now).length;
    const expiredMembers = totalMembers - activeMembers;
    const totalRevenue = members.reduce((sum, m) => sum + (m.amountPaid || 0), 0);

    res.json({
      totalMembers,
      activeMembers,
      expiredMembers,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST Create new member
router.post('/', async (req, res) => {
  try {
    const { name, phone, planType, startDate, amountPaid, healthNotes } = req.body;
    const calculatedEnd = calculateEndDate(startDate, planType);
    const status = new Date(calculatedEnd) >= new Date() ? 'Active' : 'Expired';

    const newMember = new Member({
      name,
      phone,
      planType,
      startDate: startDate || new Date(),
      endDate: calculatedEnd,
      amountPaid: Number(amountPaid),
      healthNotes: healthNotes || 'None',
      status,
    });

    const savedMember = await newMember.save();
    res.status(201).json(savedMember);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. PUT Renew/Extend member subscription
router.put('/:id/renew', async (req, res) => {
  try {
    const { planType, amountPaid } = req.body;
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Extend from current endDate if still active, or from today if already expired
    const baseDate = new Date(member.endDate) > new Date() ? member.endDate : new Date();
    member.planType = planType || member.planType;
    member.endDate = calculateEndDate(baseDate, member.planType);
    member.status = 'Active';

    if (amountPaid) {
      member.amountPaid += Number(amountPaid);
    }

    const updated = await member.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. DELETE Member
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Member.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST Daily Check-In
router.post('/:id/checkin', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    
    if (member.status === 'Expired') {
      return res.status(400).json({ error: 'Cannot check in: Membership is expired!' });
    }

    member.lastCheckIn = new Date();
    const updated = await member.save();
    res.json({ message: 'Check-in successful', lastCheckIn: updated.lastCheckIn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET Members expiring within N days (Default: 3 days)
router.get('/alerts/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const expiringMembers = await Member.find({
      endDate: { $gte: now, $lte: threshold },
      status: 'Active',
    }).select('name phone planType endDate amountPaid');

    res.json(expiringMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;