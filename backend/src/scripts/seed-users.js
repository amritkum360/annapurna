import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import PickupTask from '../models/PickupTask.js';

/**
 * Clean & Provision User Accounts Only.
 * Removes dummy donations and tasks, keeping/upserting only login accounts.
 */
export const seedUsersOnly = async () => {
  console.log('====================================================');
  console.log('   Annapurna: Provisioning Clean Login Users Only   ');
  console.log('====================================================');

  await connectDB();

  // 1. Delete all dummy donations and pickup tasks
  const deletedDonations = await Donation.deleteMany({});
  const deletedTasks = await PickupTask.deleteMany({});
  console.log(`\n🧹 Cleaned existing donations: ${deletedDonations.deletedCount} removed`);
  console.log(`🧹 Cleaned existing tasks: ${deletedTasks.deletedCount} removed`);

  // 2. Passwords
  const demoPassword = process.env.DEMO_PASSWORD || 'DemoPass123!';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminPassword123';
  const salt = await bcrypt.genSalt(10);
  const hashedDemoPassword = await bcrypt.hash(demoPassword, salt);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);

  // 3. User accounts
  const usersConfig = [
    {
      email: (process.env.ADMIN_EMAIL || 'admin@annapurna.org').toLowerCase(),
      name: 'Annapurna Administrator',
      role: 'admin',
      organization: 'Annapurna Platform Trust',
      phone: '+91 98000 00000',
      isVerified: true,
      verificationStatus: 'verified',
      city: 'Mumbai',
      address: { street: 'HQ Tower, BKC', city: 'Mumbai', state: 'Maharashtra', postalCode: '400051' }
    },
    {
      email: 'donor.demo@annapurna.org',
      name: 'Priya Sharma (Chef)',
      role: 'donor',
      organization: 'The Grand Green Cafe',
      phone: '+91 98200 11223',
      isVerified: true,
      verificationStatus: 'verified',
      city: 'Mumbai',
      address: { street: '15 Hill Road, Bandra West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050' }
    },
    {
      email: 'ngo.verified@annapurna.org',
      name: 'Rajesh Mehta',
      role: 'ngo',
      organization: 'Roti Bank Youth Foundation',
      phone: '+91 98200 44556',
      isVerified: true,
      verificationStatus: 'verified',
      verificationNotes: 'FCRA & 80G certified NGO. Fast-track approved.',
      city: 'Mumbai',
      address: { street: 'Plot 42, Dharavi Main Road', city: 'Mumbai', state: 'Maharashtra', postalCode: '400017' }
    },
    {
      email: 'ngo.pending@annapurna.org',
      name: 'Sunita Patel',
      role: 'ngo',
      organization: 'Asha Food Mission',
      phone: '+91 98200 55667',
      isVerified: false,
      verificationStatus: 'pending',
      verificationNotes: 'Registration documents submitted. Awaiting admin review.',
      city: 'Mumbai',
      address: { street: 'Station Road, Kurla West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400070' }
    },
    {
      email: 'volunteer.demo@annapurna.org',
      name: 'Aarav Verma',
      role: 'volunteer',
      organization: 'Community Volunteer Circle',
      phone: '+91 98200 77889',
      isVerified: true,
      verificationStatus: 'verified',
      city: 'Mumbai',
      address: { street: '22 Linking Road, Bandra West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050' }
    }
  ];

  console.log('\n👤 Upserting login accounts...');
  for (const config of usersConfig) {
    const password = config.role === 'admin' ? hashedAdminPassword : hashedDemoPassword;
    let user = await User.findOne({ email: config.email });
    if (!user) {
      user = await User.create({
        ...config,
        password
      });
      console.log(`   + Created: ${config.name} (${config.email}) [${config.role}]`);
    } else {
      user.name = config.name;
      user.organization = config.organization;
      user.phone = config.phone;
      user.role = config.role;
      user.isVerified = config.isVerified;
      user.verificationStatus = config.verificationStatus;
      user.verificationNotes = config.verificationNotes || '';
      user.city = config.city;
      user.password = password;
      await user.save();
      console.log(`   ~ Verified/Updated: ${config.name} (${config.email}) [${config.role}]`);
    }
  }

  const userCount = await User.countDocuments();
  const donationCount = await Donation.countDocuments();
  const taskCount = await PickupTask.countDocuments();

  console.log('\n====================================================');
  console.log('   Users Only Setup Complete! Database is Clean.    ');
  console.log('====================================================');
  console.log(`Total Users in DB: ${userCount}`);
  console.log(`Total Donations in DB: ${donationCount} (Cleaned)`);
  console.log(`Total Pickup Tasks in DB: ${taskCount} (Cleaned)`);
  console.log('====================================================\n');
};

// If run directly from terminal
if (process.argv[1]?.endsWith('seed-users.js')) {
  (async () => {
    try {
      await seedUsersOnly();
    } catch (err) {
      console.error('Seeding error:', err.message);
    } finally {
      await mongoose.connection.close();
      process.exit(0);
    }
  })();
}
