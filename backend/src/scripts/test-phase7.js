import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import PickupTask from '../models/PickupTask.js';
import { ensureAdminExists } from './seed-admin.js';

const PORT = 5097;
const BASE_URL = `http://localhost:${PORT}/api`;

const runPhase7Tests = async () => {
  console.log('=== Phase 7: Admin Verification & Platform Impact Analytics Tests ===\n');

  await connectDB();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}\n`);

  let testDonorToken = '';
  let testNgoToken = '';
  let testAdminToken = '';
  let testNgoId = '';
  let testDonationId = '';
  let testDonation2Id = '';
  let adminUser = null;

  try {
    // 0. Ensure Admin account exists
    adminUser = await ensureAdminExists();
    console.log('✓ Admin provisioned or exists:', adminUser.email);

    // 1. Test Admin Role Hijacking Prevention via Public Registration
    console.log('\n--- 1. Testing Admin Escalation Prevention on Register ---');
    const fakeAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious User',
        email: `hacker_${Date.now()}@test.com`,
        password: 'password123',
        role: 'admin' // Attempting to register as admin
      })
    });
    const fakeAdminData = await fakeAdminRes.json();
    const registeredRole = fakeAdminData.user?.role;
    if (registeredRole !== 'admin' && registeredRole === 'donor') {
      console.log('  PASS: Admin role hijacking prevented. Assigned role coerced to:', registeredRole);
    } else {
      throw new Error(`FAIL: User was able to register with admin role! Got: ${registeredRole}`);
    }

    // 2. Register Donor and NGO for testing
    console.log('\n--- 2. Setting up Test Users ---');
    const donorRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase7 Test Donor',
        email: `donor_${Date.now()}@test.com`,
        password: 'password123',
        role: 'donor',
        organization: 'Phase7 Bakery'
      })
    });
    const donorData = await donorRes.json();
    testDonorToken = donorData.token;
    const donorId = donorData.user.id;

    const ngoEmail = `ngo_${Date.now()}@test.com`;
    const ngoRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase7 Hope Shelter',
        email: ngoEmail,
        password: 'password123',
        role: 'ngo',
        organization: 'Hope Care NGO',
        city: 'Mumbai',
        address: '101 Hope Lane, Bandra'
      })
    });
    const ngoData = await ngoRes.json();
    testNgoToken = ngoData.token;
    testNgoId = ngoData.user.id;
    console.log('  PASS: Created donor and unverified NGO. NGO status is:', ngoData.user.verificationStatus);

    // Login as Admin to get Admin Token
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@annapurna.org',
        password: process.env.ADMIN_PASSWORD || 'adminPassword123'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    testAdminToken = adminLoginData.token;
    console.log('  PASS: Admin logged in successfully.');

    // 3. Test Access Control on Admin Endpoints
    console.log('\n--- 3. Testing RBAC on Admin Endpoints ---');
    // Unauthenticated
    const unauthRes = await fetch(`${BASE_URL}/admin/ngos`);
    console.log('  Unauthenticated access status:', unauthRes.status, unauthRes.status === 401 ? 'PASS (401 Unauthorized)' : 'FAIL');

    // Authenticated as Donor
    const donorAdminRes = await fetch(`${BASE_URL}/admin/ngos`, {
      headers: { Authorization: `Bearer ${testDonorToken}` }
    });
    console.log('  Donor access to /api/admin/ngos:', donorAdminRes.status, donorAdminRes.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL');

    // Authenticated as Admin
    const adminAccessRes = await fetch(`${BASE_URL}/admin/ngos`, {
      headers: { Authorization: `Bearer ${testAdminToken}` }
    });
    const adminNgosData = await adminAccessRes.json();
    console.log('  Admin access to /api/admin/ngos:', adminAccessRes.status, adminAccessRes.status === 200 ? 'PASS (200 OK)' : 'FAIL');
    console.log('  Total NGOs returned to admin:', adminNgosData.results);

    // 4. Create sample donations
    console.log('\n--- 4. Creating Test Food Donations ---');
    const donRes = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDonorToken}`
      },
      body: JSON.stringify({
        foodName: '50 Hot Veg Meals',
        dietaryType: 'veg',
        quantityMeals: 50,
        pickupDeadline: new Date(Date.now() + 4 * 3600000).toISOString(),
        safeConsumptionDeadline: new Date(Date.now() + 6 * 3600000).toISOString(),
        pickupAddress: {
          street: '12 Linking Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050'
        },
        latitude: 19.0596,
        longitude: 72.8295
      })
    });
    const donData = await donRes.json();
    testDonationId = donData.data.donation._id;

    const don2Res = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDonorToken}`
      },
      body: JSON.stringify({
        foodName: '30 Sandwiches',
        dietaryType: 'veg',
        quantityMeals: 30,
        pickupDeadline: new Date(Date.now() + 3 * 3600000).toISOString(),
        safeConsumptionDeadline: new Date(Date.now() + 5 * 3600000).toISOString(),
        pickupAddress: {
          street: '45 SV Road, Andheri West',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400058'
        },
        latitude: 19.1136,
        longitude: 72.8697
      })
    });
    const don2Data = await don2Res.json();
    testDonation2Id = don2Data.data.donation._id;
    console.log('  PASS: Created 2 test donations.');

    // 5. Test Unverified NGO Claim Attempt (Must be rejected)
    console.log('\n--- 5. Testing Claim Restriction for Unverified NGO ---');
    const unverifiedClaimRes = await fetch(`${BASE_URL}/donations/${testDonationId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testNgoToken}` }
    });
    const unverifiedClaimData = await unverifiedClaimRes.json();
    console.log('  Claim by unverified NGO status:', unverifiedClaimRes.status);
    console.log('  Message:', unverifiedClaimData.message);
    if (unverifiedClaimRes.status === 403 && unverifiedClaimData.message.includes('verified')) {
      console.log('  PASS: Unverified NGO strictly blocked from claiming donations.');
    } else {
      throw new Error('FAIL: Unverified NGO was allowed to claim or did not return 403!');
    }

    // 6. Test Admin Approval of NGO
    console.log('\n--- 6. Testing Admin NGO Approval ---');
    const approveRes = await fetch(`${BASE_URL}/admin/ngos/${testNgoId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testAdminToken}`
      },
      body: JSON.stringify({
        status: 'verified',
        notes: 'Valid registration documents verified by Admin.'
      })
    });
    const approveData = await approveRes.json();
    console.log('  Approve status:', approveRes.status, approveRes.status === 200 ? 'PASS' : 'FAIL');
    const updatedNgo = approveData.data.ngo;
    console.log('  Updated verificationStatus:', updatedNgo.verificationStatus);
    console.log('  Updated isVerified:', updatedNgo.isVerified);
    console.log('  Verified by:', updatedNgo.verifiedBy?.email);
    console.log('  Verification notes:', updatedNgo.verificationNotes);
    if (updatedNgo.verificationStatus === 'verified' && updatedNgo.isVerified === true) {
      console.log('  PASS: NGO successfully verified with notes and admin audit trail.');
    } else {
      throw new Error('FAIL: NGO was not properly verified.');
    }

    // 7. Test Verified NGO Can Claim Donation
    console.log('\n--- 7. Testing Verified NGO Claim ---');
    const verifiedClaimRes = await fetch(`${BASE_URL}/donations/${testDonationId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testNgoToken}` }
    });
    const verifiedClaimData = await verifiedClaimRes.json();
    console.log('  Claim by newly verified NGO status:', verifiedClaimRes.status);
    if (verifiedClaimRes.status === 200 && verifiedClaimData.data.donation.status === 'accepted') {
      console.log('  PASS: Verified NGO claimed donation successfully.');
    } else {
      throw new Error(`FAIL: Verified NGO could not claim donation: ${JSON.stringify(verifiedClaimData)}`);
    }

    // 8. Test Admin Rejection of NGO
    console.log('\n--- 8. Testing Admin NGO Rejection ---');
    const rejectRes = await fetch(`${BASE_URL}/admin/ngos/${testNgoId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testAdminToken}`
      },
      body: JSON.stringify({
        status: 'rejected',
        notes: 'Expired 80G certificate.'
      })
    });
    const rejectData = await rejectRes.json();
    console.log('  Reject status:', rejectRes.status, rejectRes.status === 200 ? 'PASS' : 'FAIL');
    const rejectedNgo = rejectData.data.ngo;
    if (rejectedNgo.verificationStatus === 'rejected' && rejectedNgo.isVerified === false) {
      console.log('  PASS: NGO successfully rejected with revocation of verified status.');
    } else {
      throw new Error('FAIL: NGO was not properly rejected.');
    }

    // 9. Test Rejected NGO Claim Attempt (Must be rejected)
    console.log('\n--- 9. Testing Claim Restriction for Rejected NGO ---');
    const rejectedClaimRes = await fetch(`${BASE_URL}/donations/${testDonation2Id}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testNgoToken}` }
    });
    const rejectedClaimData = await rejectedClaimRes.json();
    console.log('  Claim by rejected NGO status:', rejectedClaimRes.status);
    if (rejectedClaimRes.status === 403 && rejectedClaimData.message.includes('verified')) {
      console.log('  PASS: Rejected NGO strictly blocked from claiming donations.');
    } else {
      throw new Error('FAIL: Rejected NGO was allowed to claim or did not return 403!');
    }

    // 10. Test Platform Impact Analytics & Rescued Meals Calculation
    console.log('\n--- 10. Testing Platform Impact Analytics ---');
    // First, let's complete delivery of testDonationId so we have delivered meals
    // Status transition: accepted -> picked_up -> delivered
    await fetch(`${BASE_URL}/donations/${testDonationId}/pickup`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testNgoToken}` }
    });
    const confirmRes = await fetch(`${BASE_URL}/donations/${testDonationId}/confirm-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testNgoToken}`
      },
      body: JSON.stringify({
        confirmationCode: '000000' // Bypasses or let's fetch the task code
      })
    });
    
    // To confirm delivery with correct code, let's grab the task
    const task = await PickupTask.findOne({ donation: testDonationId });
    if (task) {
      await fetch(`${BASE_URL}/donations/${testDonationId}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testNgoToken}`
        },
        body: JSON.stringify({
          confirmationCode: task.deliveryConfirmationCode
        })
      });
    }

    // Now call analytics overview
    const analyticsRes = await fetch(`${BASE_URL}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${testAdminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    console.log('  Analytics endpoint status:', analyticsRes.status, analyticsRes.status === 200 ? 'PASS' : 'FAIL');
    
    const { users, donations, impact, recentActivity } = analyticsData.data.analytics;
    console.log('  Total Users:', users.total);
    console.log('  NGOs Breakdown (pending/verified/rejected):', users.ngos);
    console.log('  Donations Breakdown:', donations);
    console.log('  Impact Metrics:', impact);
    console.log('  Recent Activity count:', recentActivity.length);

    // Verify meals calculation logic:
    // Only 'delivered' status donations must count towards totalMealsRescued
    const deliveredDonations = await Donation.find({ status: 'delivered' });
    const expectedMeals = deliveredDonations.reduce((sum, d) => sum + d.quantityMeals, 0);
    console.log('  Expected Meals strictly from delivered donations:', expectedMeals);
    console.log('  Analytics reported meals:', impact.totalMealsRescued);
    if (impact.totalMealsRescued === expectedMeals) {
      console.log('  PASS: Meals rescued strictly matches delivered donations sum.');
    } else {
      throw new Error(`FAIL: Rescued meals mismatch! Expected: ${expectedMeals}, Got: ${impact.totalMealsRescued}`);
    }

    // Verify delivery completion rate logic
    const claimedCount = donations.accepted + donations.pickedUp + donations.delivered;
    const expectedRate = claimedCount > 0 ? Math.round((donations.delivered / claimedCount) * 1000) / 10 : 0;
    console.log('  Expected Delivery Completion Rate:', expectedRate, '%');
    console.log('  Reported Delivery Completion Rate:', impact.deliveryCompletionRate, '%');
    if (impact.deliveryCompletionRate === expectedRate) {
      console.log('  PASS: Delivery completion rate formula is exact.');
    } else {
      throw new Error('FAIL: Delivery completion rate mismatch!');
    }

    console.log('\n ALL PHASE 7 TESTS PASSED SUCCESSFULLY! \n');
  } catch (err) {
    console.error('\n❌ Test failed with error:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup created test records
    console.log('Cleaning up test records...');
    if (testNgoId) await User.findByIdAndDelete(testNgoId);
    if (testDonationId) {
      await Donation.findByIdAndDelete(testDonationId);
      await PickupTask.deleteMany({ donation: testDonationId });
    }
    if (testDonation2Id) {
      await Donation.findByIdAndDelete(testDonation2Id);
      await PickupTask.deleteMany({ donation: testDonation2Id });
    }
    await server.close();
    await mongoose.connection.close();
    console.log('Server and DB connection closed.');
  }
};

runPhase7Tests();
