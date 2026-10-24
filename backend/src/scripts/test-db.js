import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User, Donation, PickupTask } from '../models/index.js';

const testDatabase = async () => {
  console.log('Testing MongoDB connection and models...');
  console.log('URI:', process.env.MONGODB_URI || 'mongodb+srv://amritkum360:7004343011@cluster0.3ssdupo.mongodb.net/annapurna');

  try {
    const conn = await connectDB();
    if (!conn) {
      console.log('\n❌ Could not establish database connection.');
      console.log('If you are using local MongoDB: make sure MongoDB Community Server or MongoDB service is started.');
      console.log('If you are using MongoDB Atlas: put your connection string in backend/.env:');
      console.log('  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/annapurna\n');
      process.exit(1);
    }

    console.log('\n Checking Mongoose Models Schema validation...');

    // Test User validation without saving to DB
    const testUser = new User({
      name: 'Test Donor',
      email: 'donor@example.com',
      password: 'testpassword123',
      role: 'donor',
      organization: 'Green Cafe'
    });
    await testUser.validate();
    console.log('  User model validation passed');

    // Test Donation validation
    const testDonation = new Donation({
      donor: new mongoose.Types.ObjectId(),
      foodName: '50 Fresh Lunch Meals',
      quantityMeals: 50,
      quantity: '50 boxed meals',
      foodType: 'cooked_meal',
      dietaryType: 'veg',
      pickupDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      safeConsumptionDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000),
      pickupAddress: {
        street: '12 Marine Drive',
        city: 'Mumbai'
      }
    });
    await testDonation.validate();
    console.log('  Donation model validation passed');

    // Test PickupTask validation
    const testTask = new PickupTask({
      donation: testDonation._id,
      volunteer: testUser._id
    });
    await testTask.validate();
    console.log('  PickupTask model validation passed');

    console.log('\n All Phase 1 models are valid and ready!');
  } catch (err) {
    console.error('\n❌ Test encountered an error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
};

testDatabase();
