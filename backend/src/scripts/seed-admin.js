import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

/**
 * Provisions a secure administrator account if one does not already exist
 */
export const ensureAdminExists = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@annapurna.org').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminPassword123';

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return existingAdmin;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  const admin = await User.create({
    name: 'Annapurna Administrator',
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    organization: 'Annapurna Operations',
    phone: '+91 98000 00000',
    isVerified: true,
    verificationStatus: 'verified'
  });

  console.log(`Initial Admin account provisioned: ${admin.email}`);
  return admin;
};

// If run directly from terminal
if (process.argv[1]?.endsWith('seed-admin.js')) {
  (async () => {
    try {
      await connectDB();
      await ensureAdminExists();
      console.log('Admin seeding complete.');
    } catch (err) {
      console.error('Seeding error:', err.message);
    } finally {
      await mongoose.connection.close();
      process.exit(0);
    }
  })();
}
