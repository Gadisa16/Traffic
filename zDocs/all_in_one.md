```markdown

## 1️⃣ Prompt for **web-admin** (Admin Dashboard UI)

**Project Context**

This is the **Web Admin Dashboard** for a regional Traffic Management System serving the **Sidama Region (Hawassa city), Ethiopia**.
The dashboard is used by **transport authority administrators** to manage taxis, owners, licenses, inspections, and system data.

The UI must feel **official, professional, and trustworthy**, suitable for use by government staff and for presentation to stakeholders.

---

### Core Responsibilities

The admin dashboard must allow administrators to:

1. **Authenticate and access the system**

   * Secure login
   * Protected routes
   * Clear session state (logged in / logged out)

2. **Manage vehicles (taxis)**

   * View a paginated list of registered vehicles
   * View detailed vehicle information
   * Register new vehicles
   * Edit existing vehicle data
   * Soft-delete vehicles (move to Trash)
   * Restore or permanently purge deleted vehicles from a Trash page

3. **Manage vehicle owners**

   * Register owners
   * Associate owners with vehicles
   * View and update owner information
   * Ensure sensitive data is handled carefully and not overexposed in UI

4. **Manage license and renewal status**

   * Assign license start and expiry dates
   * Clearly show license status (valid, expiring soon, expired)
   * Provide visual indicators for urgency
   * Enable filtering by license status

5. **Dashboard overview**

   * High-level summary cards:

     * Total vehicles
     * Expiring soon
     * Expired
     * Deleted
   * Simple, readable data visualization (not complex charts)

6. **Empty, loading, and error states**

   * Empty lists should show intentional, professional empty-state screens
   * Loading states should be calm and non-blocking
   * Errors should be explained clearly and respectfully

---

### UI / Design Requirements

* The UI should blend **modern usability** with a **visual identity that resonates with Ethiopian culture**
* Use a color palette inspired by:

  * Ethiopian landscapes
  * Traditional textiles
  * Earth tones and natural contrasts
* Design should feel **official, calm, and structured**
* Avoid flashy or playful elements
* Consistent spacing, typography, and layout across all pages

#### Theme Support

* Support **Light and Dark themes**
* Dark theme should lean toward **dark blue tones**, not pure black
* Theme should be consistent across all admin pages

---

### UX Principles

* Clarity over cleverness
* Minimal clicks for common tasks
* Forms should guide users and prevent mistakes
* The UI should feel “ready for real-world use,” not experimental

---

## 2️⃣ Prompt for **mobile-inspector** (Inspector Mobile App)

**Project Context**

This is a **mobile application for transport inspectors** operating in the **Sidama Region (Hawassa city), Ethiopia**.

Inspectors use this app **in the field** to quickly verify taxis by scanning a QR code placed on the vehicle and reviewing its status.

The app must be **fast, reliable, and easy to use under real-world conditions**.

---

### Core Responsibilities

1. **Authentication**

   * Inspector login
   * Persisted session
   * Clear logout option

2. **QR Code scanning**

   * Scan a QR code attached to a taxi
   * Handle invalid or unreadable codes gracefully
   * Prevent accidental duplicate scans

3. **Vehicle verification**
   After scanning, display:

   * Plate number
   * Vehicle status
   * License validity (valid / expired / expiring)
   * Basic owner information (limited, inspector-safe view)
   * Any flags or warnings

4. **Offline and error handling**

   * Clear feedback when network is unavailable
   * Graceful handling of API errors
   * Never leave the user confused about what went wrong

5. **History / recent scans**

   * Show a simple list of recently scanned vehicles
   * Useful for inspectors during a shift

---

### UI / Design Requirements

* Designed for **outdoor, on-the-move usage**
* Large touch targets
* High contrast and readable typography

The UI should blend **modern mobile UX** with a **local Ethiopian identity**:

* Visual references inspired by:

  * Hawassa city
  * Sidama region culture
  * Transport and public service themes
* Use color palettes inspired by Ethiopian nature and textiles
* Avoid stereotypes or decorative excess

---

### Theme Support

* Support **Light and Dark themes**
* Dark theme should use **dark blue tones**
* Theme should follow system preference by default

---

### UX Principles

* Speed matters more than density
* One primary action per screen
* Clear success and failure feedback
* Inspectors should be able to use the app with minimal training

---

## 3️⃣ Prompt for **backend** (API & Business Logic)

**Project Context**

This is the **central backend system** for a Traffic Management platform serving the **Sidama Region (Hawassa city), Ethiopia**.

The backend acts as the **single source of truth** for all data and business rules and serves both:

* The web admin dashboard
* The mobile inspector app

---

### Core Responsibilities

1. **Authentication and authorization**

   * Authenticate users
   * Enforce role-based access (admin vs inspector)
   * Protect all sensitive endpoints

2. **Vehicle management**

   * Register vehicles using plate number as a unique identifier
   * Maintain full vehicle lifecycle
   * Support soft delete and permanent purge
   * Track vehicle status changes

3. **Owner management**

   * Store owner details securely
   * Associate owners with vehicles
   * Ensure sensitive fields are protected and controlled

4. **License and renewal tracking**

   * Store license start and expiry dates
   * Determine license status dynamically
   * Support queries for expiring and expired licenses

5. **Inspector verification flow**

   * Fetch vehicle data by QR code or identifier
   * Return inspector-safe views of data
   * Ensure fast response times for scan requests

6. **Data integrity and auditability**

   * Prevent invalid state transitions
   * Ensure consistent relationships between entities
   * Support migrations and schema evolution safely

---

### API Design Expectations

* Clear, predictable endpoints
* Consistent response formats
* Proper error handling with meaningful messages
* No business logic duplicated in clients

---

### Operational Expectations

* Environment-driven configuration
* Safe handling of migrations
* Ready for cloud deployment
* Structured in a way that supports future scale and regulation
* Comprehensive logging and monitoring hooks
```

 
To integrate the "Side Number" (**የጉን ቁጥር**) correctly across your three sub-projects, you can use these targeted prompts. They focus on the specific role this number plays in Ethiopian transport regulation.
---
### 1️⃣ For **web-admin** (Data Management)
**Prompt:** "Add a mandatory **'Side Number' (የጉን ቁጥር)** field to the vehicle management module. In Ethiopia, this is a 4-digit operational ID painted on the vehicle for public identification.
* **Schema:** Ensure it is stored as a unique string (allow leading zeros).
* **UI:** Include it in the vehicle registration form, table columns, and search filters.
* **Logic:** While the Plate Number is the legal ID, the Side Number is the primary reference for public complaints; ensure both are visible in 'Detailed View'."
### 2️⃣ For **mobile-inspector** (Field Verification)
**Prompt:** "Update the vehicle verification screen to prominently display the **'Side Number' (የጉን ቁጥር)**.
* **UX:** Since this number is large and painted on the side of the taxi, it is the first thing an inspector sees visually before scanning.
* **UI:** Display it in a high-contrast 'badge' or large typography next to the Plate Number so the inspector can quickly cross-check the physical vehicle against the digital record on their screen."
### 3️⃣ For **backend** (API & Logic)
**Prompt:** "Update the Vehicle entity to include a `side_number` field.
* **Validation:** It should be a 4-digit string.
* **Indexing:** Create a database index for `side_number` as it will be a high-frequency search term (often used by the public or dispatchers who don't have the full plate number).
* **API:** Ensure the 'Verify' endpoint supports lookups by either `plate_number` or `side_number` to accommodate manual entry if a QR code is damaged."
 
 You’re right to simplify. The advanced flow is good long-term, but for **MVP + production credibility**, a **controlled, gated registration** is the correct move.

Below is a **polished, realistic, and clean version** of your simplified approach, with a few small improvements added where they genuinely help. Nothing overengineered.

---

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

## 5️⃣ Why This Approach Works Well

* Secure without being complex
* Easy to explain to stakeholders
* Matches real government workflows
* Allows public transparency without data leaks
* Scales cleanly into stricter verification later
* Keeps admins fully in control

---

### Final Recommendation

* **Admins:** invitation-only after bootstrap
* **Inspectors:** self-register → verify → approve
* **Public users:** limited access, no risk
* **Vehicles & inspections:** always admin-approved

If you want next, I can:

* Convert this into **Copilot-ready prompts**
* Define **exact permission matrices**
* Help design the **verification UI screens**

 
what about the vehicles registration features Ui and backend please I want the detail form that include all fields like plate, side number, owner, model, multi photo upload (take photo) and any others needed for web-admin so that admin can register those vehicles and then generate qr code for that vehicles (i don't know how qr works since this is just MVP find some solution please)

 
// please finish all the left functionalities needed for inspector resgistration (authentication), vehicle registration, edit, delete, verification and qr code generation for web-admin, mobile-inspector and backend.