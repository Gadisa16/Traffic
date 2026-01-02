## 🔐 Simplified & Secure Registration and Verification Flow (MVP-Ready)

### Core Principle

**Registration does not equal trust.**
All newly registered users are treated as **restricted users** until explicitly verified by an administrator.

---

## 1️⃣ Admin Registration Control (Web Admin)
-  I want web-admin to have its own registration flow separate from mobile app (inspector app) registration flow. So only web-admin page should have admin registration flow and mobile app (inspector app) should not have admin registration flow. I want to have an environment variable called `ALLOW_REGISTRATION` which can be set to true or false. If it is set to false no new admin accounts can self-register on web-admin page, only invitation or super-admin created accounts are allowed. If it is set to true admins may register but with restricted access. Newly registered admins are not treated as admins and have no write or management permissions they can only view basic non-sensitive information. Only a super admin or existing verified admin can approve the account, assign the admin role and activate full permissions. For long-term safety I recommend switching admin creation to invitation-only once the system is live. Self-registration for admins should be temporary and disabled after initial setup.

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
* During registration, user must selects:
  * **Ordinary User**
  * **Inspector**
  so for this I want two radio buttons on registration screen so that user on mobile-inspectors app can select his role, if he selects ordinary user he will have limited access as public user, if he selects inspector there will be a next fields to fill-out to register this user as inspector like Official ID/badge, employment letter from the authority (e.g., police department). I don't want users to simply get regsitered as inspector without verification. I don'w want to consider this user as inspector if he just selects inspector role on registration screen without submitting required documents for verification. So I want to have a separate flow for inspector registration after he selects inspector role on registration screen. If he provides required documents for verification his status will be pending verification until admin approves his account. If he selects ordinary user role on registration screen he will be registered as ordinary user with limited access to public vehicle info only.
  I don't want user users rgistered on mobile expo (inspector app) to have admin access to web admin panel weather they are registered for first time or not they will always be ordinary user or inspector if registered. Only verified admins who registered through web-admin page app should have access to web admin panel and that is even when verified by super-admin or existing verified admin. 

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

* Inspector registers like any ordinary user
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

Soft delete everywhere
Vehicles, users, docs → never hard delete by default.




## Overall Product Behavior (Option A – Public First)

Both **mobile-inspector** and **web-admin** are **public-first applications**.

No user should be forced to log in or register just to:

* open the app
* view general information
* scan a vehicle QR code
* verify a vehicle’s basic status

Authentication exists only when a user wants **more privileges**, not for basic usage.

---

## 1️⃣ First Experience (No Login Required)

### Entry Point for Everyone

When a user opens either:

* the **mobile app**, or
* the **web app**

they land on a **public landing/dashboard**, not a login screen.

### Public Landing Page Shows

Safe, non-sensitive, read-only information such as:

* Total registered vehicles
* Vehicles with:

  * valid licenses
  * expiring licenses
  * expired licenses
* A clear **“Verify a Vehicle”** entry point

No owner names, phone numbers, IDs, or documents are visible.

This immediately establishes:

* trust
* transparency
* ease of use
* public-service mindset

---

## 2️⃣ Public Vehicle Verification (No Auth)

### Mobile App

Any user can:

* open the scanner
* scan a QR code
* or manually enter plate / side number

### Web App

Any user can:

* search by plate number or side number
* view a simple verification result

### Public Verification Result Shows Only:

* Side Number (የጉን ቁጥር)
* Plate number
* Vehicle status (Active / Expired / Suspended)
* License expiry date (date only)
* Simple warning flags if applicable

### Explicitly NOT Shown:

* Owner name
* Phone number
* Address
* Uploaded documents
* Inspection history
* Internal notes

This makes QR codes usable by:

* police
* passengers
* dispatchers
* the general public

without weakening security.

---

## 3️⃣ Mobile App: Registration Paths (Optional, Role-Based)

Registration is **optional**, not mandatory.

### Registration Screen (Mobile Only)

Users see two radio options:

* **Ordinary User**
* **Inspector**

#### Ordinary User Flow

* Registers with:

  * email or phone
  * password
* Account is immediately active
* Access remains **public-level only**
* They can:

  * scan vehicles
  * verify basic status
* They cannot:

  * see sensitive data
  * submit inspections
  * upload evidence

This is essentially a “signed public user.”

---

### Inspector Flow (Gated & Verified)

Selecting **Inspector** does **not** grant inspector access.

Instead, it triggers a **second verification step**.

#### Inspector Registration Steps

1. Basic registration (same as ordinary user)
2. Inspector verification screen appears:

   * Upload official ID / badge
   * Upload employment letter or authority document
   * Optional reference code
3. Submit for review

#### Inspector Account State

* Status: **Pending Verification**
* Until approved:

  * behaves exactly like an ordinary user
  * no inspection privileges
  * no sensitive data access

#### After Admin Approval

* Role is upgraded to **Inspector**
* Gains access to:

  * inspection submission
  * photo uploads
  * inspector-level vehicle data

This prevents fake inspectors and keeps authority control intact.

---

## 4️⃣ Web Admin: Controlled Registration Model

### Public Web Landing

The web app also has a **public landing page**:

* same verification capabilities as mobile
* same public data rules
* no admin features exposed

---

### Admin Registration Gate

Admin access is **never public by default**.

An environment flag controls admin registration:

```
ALLOW_REGISTRATION=true | false
```

#### When `ALLOW_REGISTRATION = false`

* No self-registration allowed
* Only:

  * super admin
  * or existing verified admin
    can create new admin accounts (invitation or manual)

This is the recommended production mode.

---

#### When `ALLOW_REGISTRATION = true`

* Admins can register themselves
* BUT:

##### Newly Registered Admins:

* Are **not treated as admins**
* Have:

  * no write permissions
  * no approval rights
  * no access to sensitive data
* Can only view:

  * basic dashboards
  * public-level vehicle info

##### Activation Requires:

* Approval by:

  * super admin
  * or verified admin
* Explicit role assignment

Until approved, they are effectively **read-only users**.

---

## 5️⃣ Mental Model (Very Important)

Think of the system as **three concentric circles**:

### Public (No Auth)

* Vehicle verification
* Public stats
* Transparency

### Registered Users

* Ordinary users
* Pending inspectors
* Slightly enhanced UX
* Still no sensitive data

### Privileged Roles

* Inspectors (verified)
* Admins (approved)
* Full operational access

No one jumps directly to the inner circle.
Everyone starts public, then optionally registers, then must be verified/approved for more access.












## 1. What **“ቦሎ ኢድሳት”** means and what it is

**English meaning:**
**“Periodic Vehicle Inspection”** or **“Roadworthiness Inspection”**

**What it is:**
It’s the **official technical inspection** a vehicle must pass to prove it’s safe and fit to be on the road. In Ethiopia, this inspection is done periodically (often yearly) and covers things like:

* Brakes
* Lights
* Tires
* Steering
* Emissions / smoke
* Overall mechanical safety

It always has:

* An **issue date**
* An **expiry date**
* A clear **valid / expired** status

So in a system, it behaves exactly like a **time-based compliance document**, similar to insurance or license validity.

### Status logic (your idea makes sense)

* **Green** → Valid (more than 3 months remaining)
* **Yellow** → Expiring soon (≤ 3 months remaining)
* **Red** → Expired (0 days remaining)

That’s a very intuitive, professional UX choice.

---

## 2. Short implementation notes / prompt for the 3 ideas

You can copy-paste this as a design or dev note.

---

### Feature Notes / Prompt

1. **Vehicle Inspection (ቦሎ ኢድሳት)**

   * Add a “Periodic Vehicle Inspection” field when registering a vehicle
   * Store:

     * Inspection issue date
     * Inspection expiry date
   * Automatically compute status:

     * Green: more than 3 months remaining
     * Yellow: 3 months or less remaining
     * Red: expired
   * Status should be clearly visible on vehicle detail, list pages and also mobile inspector app when scanning a vehicle QR code.

2. **Multiple owners per vehicle**

   * Allow a vehicle to be linked to **multiple owners**
   * Enable this both ways:

     * Assign multiple users to one vehicle
     * Assign one vehicle to multiple users
   * Define one owner as **primary** (optional but recommended)

3. **Chassis number requirement**

   * Make **chassis number mandatory** during vehicle registration
   * Treat it as a unique identifier
   * Display it prominently on vehicle details since it represents the vehicle’s true identity

I also want vehicle list page on mobile inspector app to have a filter by inspection status (ቦሎ ኢድሳት ሁኔታ በመሰረት መገምገሚያ), vehicle plate number, side number so that inspector can easily find vehicles with expired inspection or expiring soon inspection for follow-up actions or maybe just to go through existing vehicles.
---





That makes sense, and it’s a good UX choice.

Here’s a short, clear note you can add to your feature prompt:

---

### Plate number letter selection

* When registering a vehicle, split the plate number input into two parts:

  * **Plate letter**: selectable from a dropdown (e.g. A, B, C, … based on Ethiopian plate standards)
  * **Plate number**: numeric input
* Combine both values when saving (e.g. `A-123456`).
* Store the combined value as the official plate number, but keep the letter and number logically separated in the UI for clarity and validation.
* Ensure the dropdown is required if the plate letter is part of the selected plate type.

---


### Plate type support (Private, Commercial, Government, etc.)

* **Vehicle registration**

  * Add a required **Plate Type** dropdown when registering a vehicle.
  * Options:

    * Private
    * Commercial
    * Government
    * Other (with optional description field)
  * Store this value as a structured field (enum/string), not part of the plate number itself.

* **Vehicle detail page**

  * Display plate type clearly alongside:

    * Plate number
    * Chassis number
    * Owner(s)
  * Use a badge or label so it’s visually distinct and easy to scan.

* **Vehicle list / management page**

  * Add **filter by Plate Type**.
  * Allow combining with existing filters (owner, status, inspection, etc.).
  * On mobile: dropdown filter with single selection.


- user flow is still not fully implemented, I want user flow and rbac to be fully implemented the things like inspector registration flow including uploading uploading of verification documents on mobile, and then i want the notification to be received on web-admin admin so that admin can check the request including inspectors documents and then approve or reject the inspector registration request. I also want the rbac to be fully implemented so that only verified inspectors can access inspector features on mobile app including scanning vehicle qr code and then viewing inspection history and submitting inspection reports including uploading photos as evidence. I also want ordinary users to have limited access to public vehicle info only when they scan vehicle qr code or enter plate number/side number on mobile app. I also want admin registration flow to be fully implemented on web-admin page including the environment variable and also when user registered as admin first I want them to stay without any permission until previously verified admins come and approve that and also I want the invitation functionality to work so that verified admins can invite new admins to register themselves. And also for things like plate number and others that must to be unique I want the validation to be fully implemented so that no duplicate entries can be made in the system.

## please use file /zDocs/user_and_rbac.md as reference for user flow, rbac implementation and others


// since many things are already done focus on left things and first finish with inspector registration flow, notifications on web admin, approval process  and such funcitonalities