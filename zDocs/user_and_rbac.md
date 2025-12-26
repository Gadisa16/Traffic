## 🔐 Simplified & Secure Registration and Verification Flow (MVP-Ready)

### Core Principle

**Registration does not equal trust.**
All newly registered users are treated as **restricted users** until explicitly verified by an administrator.

---

## 1️⃣ Admin Registration Control (Web Admin)

### Registration Gate

* Introduce an environment variable:

  * `ALLOW_REGISTRATION=true | false`
* When `false`:

  * No new admin accounts can self-register
  * Only invitation or super-admin–created accounts are allowed
* When `true`:

  * Admins may register, but with **restricted access**

### Admin Account Status

* Newly registered admins:

  * Are **not treated as admins**
  * Have no write or management permissions
  * Can only view basic, non-sensitive information
* Only a **super admin or existing verified admin** can:

  * Approve the account
  * Assign the admin role
  * Activate full permissions

> **Recommendation:**
> For long-term safety, switch admin creation to **invitation-only** once the system is live.
> Self-registration for admins should be temporary and disabled after initial setup.

---

## 2️⃣ Improved Basic Registration Requirements

### Required Fields

Registration must collect:

* Email address
* Phone number
* Password (with strength requirements)

### Verification Requirement

* User must verify **at least one**:

  * Email **or**
  * Phone number
* Registration is incomplete until one is verified

### OTP Handling (MVP Phase)

* Use a fixed OTP (e.g. `123456`) for now
* Clearly mark this as **development-only**
* Structure the flow so real OTP services can be plugged in later without UI changes

---

## 3️⃣ Separate Registration Paths by Platform & Role

### Mobile App Registration (Inspector & Public Users)

#### Initial Registration

* Users register with:

  * Email or phone number
  * Strong password
* During registration, user selects:

  * **Ordinary User**
  * **Inspector**

---

### Ordinary Users (Public / Citizens)

* Access level:

  * Can scan a vehicle QR code or enter Side Number
  * See **limited public vehicle info** only:

    * Plate Number
    * Side Number
    * License validity (valid / expired)
* Must **not** see:

  * Owner name
  * Contact details
  * Internal notes
* No verification required beyond basic OTP

This allows:

* Public transparency
* Complaint and awareness use cases
* Zero security risk

---

### Inspector Registration Flow

#### Step 1: Restricted Access (Default)

* Inspector registers like any user
* Initially has **ordinary user permissions**
* Cannot perform inspections or access protected data

#### Step 2: “Verify Your Account” Flow

After registration, inspector can initiate verification by submitting:

* Official ID / badge
* Employment letter or authorization document
* Optional reference code from supervisor

Status becomes:

* **Pending Verification**

#### Step 3: Admin Review

* Admins review inspector submissions in the web admin
* Admin can:

  * Approve → inspector gains full inspection access
  * Reject → inspector remains restricted with feedback
* All decisions are logged

---

## 4️⃣ Role & Status Model (Simple and Clear)

Every user has:

* **Role**:

  * Ordinary User
  * Inspector
  * Admin
  * Super Admin
* **Status**:

  * Pending Verification
  * Active
  * Rejected
  * Disabled

Permissions depend on **both role and status**, never role alone.
---

### Final Recommendation

* **Admins:** invitation-only after bootstrap
* **Inspectors:** self-register → verify → approve
* **Public users:** limited access, no risk
* **Vehicles & inspections:** always admin-approved


## File Upload & Storage
The backend runs on Railway and must not store uploaded files locally or in Postgres. All photos and documents (IDs, vehicle images, verification files) should be uploaded to Supabase Storage (S3-compatible).

The database stores only file metadata (URL, path, owner, type, verification status).

Files are uploaded securely, access is restricted by user role, and admins can review, approve, or reject uploaded documents from the web admin UI.




**Architecture Prompt – Traffic Management System (MVP)**

Build the system using **Supabase as the primary backend platform**.

* Use **Supabase Postgres** for all structured data:

  * Users (admins, inspectors, ordinary users)
  * Vehicles (plate number, side number, model, status)
  * Owners
  * Licenses and inspection status
  * Audit fields (created_at, updated_at, verified_by)

* Use **Supabase Storage** for all files:

  * Vehicle photos (multiple angles)
  * Owner documents (ID, ownership proof)
  * Inspector verification documents
  * QR code images (generated server-side)

* **Do NOT store images/files in the database.**

  * Store only metadata: `file_path`, `bucket`, `entity_id`, `type`, `uploaded_at`.

* **Buckets**

  * `vehicle-photos` (private)
  * `owner-docs` (private)
  * `inspector-docs` (private)
  * `qr-codes` (private)

* **Security**

  * Frontend (web-admin & mobile) uses **Supabase anon key**
  * Backend uses **Supabase service role key** (never exposed)
  * Row Level Security (RLS) enforced on all tables
  * Only verified admins can approve users and vehicles

* **Auth model**

  * Registration can be toggled via `ALLOW_REGISTRATION`
  * New users default to **unverified / limited access**
  * Inspectors require admin approval after document submission
  * Ordinary users can only view public-safe vehicle data

* **Vehicle registration flow**

  1. Admin creates vehicle record
  2. Uploads vehicle photos
  3. Assigns owner and license info
  4. Backend generates a QR code containing vehicle ID
  5. QR image is stored in Supabase Storage
  6. Vehicle becomes scannable only after approval

* **Mobile inspector flow**

  * Scan QR → fetch inspector-safe vehicle view
  * Works online-first, offline shows last cached scan
  * No background sync required for MVP

* **Design goal**

  * Simple, secure, government-ready MVP
  * No premature complexity
  * Easy to migrate later if scale increases

---

If you want, next I can:

* Design the **exact vehicle registration form fields**
* Design the **database schema (tables + relations)**
* Explain **QR code generation in simple terms**
* Give you **RLS policy examples**
* Or turn this into a **system diagram (text-based)**






## 2️⃣ Supabase Storage Buckets

Create these **private** buckets:

* `vehicle-photos`
* `owner-docs`
* `inspector-docs`
* `qr-codes`

Rules:

* Frontend uploads → Supabase Storage
* Backend saves metadata → Postgres
* No public access, only signed URLs

---

## 3️⃣ Vehicle Registration Flow (Web Admin)

**Admin UI form fields**

**Step 1 – Vehicle Info**

* Plate Number
* Side Number (4 digits)
* Model
* Color
* License start date
* License expiry date

**Step 2 – Owner**

* Select existing owner
  OR
* Create new owner:

  * Full name
  * Phone
  * Address
  * National ID (upload)

**Step 3 – Photos**

* Front photo
* Side photo (must clearly show side number)
* Rear photo
* Optional extras

**Step 4 – Review & Save**

* Status defaults to `active`
* QR generated after save

---

## 4️⃣ QR Code (Simple MVP Explanation)

You don’t encode data directly.

Instead:

1. Backend generates a **random token**
2. Token is saved in `vehicles.qr_token`
3. QR code contains a URL like:

```
traffic.app/verify?token=abc123
```

4. Inspector scans QR
5. Backend finds vehicle by `qr_token`
6. Returns inspector-safe data

QR image is generated server-side and stored in:
`qr-codes/vehicle-{id}.png`

---

## 5️⃣ Access Rules (Important)

* ❌ Unverified admin → read-only, no mutations
* ❌ Inspector unverified → cannot scan and also don't have full access to data, he is just like a public user (ordinary users)
* ✅ Verified inspector → scan + history
* ✅ Admin verified → full access
* Ordinary users → public-safe fields only