import cron from 'node-cron';
import Member from '../models/Member.js';

export const initExpiryCron = () => {
  // Runs daily at midnight: '0 0 * * *' (or every minute for testing: '* * * * *')
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running daily membership expiration check...');
    try {
      const now = new Date();
      const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // 1. Mark members whose end date has passed as 'Expired'
      const expiredResult = await Member.updateMany(
        { endDate: { $lt: now }, status: 'Active' },
        { $set: { status: 'Expired' } }
      );
      if (expiredResult.modifiedCount > 0) {
        console.log(`⚠️ Auto-expired ${expiredResult.modifiedCount} memberships.`);
      }

      // 2. Query members expiring in the next 3 days
      const expiringSoon = await Member.find({
        endDate: { $gte: now, $lte: threeDaysAhead },
        status: 'Active',
      });

      console.log(`🔔 Found ${expiringSoon.length} memberships expiring within 3 days.`);
    } catch (err) {
      console.error('❌ Expiry cron error:', err.message);
    }
  });
};