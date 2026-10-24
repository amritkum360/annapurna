import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import PickupTask from '../models/PickupTask.js';
import { encryptCode } from '../utils/crypto.js';

/**
 * Idempotent Demo Seeder for Annapurna - Save Food. Share Hope.
 * Prepares deterministic test accounts and realistic donations across all lifecycle statuses.
 */
export const seedDemoEnvironment = async (options = {}) => {
  const silent = options.silent || false;
  const log = (...args) => !silent && console.log(...args);

  log('====================================================');
  log('   Annapurna Demo Environment Setup (Idempotent)   ');
  log('====================================================');

  // 1. Environment Safety Checks
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data in production environment (NODE_ENV=production).');
  }

  if (process.env.ALLOW_DEMO_SEED === 'false') {
    throw new Error('Demo seeding has been explicitly disabled via ALLOW_DEMO_SEED=false.');
  }

  const demoPassword = process.env.DEMO_PASSWORD || 'DemoPass123!';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminPassword123';
  const salt = await bcrypt.genSalt(10);
  const hashedDemoPassword = await bcrypt.hash(demoPassword, salt);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);

  // 2. Deterministic Demo Users
  const demoUsersConfig = [
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
      organization: 'Hope Care Foundation',
      phone: '+91 98200 44556',
      isVerified: true,
      verificationStatus: 'verified',
      verificationNotes: 'FCRA and 80G documentation verified by Platform Admin.',
      city: 'Mumbai',
      address: { street: '88 SV Road, Khar West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400052' }
    },
    {
      email: 'ngo.pending@annapurna.org',
      name: 'Sunita Patel',
      role: 'ngo',
      organization: 'Care Meals Society',
      phone: '+91 98200 99001',
      isVerified: false,
      verificationStatus: 'pending',
      verificationNotes: '',
      city: 'Mumbai',
      address: { street: '10 Station Road, Santacruz', city: 'Mumbai', state: 'Maharashtra', postalCode: '400054' }
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

  log('\n1. Upserting deterministic demo users...');
  const seededUsers = {};

  for (const config of demoUsersConfig) {
    let user = await User.findOne({ email: config.email });
    if (!user) {
      user = await User.create({
        ...config,
        password: config.role === 'admin' ? hashedAdminPassword : hashedDemoPassword
      });
      log(`   + Created: ${config.name} (${config.email}) [${config.role}]`);
    } else {
      user.name = config.name;
      user.organization = config.organization;
      user.phone = config.phone;
      user.role = config.role;
      user.isVerified = config.isVerified;
      user.verificationStatus = config.verificationStatus;
      user.verificationNotes = config.verificationNotes || '';
      user.city = config.city;
      user.password = config.role === 'admin' ? hashedAdminPassword : hashedDemoPassword;
      await user.save();
      log(`   ~ Reused/Updated: ${config.name} (${config.email}) [${config.role}]`);
    }
    seededUsers[config.role] = user;
    if (config.verificationStatus === 'pending') {
      seededUsers['pending_ngo'] = user;
    }
    if (config.verificationStatus === 'verified' && config.role === 'ngo') {
      seededUsers['verified_ngo'] = user;
    }
  }

  const donorUser = seededUsers.donor;
  const verifiedNgo = seededUsers.verified_ngo;
  const volunteerUser = seededUsers.volunteer;

  const now = Date.now();
  const ONE_HOUR = 3600000;

  // 3. Deterministic Realistic Food Donations
  const demoDonationsConfig = [
    {
      tag: '[DEMO_AVAIL_1]',
      foodName: '50 Fresh Dal Khichdi & Roti Meals',
      dietaryType: 'veg',
      foodType: 'cooked_meal',
      quantityMeals: 50,
      quantity: '50 boxed containers',
      preparationTime: new Date(now - 1 * ONE_HOUR),
      pickupDeadline: new Date(now + 4 * ONE_HOUR),
      safeConsumptionDeadline: new Date(now + 8 * ONE_HOUR),
      storageCondition: 'hot',
      status: 'available',
      pickupAddress: {
        street: '15 Hill Road, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050'
      },
      location: {
        type: 'Point',
        latitude: 19.0596,
        longitude: 72.8295,
        coordinates: [72.8295, 19.0596]
      },
      photoUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60'
    },
    {
      tag: '[DEMO_AVAIL_2]',
      foodName: '35 Assorted Artisan Bread & Sandwiches',
      dietaryType: 'veg',
      foodType: 'bakery_items',
      quantityMeals: 35,
      quantity: '35 packed packages',
      preparationTime: new Date(now - 2 * ONE_HOUR),
      pickupDeadline: new Date(now + 3 * ONE_HOUR),
      safeConsumptionDeadline: new Date(now + 6 * ONE_HOUR),
      storageCondition: 'room_temperature',
      status: 'available',
      pickupAddress: {
        street: '88 SV Road, Khar West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400052'
      },
      location: {
        type: 'Point',
        latitude: 19.0700,
        longitude: 72.8350,
        coordinates: [72.8350, 19.0700]
      },
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60'
    },
    {
      tag: '[DEMO_AVAIL_3]',
      foodName: '80 Boxed South Indian Lunch Trays',
      dietaryType: 'vegan',
      foodType: 'cooked_meal',
      quantityMeals: 80,
      quantity: '80 meal trays',
      preparationTime: new Date(now - 1.5 * ONE_HOUR),
      pickupDeadline: new Date(now + 5 * ONE_HOUR),
      safeConsumptionDeadline: new Date(now + 9 * ONE_HOUR),
      storageCondition: 'hot',
      status: 'available',
      pickupAddress: {
        street: '45 SV Road, Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400058'
      },
      location: {
        type: 'Point',
        latitude: 19.1136,
        longitude: 72.8697,
        coordinates: [72.8697, 19.1136]
      },
      photoUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=60'
    },
    {
      tag: '[DEMO_ACCEPTED_1]',
      foodName: '40 Vegetable Biryani Trays',
      dietaryType: 'veg',
      foodType: 'cooked_meal',
      quantityMeals: 40,
      quantity: '40 meal trays',
      preparationTime: new Date(now - 2 * ONE_HOUR),
      pickupDeadline: new Date(now + 2.5 * ONE_HOUR),
      safeConsumptionDeadline: new Date(now + 5 * ONE_HOUR),
      storageCondition: 'hot',
      status: 'accepted',
      claimedBy: verifiedNgo._id,
      claimedAt: new Date(now - 30 * 60000),
      pickupAddress: {
        street: '72 Turner Road, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050'
      },
      location: {
        type: 'Point',
        latitude: 19.0600,
        longitude: 72.8330,
        coordinates: [72.8330, 19.0600]
      },
      photoUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60'
    },
    {
      tag: '[DEMO_PICKED_UP_1]',
      foodName: '60 Protein Salad & Paneer Bowls',
      dietaryType: 'veg',
      foodType: 'cooked_meal',
      quantityMeals: 60,
      quantity: '60 bowls',
      preparationTime: new Date(now - 3 * ONE_HOUR),
      pickupDeadline: new Date(now + 1.5 * ONE_HOUR),
      safeConsumptionDeadline: new Date(now + 4 * ONE_HOUR),
      storageCondition: 'refrigerated',
      status: 'picked_up',
      claimedBy: volunteerUser._id,
      claimedAt: new Date(now - 90 * 60000),
      pickedUpAt: new Date(now - 20 * 60000),
      plainDeliveryCode: '842915', // Seeded handover code for judge demo
      pickupAddress: {
        street: '102 Shivaji Park, Dadar',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400028'
      },
      location: {
        type: 'Point',
        latitude: 19.0280,
        longitude: 72.8390,
        coordinates: [72.8390, 19.0280]
      },
      photoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60'
    },
    {
      tag: '[DEMO_DELIVERED_1]',
      foodName: '120 Wedding Banquet Surplus Meals',
      dietaryType: 'veg',
      foodType: 'cooked_meal',
      quantityMeals: 120,
      quantity: '120 buffet boxed meals',
      preparationTime: new Date(now - 26 * ONE_HOUR),
      pickupDeadline: new Date(now - 22 * ONE_HOUR),
      safeConsumptionDeadline: new Date(now - 18 * ONE_HOUR),
      storageCondition: 'room_temperature',
      status: 'delivered',
      claimedBy: verifiedNgo._id,
      claimedAt: new Date(now - 25 * ONE_HOUR),
      pickedUpAt: new Date(now - 24 * ONE_HOUR),
      deliveredAt: new Date(now - 23 * ONE_HOUR),
      deliveryNotes: 'Safely delivered to 120 residents at Hope Care Shelter, Bandra.',
      pickupAddress: {
        street: 'Royal Hall, Worli Seaface',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400018'
      },
      location: {
        type: 'Point',
        latitude: 19.0178,
        longitude: 72.8178,
        coordinates: [72.8178, 19.0178]
      },
      photoUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60'
    },
    {
      tag: '[DEMO_DELIVERED_2]',
      foodName: '75 Corporate Cafeteria Fresh Meals',
      dietaryType: 'veg',
      foodType: 'cooked_meal',
      quantityMeals: 75,
      quantity: '75 boxed lunch trays',
      preparationTime: new Date(now - 48 * ONE_HOUR),
      pickupDeadline: new Date(now - 44 * ONE_HOUR),
      safeConsumptionDeadline: new Date(now - 40 * ONE_HOUR),
      storageCondition: 'room_temperature',
      status: 'delivered',
      claimedBy: volunteerUser._id,
      claimedAt: new Date(now - 47 * ONE_HOUR),
      pickedUpAt: new Date(now - 46 * ONE_HOUR),
      deliveredAt: new Date(now - 45 * ONE_HOUR),
      deliveryNotes: 'Delivered to Dharavi Community Center distribution drive.',
      pickupAddress: {
        street: 'Tech Park, Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400076'
      },
      location: {
        type: 'Point',
        latitude: 19.1176,
        longitude: 72.9060,
        coordinates: [72.9060, 19.1176]
      },
      photoUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60'
    }
  ];

  log('\n2. Upserting deterministic demo food donations...');
  let seededDonationsCount = 0;

  for (const item of demoDonationsConfig) {
    const { tag, plainDeliveryCode, ...fields } = item;

    let donation = await Donation.findOne({ specialInstructions: tag });

    // Encryption setup if picked_up status
    let codeHash = null;
    let codeEncrypted = null;
    if (fields.status === 'picked_up' && plainDeliveryCode) {
      codeHash = crypto.createHash('sha256').update(plainDeliveryCode).digest('hex');
      codeEncrypted = encryptCode(plainDeliveryCode);
    }

    if (!donation) {
      donation = await Donation.create({
        ...fields,
        donor: donorUser._id,
        specialInstructions: tag,
        deliveryCodeHash: codeHash,
        deliveryCodeEncrypted: codeEncrypted,
        deliveryCodeExpiresAt: fields.status === 'picked_up' ? new Date(now + 24 * ONE_HOUR) : null
      });
      log(`   + Created donation: ${donation.foodName} [${donation.status}]`);
    } else {
      donation.foodName = fields.foodName;
      donation.title = fields.foodName;
      donation.dietaryType = fields.dietaryType;
      donation.quantityMeals = fields.quantityMeals;
      donation.preparationTime = fields.preparationTime;
      donation.pickupDeadline = fields.pickupDeadline;
      donation.safeConsumptionDeadline = fields.safeConsumptionDeadline;
      donation.expiryDeadline = fields.pickupDeadline;
      donation.status = fields.status;
      donation.claimedBy = fields.claimedBy || null;
      donation.claimedAt = fields.claimedAt || null;
      donation.pickedUpAt = fields.pickedUpAt || null;
      donation.deliveredAt = fields.deliveredAt || null;
      donation.deliveryNotes = fields.deliveryNotes || '';
      donation.pickupAddress = fields.pickupAddress;
      donation.location = fields.location;
      donation.photoUrl = fields.photoUrl;
      if (fields.status === 'picked_up' && plainDeliveryCode) {
        donation.deliveryCodeHash = codeHash;
        donation.deliveryCodeEncrypted = codeEncrypted;
      }
      await donation.save();
      log(`   ~ Reused/Updated donation: ${donation.foodName} [${donation.status}]`);
    }

    // Upsert associated PickupTask if claimed
    if (['accepted', 'picked_up', 'delivered'].includes(fields.status) && fields.claimedBy) {
      await PickupTask.findOneAndUpdate(
        { donation: donation._id },
        {
          $set: {
            donation: donation._id,
            volunteer: fields.claimedBy,
            status: fields.status === 'accepted' ? 'assigned' : fields.status,
            pickedUpAt: fields.pickedUpAt || null,
            deliveredAt: fields.deliveredAt || null,
            deliveryNotes: fields.deliveryNotes || '',
            beneficiariesServed: fields.status === 'delivered' ? fields.quantityMeals : 0,
            destination: {
              name: 'Community Relief Center',
              address: fields.pickupAddress.street
            }
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    seededDonationsCount++;
  }

  log('\n====================================================');
  log('   Demo Seeding Completed Successfully!             ');
  log('====================================================');
  log(`Total Demo Users: ${demoUsersConfig.length}`);
  log(`Total Demo Donations: ${seededDonationsCount}`);
  log(`Delivered Baseline Meals: 195 meals (120 + 75)`);
  log('====================================================\n');

  return {
    users: seededUsers,
    donationsCount: seededDonationsCount
  };
};

// Direct script execution
if (process.argv[1]?.endsWith('seed-demo.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDemoEnvironment();
    } catch (err) {
      console.error('\n❌ Seeding failed:', err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.connection.close();
      process.exit();
    }
  })();
}
