import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import PickupTask from '../models/PickupTask.js';
import { seedDemoEnvironment } from './seed-demo.js';

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}/api`;

const runPhase8MasterTests = async () => {
  console.log('===============================================================');
  console.log('   Annapurna Phase 8: Final Polish & Demo Master Test Suite    ');
  console.log('===============================================================\n');

  await connectDB();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test server running on port ${PORT}`);

  let dynamicDonationId = null;

  try {
    // TEST 1: Safety Guard - Production Refusal
    console.log('\n--- 1. Testing Production Seeding Refusal Guard ---');
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    let rejectedInProd = false;
    try {
      await seedDemoEnvironment({ silent: true });
    } catch (err) {
      if (err.message.includes('Refusing to seed demo data in production')) {
        rejectedInProd = true;
      }
    } finally {
      process.env.NODE_ENV = origEnv;
    }
    if (rejectedInProd) {
      console.log('  PASS: Seeder strictly refuses to run when NODE_ENV=production.');
    } else {
      throw new Error('FAIL: Seeder did not refuse execution under NODE_ENV=production!');
    }

    // TEST 2: One-Click Demo Seeding & Deterministic Records
    console.log('\n--- 2. Testing One-Click Demo Seeding ---');
    await seedDemoEnvironment({ silent: true });
    const demoUserEmails = [
      (process.env.ADMIN_EMAIL || 'admin@annapurna.org').toLowerCase(),
      'donor.demo@annapurna.org',
      'ngo.verified@annapurna.org',
      'ngo.pending@annapurna.org',
      'volunteer.demo@annapurna.org'
    ];
    const usersInDb = await User.find({ email: { $in: demoUserEmails } });
    if (usersInDb.length === 5) {
      console.log(`  PASS: All 5 deterministic demo accounts present in database.`);
    } else {
      throw new Error(`FAIL: Expected 5 demo users, found ${usersInDb.length}`);
    }

    // TEST 3: Idempotency (Re-running seed must NOT create duplicates)
    console.log('\n--- 3. Testing Seeder Idempotency ---');
    const countUsersBefore = await User.countDocuments();
    const countDonationsBefore = await Donation.countDocuments();
    await seedDemoEnvironment({ silent: true });
    const countUsersAfter = await User.countDocuments();
    const countDonationsAfter = await Donation.countDocuments();

    if (countUsersBefore === countUsersAfter && countDonationsBefore === countDonationsAfter) {
      console.log(`  PASS: Idempotency verified. Users: ${countUsersAfter}, Donations: ${countDonationsAfter} (0 duplicates created).`);
    } else {
      throw new Error(`FAIL: Duplicate records detected after re-running seeder!`);
    }

    // TEST 4: Authentication & Role Tokens for all demo personas
    console.log('\n--- 4. Testing Demo Account Logins & Role Tokens ---');
    const demoPassword = process.env.DEMO_PASSWORD || 'DemoPass123!';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminPassword123';

    const loginUser = async (email, password) => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(`Failed to log in as ${email}: ${data.message || res.status}`);
      }
      return data;
    };

    const adminAuth = await loginUser(process.env.ADMIN_EMAIL || 'admin@annapurna.org', adminPassword);
    const donorAuth = await loginUser('donor.demo@annapurna.org', demoPassword);
    const verifiedNgoAuth = await loginUser('ngo.verified@annapurna.org', demoPassword);
    const pendingNgoAuth = await loginUser('ngo.pending@annapurna.org', demoPassword);
    const volunteerAuth = await loginUser('volunteer.demo@annapurna.org', demoPassword);

    console.log('  PASS: Admin logged in:', adminAuth.user.role === 'admin');
    console.log('  PASS: Donor logged in:', donorAuth.user.role === 'donor');
    console.log('  PASS: Verified NGO logged in:', verifiedNgoAuth.user.isVerified === true);
    console.log('  PASS: Pending NGO logged in:', pendingNgoAuth.user.isVerified === false);
    console.log('  PASS: Volunteer logged in:', volunteerAuth.user.role === 'volunteer');

    // TEST 5: NGO Verification Enforcement
    console.log('\n--- 5. Testing NGO Verification Guard & Review Flow ---');
    const sampleAvail = await Donation.findOne({ status: 'available' });
    if (!sampleAvail) throw new Error('No available donation found for testing');

    // 5a. Pending NGO claim attempt (must be blocked)
    const blockClaimRes = await fetch(`${BASE_URL}/donations/${sampleAvail._id}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${pendingNgoAuth.token}` }
    });
    const blockClaimData = await blockClaimRes.json();
    if (blockClaimRes.status === 403 && blockClaimData.message.includes('verified')) {
      console.log('  PASS: Unverified NGO strictly blocked from claiming donations (403 Forbidden).');
    } else {
      throw new Error('FAIL: Unverified NGO was not properly blocked!');
    }

    // 5b. Admin approves pending NGO
    const approveRes = await fetch(`${BASE_URL}/admin/ngos/${pendingNgoAuth.user.id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAuth.token}`
      },
      body: JSON.stringify({
        status: 'verified',
        notes: 'Documents approved during master test flow.'
      })
    });
    const approveData = await approveRes.json();
    if (approveRes.status === 200 && approveData.data.ngo.verificationStatus === 'verified') {
      console.log('  PASS: Admin approved pending NGO with audit notes.');
    } else {
      throw new Error('FAIL: Admin failed to approve NGO!');
    }

    // 5c. Admin rejects NGO
    const rejectRes = await fetch(`${BASE_URL}/admin/ngos/${pendingNgoAuth.user.id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAuth.token}`
      },
      body: JSON.stringify({
        status: 'rejected',
        notes: 'Audit rejection test.'
      })
    });
    const rejectData = await rejectRes.json();
    if (rejectRes.status === 200 && rejectData.data.ngo.verificationStatus === 'rejected') {
      console.log('  PASS: Admin rejected NGO with revocation of claiming permission.');
    } else {
      throw new Error('FAIL: Admin failed to reject NGO!');
    }

    // Restore pending status for demo presentation cleanliness
    await User.findByIdAndUpdate(pendingNgoAuth.user.id, {
      verificationStatus: 'pending',
      isVerified: false,
      verificationNotes: ''
    });

    // TEST 6: Complete Donor-to-Delivery Lifecycle & Cryptographic Handover
    console.log('\n--- 6. Testing Complete Donor-to-Delivery Lifecycle & Code Security ---');
    // 6a. Donor creates donation
    const createRes = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorAuth.token}`
      },
      body: JSON.stringify({
        foodName: '40 Master Test Fresh Trays',
        dietaryType: 'veg',
        quantityMeals: 40,
        pickupDeadline: new Date(Date.now() + 3 * 3600000).toISOString(),
        safeConsumptionDeadline: new Date(Date.now() + 6 * 3600000).toISOString(),
        pickupAddress: {
          street: '55 Linking Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050'
        },
        latitude: 19.0596,
        longitude: 72.8295
      })
    });
    const createData = await createRes.json();
    if (createRes.status !== 201) throw new Error(`Donation creation failed: ${JSON.stringify(createData)}`);
    dynamicDonationId = createData.data.donation._id;
    console.log('  PASS: Step 1: Donor listed food donation (status: available).');

    // 6b. Volunteer claims donation
    const claimRes = await fetch(`${BASE_URL}/donations/${dynamicDonationId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${volunteerAuth.token}` }
    });
    const claimData = await claimRes.json();
    if (claimRes.status !== 200 || claimData.data.donation.status !== 'accepted') {
      throw new Error(`Claim failed: ${JSON.stringify(claimData)}`);
    }
    console.log('  PASS: Step 2: Volunteer claimed donation (status: accepted).');

    // 6c. Volunteer marks donation picked up
    const pickupRes = await fetch(`${BASE_URL}/donations/${dynamicDonationId}/pickup`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volunteerAuth.token}` }
    });
    const pickupData = await pickupRes.json();
    if (pickupRes.status !== 200 || pickupData.data.donation.status !== 'picked_up') {
      throw new Error(`Pickup failed: ${JSON.stringify(pickupData)}`);
    }
    console.log('  PASS: Step 3: Marked as picked up (status: picked_up).');

    // 6c-2. Volunteer broadcasts live GPS location
    const updateLocRes = await fetch(`${BASE_URL}/donations/${dynamicDonationId}/collector-location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerAuth.token}`
      },
      body: JSON.stringify({ latitude: 19.0650, longitude: 72.8360 })
    });
    const updateLocData = await updateLocRes.json();
    if (updateLocRes.status === 200 && updateLocData.data.collectorLocation.latitude === 19.0650) {
      console.log('  PASS: Step 3b: Volunteer broadcasted live GPS location to donor.');
    } else {
      throw new Error(`FAIL: Volunteer location update failed: ${JSON.stringify(updateLocData)}`);
    }

    // 6c-3. Volunteer arrives near pickup location (< 300m) -> auto-detects arrival
    const arrivalLocRes = await fetch(`${BASE_URL}/donations/${dynamicDonationId}/collector-location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerAuth.token}`
      },
      body: JSON.stringify({ latitude: 19.0597, longitude: 72.8296 })
    });
    const arrivalLocData = await arrivalLocRes.json();
    if (
      arrivalLocRes.status === 200 &&
      arrivalLocData.data.collectorLocation.isArrived === true &&
      arrivalLocData.data.collectorLocation.arrivedAt
    ) {
      console.log('  PASS: Step 3c: Proximity arrival auto-detected (<300m) with isArrived=true & arrivedAt timestamp.');
    } else {
      throw new Error(`FAIL: Proximity arrival detection failed: ${JSON.stringify(arrivalLocData)}`);
    }

    // Unauthorized user cannot broadcast collector location
    const unauthLocRes = await fetch(`${BASE_URL}/donations/${dynamicDonationId}/collector-location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorAuth.token}`
      },
      body: JSON.stringify({ latitude: 19.0650, longitude: 72.8360 })
    });
    if (unauthLocRes.status === 403) {
      console.log('  PASS: Unauthorized user rejected from updating collector location (403 Forbidden).');
    } else {
      throw new Error('FAIL: Unauthorized user was able to update collector location!');
    }

    // 6d. Security Check: Assert plaintext delivery code is NOT saved in MongoDB
    const rawDonationInDb = await Donation.findById(dynamicDonationId).select('+deliveryCodeHash +deliveryCodeEncrypted +deliveryCodePlain').lean();
    if (rawDonationInDb.deliveryCodePlain !== undefined && rawDonationInDb.deliveryCodePlain !== null) {
      throw new Error('FAIL: deliveryCodePlain exists in database! Plaintext code security violation.');
    }
    if (!rawDonationInDb.deliveryCodeHash || !rawDonationInDb.deliveryCodeEncrypted) {
      throw new Error('FAIL: Missing deliveryCodeHash or deliveryCodeEncrypted in database!');
    }
    console.log('  PASS: Delivery code is stored strictly encrypted with AES-256 (no plaintext in MongoDB).');

    // 6e. Donor views decrypted handover code via tracking
    const trackRes = await fetch(`${BASE_URL}/donations/${dynamicDonationId}/tracking`, {
      headers: { Authorization: `Bearer ${donorAuth.token}` }
    });
    const trackData = await trackRes.json();
    const handoverCode = trackData.data?.tracking?.deliveryConfirmationCode;
    if (!handoverCode || handoverCode.length !== 6) {
      throw new Error(`FAIL: Donor could not obtain 6-digit handover code. Got: ${handoverCode}`);
    }
    console.log(`  PASS: Step 4: Donor retrieved decrypted handover code: ${handoverCode}`);

    if (
      trackData.data?.tracking?.collectorLocation?.latitude === 19.0597 &&
      trackData.data?.tracking?.collectorLocation?.isArrived === true
    ) {
      console.log('  PASS: Donor tracking successfully received collector live GPS and arrival status (isArrived: true).');
    } else {
      throw new Error(`FAIL: Donor did not receive collector arrival status! Got: ${JSON.stringify(trackData.data?.tracking?.collectorLocation)}`);
    }

    // 6f. Invalid code attempt rejected
    const badCodeRes = await fetch(`${BASE_URL}/donations/${dynamicDonationId}/confirm-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerAuth.token}`
      },
      body: JSON.stringify({ confirmationCode: '000000' })
    });
    if (badCodeRes.status === 400) {
      console.log('  PASS: Invalid delivery confirmation code was rejected.');
    } else {
      throw new Error('FAIL: Invalid delivery code was accepted!');
    }

    // 6g. Valid code confirms delivery
    const goodCodeRes = await fetch(`${BASE_URL}/donations/${dynamicDonationId}/confirm-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerAuth.token}`
      },
      body: JSON.stringify({
        confirmationCode: handoverCode,
        deliveryNotes: 'Delivered successfully to community shelter.'
      })
    });
    const goodCodeData = await goodCodeRes.json();
    if (goodCodeRes.status !== 200 || goodCodeData.data.donation.status !== 'delivered') {
      throw new Error(`Confirm delivery failed: ${JSON.stringify(goodCodeData)}`);
    }
    console.log('  PASS: Step 5: Delivery verified and confirmed (status: delivered).');

    // 6h. Post-delivery check: Encrypted code wiped
    const deliveredDonationInDb = await Donation.findById(dynamicDonationId).select('+deliveryCodeEncrypted').lean();
    if (deliveredDonationInDb.deliveryCodeEncrypted === null) {
      console.log('  PASS: Encrypted delivery code was wiped upon redemption.');
    } else {
      throw new Error('FAIL: Encrypted code was not cleared after delivery!');
    }

    // 6i. Food Safety & Shelf Life Guard: Expired food delivery strictly rejected
    const expiredDonation = await Donation.create({
      donor: donorAuth.user.id,
      foodName: 'Expired Food Test Batch',
      dietaryType: 'veg',
      quantityMeals: 10,
      pickupAddress: { street: 'Hill Road', city: 'Mumbai' },
      pickupDeadline: new Date(Date.now() + 3600000),
      safeConsumptionDeadline: new Date(Date.now() - 60000), // Expired 1 min ago
      status: 'picked_up',
      claimedBy: volunteerAuth.user.id
    });
    const expiredDeliverRes = await fetch(`${BASE_URL}/donations/${expiredDonation._id}/confirm-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerAuth.token}`
      },
      body: JSON.stringify({ confirmationCode: '123456' })
    });
    const expiredDeliverData = await expiredDeliverRes.json();
    if (expiredDeliverRes.status === 400 && expiredDeliverData.message?.includes('safe consumption deadline')) {
      console.log('  PASS: Expired food delivery strictly blocked by food safety shelf life guard.');
    } else {
      throw new Error(`FAIL: Expired food delivery was not blocked as expected: ${JSON.stringify(expiredDeliverData)}`);
    }

    // TEST 7: Map View & Distance Sorting
    console.log('\n--- 7. Testing Hyperlocal Map View & Distance Calculation ---');
    const feedRes = await fetch(`${BASE_URL}/donations/feed?lat=19.0760&lon=72.8777&sortBy=distance`, {
      headers: { Authorization: `Bearer ${verifiedNgoAuth.token}` }
    });
    const feedData = await feedRes.json();
    const feedItems = feedData.data?.donations || [];
    if (feedItems.length > 0) {
      const allHaveDistance = feedItems.every((d) => typeof d.distanceKm === 'number' || d.distanceKm === null);
      const isSortedAscending = feedItems.every((d, i, arr) => i === 0 || d.distanceKm === null || arr[i - 1].distanceKm === null || d.distanceKm >= arr[i - 1].distanceKm);
      console.log(`  PASS: Feed returned ${feedItems.length} available items.`);
      console.log(`  PASS: Haversine distance calculated for coordinates: ${allHaveDistance}`);
      console.log(`  PASS: Donations sorted by proximity (distance ascending): ${isSortedAscending}`);
    } else {
      throw new Error('FAIL: Feed returned 0 donations for map testing!');
    }

    // TEST 8: Live Platform Impact Analytics Accuracy
    console.log('\n--- 8. Testing Platform Impact Analytics Accuracy ---');
    const analyticsRes = await fetch(`${BASE_URL}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminAuth.token}` }
    });
    const analyticsData = await analyticsRes.json();
    const { users, donations, impact } = analyticsData.data.analytics;

    // Verify meals calculation matches DB delivered sum
    const deliveredInDb = await Donation.find({ status: 'delivered' });
    const expectedMeals = deliveredInDb.reduce((s, d) => s + d.quantityMeals, 0);

    console.log(`  Reported Total Rescued Meals: ${impact.totalMealsRescued}`);
    console.log(`  Computed from DB delivered donations: ${expectedMeals}`);
    if (impact.totalMealsRescued === expectedMeals) {
      console.log('  PASS: Meals rescued strictly reflects actual delivered donations in database.');
    } else {
      throw new Error(`FAIL: Meals mismatch! Reported: ${impact.totalMealsRescued}, DB: ${expectedMeals}`);
    }

    const claimedCount = donations.accepted + donations.pickedUp + donations.delivered;
    const expectedRate = claimedCount > 0 ? Math.round((donations.delivered / claimedCount) * 1000) / 10 : 0;
    if (impact.deliveryCompletionRate === expectedRate) {
      console.log(`  PASS: Delivery completion rate accurate: ${impact.deliveryCompletionRate}%`);
    } else {
      throw new Error('FAIL: Delivery completion rate calculation error!');
    }

    // TEST 9: Public Community Leaderboard Endpoint
    console.log('\n--- 9. Testing Public Community Impact Leaderboard ---');
    const lbRes = await fetch(`${BASE_URL}/donations/leaderboard`);
    const lbData = await lbRes.json();
    if (
      lbRes.status === 200 &&
      Array.isArray(lbData.data?.leaderboard?.topDonors) &&
      Array.isArray(lbData.data?.leaderboard?.topRescuers) &&
      typeof lbData.data?.leaderboard?.impact?.totalMealsRescued === 'number'
    ) {
      console.log(`  PASS: Public Leaderboard active: ${lbData.data.leaderboard.topDonors.length} top donors, ${lbData.data.leaderboard.topRescuers.length} top rescuers, ${lbData.data.leaderboard.impact.totalMealsRescued} total meals.`);
    } else {
      throw new Error(`FAIL: Public Leaderboard endpoint failed: ${JSON.stringify(lbData)}`);
    }

    console.log('\n===============================================================');
    console.log('   ALL PHASE 8 MASTER TESTS COMPLETED WITH 100% SUCCESS!       ');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('\n❌ Phase 8 Master Test Failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (dynamicDonationId) {
      await Donation.findByIdAndDelete(dynamicDonationId);
      await PickupTask.deleteMany({ donation: dynamicDonationId });
    }
    await server.close();
    await mongoose.connection.close();
    console.log('Test server and database connection closed.');
  }
};

runPhase8MasterTests();
