# Traffic Management System - Multi-Component Prompt
* Public, no-auth landing for both web and mobile
* Anonymous vehicle verification (Option A)
* Controlled admin registration
* Inspector vs ordinary user registration flow
* Backend enforcing all rules

---

## 1️⃣ Prompt for **web-admin** (Admin Dashboard UI)

**Project Context**

This is the **Web Admin Dashboard** for a regional Traffic Management System serving the **Sidama Region (Hawassa city), Ethiopia**.

The system is a **public-service platform**. Some information is intentionally available **without authentication**, while sensitive operations are restricted to verified administrators.

The UI must feel **official, professional, and trustworthy**, suitable for government staff, auditors, and public-sector stakeholders.

---

### Core Responsibilities

The web application has **two major layers**:
a **public landing layer** and a **protected admin layer**.

#### 1. **Public landing (no authentication required)**

Any visitor can:

* View a public landing/dashboard page
* See high-level, non-sensitive information:

  * Total registered vehicles
  * Count of valid / expiring / expired licenses
* Search or verify a vehicle by:

  * QR code
  * Plate number
  * Side number
* View **minimal, public-safe vehicle data only**:

  * Plate number
  * Vehicle status
  * License validity
  * Expiry date (no owner identity, no documents)

This page must **not redirect to login by default**.

---

#### 2. **Authentication and access control (admin only)**

* Secure login for admins
* Protected routes for all management actions
* Clear session state (logged in / logged out)
* Registration behavior controlled by environment variable:

  * `ALLOW_REGISTRATION=true | false`

When registration is enabled:

* Newly registered users are **not admins by default**
* They have read-only, non-sensitive access
* Only verified admins or super-admins can:

  * Approve accounts
  * Assign admin roles
  * Activate full permissions

---

#### 3. **Vehicle management (admins only)**

Admins can:

* View a paginated list of vehicles
* View detailed vehicle records
* Register new vehicles
* Edit vehicle data
* Soft-delete vehicles (move to Trash)
* Restore or permanently purge vehicles from Trash

---

#### 4. **Owner management (admins only)**

* Register vehicle owners
* Associate owners with vehicles
* View and update owner details
* Ensure sensitive fields are hidden unless explicitly required

---

#### 5. **License and renewal management**

* Assign license start and expiry dates
* Display license status:

  * Valid
  * Expiring soon
  * Expired
* Clear visual indicators for urgency
* Filtering by license status

---

#### 6. **Dashboard overview**

* High-level summary cards:

  * Total vehicles
  * Valid
  * Expiring soon
  * Expired
  * Deleted
* Simple, readable visual summaries (no complex charts)

---

#### 7. **Empty, loading, and error states**

* Intentional empty states
* Calm loading indicators
* Clear, respectful error messages

---

### UI / Design Requirements

* Blend **modern usability** with **Ethiopian cultural identity**
* Colors inspired by:

  * Ethiopian landscapes
  * Sidama region textiles
  * Earth tones and natural contrast
* Design should feel:

  * Official
  * Calm
  * Structured
* Avoid playful or flashy UI elements
* Consistent spacing, typography, and layout

#### Theme Support

* Light and Dark themes
* Dark theme should use **dark blue tones**
* Consistent theme across public and admin sections

---

### UX Principles

* Public users should get value without friction
* Admin tasks should be efficient and deliberate
* Forms should prevent mistakes
* The system should feel production-ready and policy-aware

---

## 2️⃣ Prompt for **mobile-inspector** (Inspector & Public Mobile App)

**Project Context**

This is a **mobile application** used in the **Sidama Region (Hawassa city), Ethiopia**.

The app serves **two user types**:

* **Public / ordinary users** (no login required)
* **Transport inspectors** (verified, role-based access)

The app must work reliably **in the field**, often under time pressure.

---

### Core Responsibilities

#### 1. **Public (no authentication required)**

Any user can:

* Open the app without logging in
* Access a public landing screen
* Scan a vehicle QR code
* Search by plate or side number
* View **minimal, public-safe vehicle data**:

  * Plate number
  * Vehicle status
  * License validity
  * Expiry date

No owner identity, documents, or internal flags are shown.

---

#### 2. **Registration (mobile only)**

Users may optionally register.

During registration:

* User provides:

  * Email or phone number
  * Password
* User selects role via radio buttons:

  * **Ordinary User**
  * **Inspector**

If **Ordinary User**:

* Account is created immediately
* Access remains limited to public data

If **Inspector**:

* Additional fields appear:

  * Official ID / badge
  * Employment letter or proof
* Account status becomes **Pending Verification**
* Inspector privileges are **not granted** until admin approval

---

#### 3. **Inspector authentication**

For verified inspectors only:

* Secure login
* Persisted session
* Clear logout option

---

#### 4. **QR code scanning (primary inspector flow)**

* Fast QR scanning
* Graceful handling of invalid codes
* Duplicate scan prevention

---

#### 5. **Vehicle verification (inspector view)**

After scanning, inspectors see:

* Plate number
* Vehicle status
* License validity and expiry
* Limited owner info (inspector-safe)
* Flags or warnings (if any)

---

#### 6. **Offline and error handling**

* Clear offline indicators
* Queue scans when offline
* Sync automatically when back online
* Clear error messages

---

#### 7. **Recent scans**

* Simple list of recent scans
* Useful during inspections and shifts

---

### UI / Design Requirements

* Designed for outdoor use
* Large touch targets
* High contrast text

Visual identity:

* Inspired by:

  * Hawassa city
  * Sidama culture
  * Public transport and safety
* Ethiopian-inspired colors
* Clean, respectful visuals

---

### Theme Support

* Light and Dark themes
* Dark blue tones for dark mode
* Follow system preference by default

---

### UX Principles

* Public access first, no friction
* Inspector tools are fast and focused
* One main action per screen
* Minimal training required

---

## 3️⃣ Prompt for **backend** (API & Business Logic)

**Project Context**

This is the **central backend system** for a Traffic Management platform serving the **Sidama Region (Hawassa city), Ethiopia**.

It is the **single source of truth** and serves:

* Public users
* Mobile inspectors
* Web administrators

---

### Core Responsibilities

#### 1. **Authentication and authorization**

* Support anonymous (public) access for safe endpoints
* Role-based access:

  * Public
  * Ordinary user
  * Inspector (pending / verified)
  * Admin
  * Super admin
* Enforce permissions strictly at API level

---

#### 2. **Public vehicle verification (Option A)**

* Allow anonymous access to:

  * `/vehicles/verify`
* Return only non-sensitive fields:

  * Plate number
  * Status
  * License validity
  * Expiry date
* No owner identity or documents

---

#### 3. **User registration and lifecycle**

* Ordinary users: auto-approved
* Inspectors:

  * Require document submission
  * Start as `pending`
  * Become active only after admin approval
* Admin registration gated by `ALLOW_REGISTRATION`

---

#### 4. **Vehicle management**

* Plate number as unique identifier
* Full lifecycle support
* Soft delete and purge
* Status tracking

---

#### 5. **Owner management**

* Secure storage of owner data
* Strict control of sensitive fields
* Associations enforced by backend rules

---

#### 6. **License and renewal tracking**

* Store start and expiry dates
* Compute status dynamically
* Support expiring / expired queries

---

#### 7. **Inspector operations**

* Optimized read endpoints for fast scans
* Inspector-safe response schemas
* Logging of inspections (when authenticated)

---

#### 8. **Data integrity and auditability**

* Prevent invalid state transitions
* Track approvals and role changes
* Support migrations and schema evolution

---

### API Design Expectations

* Clear, predictable endpoints
* Separate public vs protected routes
* Consistent response formats
* Meaningful error messages
* No business logic in clients

---

### Operational Expectations

* Environment-driven configuration
* Safe migrations
* Cloud-ready deployment
* Designed for regulation, audits, and scale
* Structured logging and monitoring

---


can you also include things about side number please still keep the content unchanged except for side number and other important things you want to add and touch also as the admin and mobile registration is something different and user registered through mobile app can't be admin even if they are registering for first time. they can will be ordinary user or pending verification inspector if they add necessary data like Official ID/badge, employment letter from the authority (e.g., police department).
