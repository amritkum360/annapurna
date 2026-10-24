# 🍲 Annapurna (अन्नपूर्णा) — Save Food. Share Hope.

> **Hyperlocal Real-Time Food Rescue & Community Hunger Relief Platform**  
> *Connecting restaurants, caterers, hotels, and citizens with verified NGOs and volunteer rescuers to eliminate food waste and fight hunger.*

---

## 🌟 Overview

Globally, over **40% of produced food is wasted** while millions face food insecurity. Traditional donation methods suffer from slow response times, lack of verified transport, food safety hazards, and trust deficits between donors and charities.

**Annapurna** solves this with an end-to-end, trustworthy, real-time rescue lifecycle:
- **Food Donors** easily publish surplus fresh meals via an intuitive multi-step wizard.
- **Verified NGOs & Volunteers** discover available food nearby using interactive Leaflet maps and Haversine distance filters.
- **Rapido / Delivery-style Live Tracking** with arrival detection (<300m) keeps donors informed as collectors arrive.
- **Cryptographic AES-256 OTP Handover** guarantees physical pickup verification before redemption.
- **Food Safety Shelf-Life Guards** prevent distribution of spoiled or expired food.
- **Official 80G CSR Impact Certificates & Public Leaderboard** recognize donors and rescue partners.

---

## 🚀 Key Features

### 1. 📋 Multi-Step Donation Creation Wizard
- Seamless 3-step creation flow preventing form fatigue:
  1. **Food Details**: Name, dietary classification (Vegetarian, Non-Veg, Vegan), quantity & meals count.
  2. **Timing & Safety**: Pickup window and safe consumption shelf-life deadline.
  3. **Location & Review**: Address with geocoding, preview, and confirmation.

### 2. 🗺️ Hyperlocal Discovery & Map View
- Interactive **Leaflet Map** with custom pins for pickup locations.
- **Proximity Filtering**: Straight-line distance sorting (`Within 10 km, 25 km, 50 km`).
- **"Use My Location"** one-click browser GPS positioning.

### 3. 🛡️ Trust & Governance (Admin Verification Layer)
- Strict access control: unverified NGOs are strictly barred from claiming food.
- Admin review dashboard with audit notes, verification approvals, and revocations.
- User Profile Inspector: view detailed contact info, address, verified credentials, and complete rescue mission activity log.

### 4. 🚚 Real-Time Tracking & Arrival Detection
- Embedded mini-map on cards and full-screen live tracking modal.
- Proximity detection automatically notifies donor when the collector is within 300 meters (`🎉 Collector Arrived`).
- One-click phone call button to connect donors and collectors instantly.

### 5. 🔐 Cryptographic Handover & Food Safety
- **AES-256 Encrypted OTP**: 6-digit confirmation code generated on donor's device, securely verified upon physical handover, and wiped post-redemption (never stored in plaintext).
- **Rapido-style OTP Boxes**: Auto-advancing small numeric input cells with paste support.
- **Safe Shelf-Life Guard**: If safe consumption time expires, delivery is permanently locked to prevent food poisoning.

### 6. 📄 Downloadable 80G Impact Certificates & Public Leaderboard
- Formal **Certificate of Social Impact & Meal Rescue** with estimated CO₂e emissions prevented.
- Optimized for printing (`🖨️ Print / Save as PDF`) under Section 80G CSR guidelines.
- **Public Community Leaderboard ("Wall of Fame")** ranking Top Donors and Top Rescuers.
- Social sharing to **WhatsApp, LinkedIn, and X (Twitter)** with one-click citation copying.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Bootstrap 5, Leaflet, React Router v6, Oxlint
- **Backend**: Node.js, Express.js (ES Modules), Mongoose, MongoDB
- **Security**: AES-256-CBC Encryption, JWT Authentication, Bcrypt Password Hashing, Role-Based Route Guards
- **Theming**: Aesthetic Warm Bisque (`#fbf3ea`) + Deep Forest Green (`#1b4332`), Clean White Cards, Floating Toast Notifications

---

## 👥 Deterministic Demo Accounts

Pre-configured accounts are available for one-click hackathon evaluation:

| Persona | Email | Password | Role & Permissions |
|---|---|---|---|
| **Platform Admin** | `admin@annapurna.org` | `adminPassword123` | Platform oversight, NGO approvals, audit logs |
| **Food Donor** | `donor.demo@annapurna.org` | `DemoPass123!` | Hotel/Restaurant, creates donations & tracks delivery |
| **Verified NGO** | `ngo.verified@annapurna.org` | `DemoPass123!` | Relief Organization, claims & distributes food |
| **Pending NGO** | `ngo.pending@annapurna.org` | `DemoPass123!` | Awaiting admin verification review |
| **Volunteer** | `volunteer.demo@annapurna.org` | `DemoPass123!` | Crowdsourced collector & delivery partner |

---

## 💻 Quickstart & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017` (or set `MONGODB_URI` in `.env`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/amritkum360/annapurna.git
cd annapurna

# Install root, backend, and frontend packages
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment
```bash
# Backend environment setup
cp backend/.env.example backend/.env
```

### 3. Seed Demo Data
```bash
npm run seed:demo
```

### 4. Start Development Servers
```bash
# Starts backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Verification

Run the master test suite (covering production guards, idempotency, lifecycle handover, and analytics accuracy):

```bash
# Run master integration test suite
npm test

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## 📜 License
Licensed under the [MIT License](LICENSE).  
*Annapurna — Save Food. Share Hope.*
