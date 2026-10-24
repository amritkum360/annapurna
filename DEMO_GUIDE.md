# Annapurna — Save Food. Share Hope.
## Hackathon 3–5 Minute Judge Demo Guide

Annapurna is a hyperlocal food rescue web application that connects restaurants, wedding organizers, and individuals with surplus food to verified NGOs and community volunteers who distribute meals to people in need.

---

### Prerequisites & Setup

1. **Node.js**: v18+ (tested on Node.js v24 ESM)
2. **MongoDB**: Local MongoDB server on `mongodb://localhost:27017/annapurna` (or MongoDB Atlas URI set in `backend/.env`)

#### Step 1: Environment Configuration
Ensure `backend/.env` exists (copy from `backend/.env.example` if needed):
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/annapurna
JWT_SECRET=annapurna_super_secure_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@annapurna.org
ADMIN_PASSWORD=adminPassword123
DEMO_PASSWORD=DemoPass123!
```

#### Step 2: One-Click Demo Seeding
Run the idempotent demo seeder from the repository root:
```powershell
npm run seed:demo
```
> [!NOTE]
> Re-running `npm run seed:demo` is 100% idempotent; it refreshes expiration deadlines and never creates duplicate records or wipes real data.

#### Step 3: Start the Application
In terminal 1 (Backend):
```powershell
npm run dev:backend
```
In terminal 2 (Frontend):
```powershell
npm run dev:frontend
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

### Demo Accounts

| Role | Email | Password | Persona & Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@annapurna.org` | `adminPassword123` | Platform Trust, NGO Approval Queue & Impact Analytics |
| **Donor** | `donor.demo@annapurna.org` | `DemoPass123!` | Priya Sharma (Chef at The Grand Green Cafe) |
| **NGO (Verified)** | `ngo.verified@annapurna.org` | `DemoPass123!` | Rajesh Mehta (Hope Care Foundation) |
| **NGO (Pending)** | `ngo.pending@annapurna.org` | `DemoPass123!` | Sunita Patel (Care Meals Society - Awaiting verification) |
| **Volunteer** | `volunteer.demo@annapurna.org` | `DemoPass123!` | Aarav Verma (Hyperlocal Transport Volunteer) |

---

### 3–5 Minute Presentation Walkthrough

#### Act 1: Problem & Mission (Landing Page)
1. Navigate to **[http://localhost:5173](http://localhost:5173)**.
2. Highlight the tagline: **"Save Food. Share Hope."**
3. Point out the core challenge: Every day, tons of edible banquet and restaurant food goes to waste while nearby shelters face meal shortages. Annapurna solves this through hyperlocal coordination.

#### Act 2: Food Donor Flow (Listing Surplus with Map Pin)
1. Click **Sign In** and log in as Donor:
   - **Email**: `donor.demo@annapurna.org`
   - **Password**: `DemoPass123!`
2. You will be redirected to the **Donor Dashboard**.
3. Point out the live metrics: Active Listings, Completed Deliveries, and Total Meals Rescued.
4. Click **+ Create Food Donation**:
   - Food Name: `25 Boxed Biryani Meals`
   - Dietary: `Vegetarian`
   - Meals: `25`
   - Pickup Deadline: `2 hours from now`
   - Safe Consumption: `5 hours from now`
   - Address: `Bandra West, Mumbai`
   - **Map Pin**: Notice the interactive map selector. Click anywhere on the map or click **📍 Detect My Location** to set exact coordinates.
5. Click **Publish Food Listing**. The item appears instantly with a live 4-step status tracker.

#### Act 3: Discovery & Hyperlocal Map View (Collector Experience)
1. Open an incognito browser window or log out and log in as Volunteer:
   - **Email**: `volunteer.demo@annapurna.org`
   - **Password**: `DemoPass123!`
2. On the **Volunteer Dashboard**, explore the **Discovery Feed**:
   - Filter by Dietary Type (`Vegetarian`, `Vegan`).
   - Switch to **Map View**: Show interactive Leaflet/OpenStreetMap markers with pickup details.
   - Click **Use My Location** or select a reference city (`Mumbai`) to demonstrate Haversine distance calculations (e.g. `1.2 km away`).
3. Click **Claim Food** on the newly published donation. Notice it transitions atomically to **Accepted** and moves to the **My Pickups** tab.
4. In the **My Pickups** tab:
   - Point out the **Small Map Preview** embedded directly on the pickup card.
   - Click **🔍 Make Big** to open the full-screen interactive modal with Google Maps direction links.

#### Act 4: Live Location Tracking & Delivery Confirmation
1. In the **My Pickups** tab, click **📡 Broadcast My Live Location**:
   - Volunteer shares their live GPS coordinates with the server.
2. In the **Donor** window, click **🛰️ Track Live Location**:
   - An interactive live tracking modal opens, displaying the **Pickup Location pin**, the **Collector's Live Location pin**, a connecting route line, and last-updated timestamp.
3. On the volunteer card, click **Mark as Picked Up**:
   - Notice status changes to **In Transit**.
   - A cryptographic 6-digit code is generated and stored encrypted at rest with AES-256 (no plaintext stored in database).
4. Switch back to the **Donor** screen and click **🔄 Refresh**:
   - The donor's card updates to **Picked Up** and displays the yellow handover code box: `🔑 Delivery Handover Code: XXXXXX`.
5. Switch back to the **Volunteer** screen:
   - Under **Confirm Delivery**, enter the 6-digit code from the donor.
   - Enter distribution note: *"Handed over 25 meals to local shelter."*
   - Click **Verify & Confirm Delivery**.
   - The mission is marked **Delivered** and meals rescued count updates immediately!

#### Act 5: Trust Layer, NGO Verification & Impact Analytics (Platform Admin)
1. Log in as Admin:
   - **Email**: `admin@annapurna.org`
   - **Password**: `adminPassword123`
2. Arrive at the **Admin Dashboard**:
   - **Impact Metrics**: Show **Meals Rescued** (calculated strictly from delivered donations), **Completion Rate**, and **Active Listings**.
   - **NGO Verification Queue**:
     - View `ngo.pending@annapurna.org` in the **Pending** tab.
     - Explain security: Unverified NGOs are strictly blocked from claiming food until verified.
     - Click **Approve**, type *"Valid 80G registration certificate verified"*, and confirm approval.
     - The NGO status updates to **Verified** with an admin audit trail.

---

### Troubleshooting

- **MongoDB connection refused**:
  Make sure MongoDB Community Server is started (`mongod`) or update `MONGODB_URI` in `backend/.env`.
- **Port 5000 in use**:
  Update `PORT=5001` in `backend/.env` and `VITE_API_BASE_URL=http://localhost:5001/api` in `frontend/.env`.
- **Reset Demo Data**:
  Run `npm run seed:demo` at any time. It updates records safely without dropping your database.
- **Run All Automated Tests**:
  ```powershell
  npm test
  ```
