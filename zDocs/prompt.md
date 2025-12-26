
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