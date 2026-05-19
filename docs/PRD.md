# AutoPart Intelligence — Product Requirements Document (PRD)
**Version:** 1.0 — MVP
**Date:** 2026-05-18
**Status:** Draft
**Owner:** Product Team

---

## TABLE OF CONTENTS

1. [Product Overview](#1-product-overview)
2. [MVP Epics](#2-mvp-epics)
3. [User Stories](#3-user-stories)
4. [User Flows](#4-user-flows)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Out of Scope (MVP)](#6-out-of-scope-mvp)
7. [Glossary](#7-glossary)

---

## 1. PRODUCT OVERVIEW

### 1.1 Problem Statement

The automotive aftermarket parts industry operates with massive catalogs — hundreds of thousands of SKUs, complex vehicle-part compatibility matrices, and technical documentation scattered across PDFs, spreadsheets, and proprietary systems. Today:

- **Workshops and mechanics** waste 15–30 minutes per repair order searching for the right part across multiple catalogs, calling suppliers, and cross-referencing vehicle specs manually.
- **Auto parts stores** manage compatibility data in Excel files or outdated desktop software with no web interface, no self-service for customers, and no analytics on search demand.
- **Consumers** have no reliable, self-service way to look up what fits their specific vehicle (make, model, year, engine variant) without calling a store.

The result: lost sales, diagnostic errors, wrong parts ordered, and high return rates.

**AutoPart Intelligence solves this** by providing a modern SaaS platform where auto parts businesses can manage their parts catalog, map compatibility to vehicles, and give mechanics and end-consumers a fast, reliable search experience — all in a single web application.

### 1.2 Target Users

| Persona | Role | Primary Need |
|---------|------|-------------|
| **Workshop Mechanic** | End-user / searcher | Find the right part for a specific vehicle fast, with confidence |
| **Auto Parts Store Staff** | Admin / catalog manager | Manage parts inventory, upload technical docs, control compatibility data |
| **Store Owner / Manager** | Admin / business owner | Subscription management, usage analytics, team access control |
| **Consumer / DIY Enthusiast** | End-user / searcher | Self-service part lookup by vehicle without calling a store |

### 1.3 Success Metrics (KPIs)

#### Acquisition
- 100 active paying accounts within 90 days of launch
- 40% of trial accounts convert to paid plan within 14-day trial window

#### Engagement
- Average search session: mechanic finds a compatible part in < 3 clicks
- Catalog completeness: stores upload >= 500 parts within 30 days of onboarding
- Search success rate: >= 85% of searches return at least 1 result (no dead-ends)

#### Retention
- Monthly churn rate < 5% for paid accounts
- Net Promoter Score (NPS) >= 40 after 60 days

#### Operational
- Search response time: p95 < 2 seconds
- System uptime: >= 99.5% monthly
- Zero data loss incidents

---

## 2. MVP EPICS

| Epic ID | Title | Priority |
|---------|-------|---------|
| EPIC-001 | Authentication & User Management | Critical |
| EPIC-002 | Parts Catalog Management | Critical |
| EPIC-003 | Vehicle Catalog Management | Critical |
| EPIC-004 | Compatibility System | Critical |
| EPIC-005 | Search & Discovery | Critical |
| EPIC-006 | Media Management | High |
| EPIC-007 | Subscription & Plans | High |
| EPIC-008 | Admin Dashboard & Analytics | Medium |

---

## 3. USER STORIES

---

### EPIC-001: Authentication & User Management

**Description:** Secure registration, login, and user profile management for all platform roles. Supports multi-tenant architecture where each account (store/business) is an isolated tenant with its own data, users, and subscription.

**Business Value:** Foundation for all personalized and gated features. Controls who can manage catalog data vs. who can search. Enables billing attribution.

---

**US-001-01: User Registration**
As a store owner, I want to create an account with my business name, email, and password, so that I can start managing my parts catalog on the platform.

Acceptance Criteria:
- [ ] Registration form captures: full name, business name, email, password, password confirmation
- [ ] Email must be unique — duplicate email shows clear error message
- [ ] Password must be minimum 8 characters, at least 1 uppercase, 1 number
- [ ] On success, system sends a verification email to the registered address
- [ ] Account is inactive until email is verified
- [ ] Unverified accounts cannot log in — show prompt to resend verification

Priority: High
Estimated: S

---

**US-001-02: Email Verification**
As a newly registered user, I want to verify my email address via a link sent to my inbox, so that my account is activated and secure.

Acceptance Criteria:
- [ ] Verification email is sent within 60 seconds of registration
- [ ] Verification link expires in 24 hours
- [ ] Clicking valid link activates account and logs user in automatically
- [ ] Clicking expired link shows error with option to resend
- [ ] Resend verification option is available on login page for unverified accounts
- [ ] Max 3 resend attempts per hour per email to prevent abuse

Priority: High
Estimated: S

---

**US-001-03: User Login**
As a registered user, I want to log in with my email and password, so that I can access my account and the platform features.

Acceptance Criteria:
- [ ] Login form requires email and password
- [ ] Invalid credentials show generic error: "Email or password incorrect" (no enumeration)
- [ ] After 5 consecutive failed attempts, account is locked for 15 minutes
- [ ] Successful login redirects to the dashboard
- [ ] "Remember me" checkbox extends session to 30 days (default session: 8 hours)
- [ ] Login page is accessible at `/login`

Priority: High
Estimated: S

---

**US-001-04: Password Recovery**
As a user who forgot my password, I want to receive a reset link via email, so that I can regain access to my account.

Acceptance Criteria:
- [ ] "Forgot password" link on login page
- [ ] User enters email — system always shows success message (no enumeration of registered emails)
- [ ] Reset email sent if email exists in system, within 60 seconds
- [ ] Reset link expires in 1 hour
- [ ] New password must meet same strength requirements as registration
- [ ] After successful reset, all other sessions are invalidated
- [ ] Used reset links cannot be reused

Priority: High
Estimated: S

---

**US-001-05: User Profile Management**
As a logged-in user, I want to update my profile information (name, email, password), so that my account reflects current details.

Acceptance Criteria:
- [ ] Profile page accessible from user menu
- [ ] Can update: full name, business name, phone number
- [ ] Email change requires password confirmation and sends re-verification to new email
- [ ] Password change requires current password + new password + confirmation
- [ ] Changes save immediately on submit with success confirmation
- [ ] Phone number field is optional and validates E.164 format if provided

Priority: Medium
Estimated: S

---

**US-001-06: Role-Based Access Control**
As a store owner (admin), I want to invite team members with different roles (Admin, Editor, Viewer), so that I can control what each person can do in the system.

Acceptance Criteria:
- [ ] Roles defined: Admin (full access), Editor (catalog + media CRUD), Viewer (read-only + search)
- [ ] Admin can invite users by email from Settings > Team page
- [ ] Invitation email sent with registration link pre-tied to the account
- [ ] Invited users who don't have an account are prompted to create one on invite acceptance
- [ ] Admin can change any team member's role at any time
- [ ] Admin can deactivate (not delete) team members
- [ ] Deactivated users lose access immediately
- [ ] Account owner role cannot be changed or deactivated except by themselves

Priority: High
Estimated: M

---

**US-001-07: Logout**
As a logged-in user, I want to log out of the platform, so that my session is securely terminated.

Acceptance Criteria:
- [ ] Logout option in user menu (top right)
- [ ] Logout invalidates the server-side session immediately
- [ ] After logout, browser is redirected to login page
- [ ] Back button after logout does not restore authenticated state
- [ ] If session expires naturally, user is redirected to login with "Session expired" message

Priority: High
Estimated: XS

---

### EPIC-002: Parts Catalog Management

**Description:** Full CRUD for parts. Admin users manage their parts inventory: create, update, organize, and deactivate parts. Each part has structured attributes (part number, name, brand, category, description, technical specs) and can be linked to vehicle compatibility data.

**Business Value:** Core data foundation of the platform. Without a well-structured parts catalog, search and compatibility features cannot function. Quality of catalog data directly drives search success rate.

---

**US-002-01: Create New Part**
As a catalog editor, I want to add a new part to the catalog with all relevant details, so that it becomes searchable and can be mapped to compatible vehicles.

Acceptance Criteria:
- [ ] Create part form captures: part number (required, unique per account), name (required), brand, category, subcategory, description, weight, dimensions (L×W×H), OEM reference numbers (multiple), internal notes
- [ ] Part number uniqueness validated on submit (within account scope)
- [ ] Category and subcategory fields are dropdown selects populated from system taxonomy
- [ ] OEM references field accepts multiple values (add/remove chips)
- [ ] On save, part is created with status "Active" by default
- [ ] Success confirmation shown; user offered to "Add another" or "View part"

Priority: High
Estimated: M

---

**US-002-02: Edit Part Details**
As a catalog editor, I want to edit any field on an existing part, so that I can correct errors or add missing information.

Acceptance Criteria:
- [ ] All fields editable post-creation except part number (requires special action)
- [ ] Part number edit requires confirmation modal: "Changing part number may break compatibility links. Proceed?"
- [ ] All changes are saved atomically (all or nothing)
- [ ] Last modified timestamp and user updated on save
- [ ] Edit history log accessible to Admins showing field, old value, new value, user, timestamp

Priority: High
Estimated: M

---

**US-002-03: Deactivate / Reactivate Part**
As a catalog admin, I want to deactivate a part without deleting it, so that it stops appearing in search results while preserving historical data.

Acceptance Criteria:
- [ ] Deactivate action available from part detail page and catalog list (bulk action)
- [ ] Deactivated parts do NOT appear in public-facing search results
- [ ] Deactivated parts remain visible in admin catalog with "Inactive" badge
- [ ] Deactivated parts' compatibility mappings are preserved but not surfaced in search
- [ ] Admin can reactivate with one click
- [ ] Bulk deactivate available: select multiple parts + "Deactivate selected"

Priority: Medium
Estimated: S

---

**US-002-04: Browse & Filter Parts Catalog (Admin)**
As a catalog editor, I want to browse all parts in my catalog with filters and pagination, so that I can find and manage specific parts efficiently.

Acceptance Criteria:
- [ ] Catalog list shows: part number, name, brand, category, status, last modified, media count, compatibility count
- [ ] Filter by: status (Active/Inactive/All), category, brand, has media (yes/no), has compatibility (yes/no)
- [ ] Sort by: part number, name, brand, last modified (asc/desc)
- [ ] Pagination: 25/50/100 results per page, configurable
- [ ] Search within admin catalog by part number or name (instant, client-side filtering for loaded page)
- [ ] Export catalog to CSV (all fields, current filter applied)

Priority: High
Estimated: M

---

**US-002-05: Bulk Import Parts via CSV**
As a catalog admin, I want to import multiple parts at once from a CSV file, so that I can migrate existing inventory data without manual entry.

Acceptance Criteria:
- [ ] Upload page provides downloadable CSV template with all required/optional columns and example row
- [ ] Uploaded CSV validated before import: required columns present, part number format, duplicate detection
- [ ] Validation report shown before commit: N rows valid, M rows with errors (listed with row number + error)
- [ ] Admin can proceed with valid rows only, or cancel entirely
- [ ] Import runs asynchronously for large files (> 100 rows); status shown in progress indicator
- [ ] On completion, summary: X created, Y skipped (duplicates), Z failed
- [ ] Max file size: 10MB; max rows: 10,000 per import

Priority: Medium
Estimated: L

---

**US-002-06: Part Categories Management**
As an admin, I want to manage the parts taxonomy (categories and subcategories), so that the catalog is consistently organized.

Acceptance Criteria:
- [ ] Category management page accessible under Settings > Catalog
- [ ] Create, rename, and deactivate categories and subcategories
- [ ] Deactivating a category with active parts prompts: "X parts use this category. Reassign before deactivating."
- [ ] Categories displayed as tree (category > subcategory, max 2 levels for MVP)
- [ ] Default system categories provided at account creation (Braking, Engine, Suspension, Electrical, Transmission, Exhaust, Cooling, Body, etc.)

Priority: Medium
Estimated: M

---

### EPIC-003: Vehicle Catalog Management

**Description:** Full CRUD for vehicles. Vehicles are structured hierarchically: Make → Model → Year → Engine/Trim variant. This hierarchy is the foundation for compatibility mapping. Admins can build their vehicle database from scratch or import standard vehicle data.

**Business Value:** The vehicle catalog enables the most critical user flow — a mechanic or consumer specifying their vehicle to find compatible parts. Without a rich, accurate vehicle database, the compatibility feature has no value.

---

**US-003-01: Create Vehicle Make**
As a catalog editor, I want to add a vehicle make (brand/manufacturer), so that I can build out the vehicle hierarchy for compatibility mapping.

Acceptance Criteria:
- [ ] Create make form: name (required), country of origin, logo upload (optional)
- [ ] Make name must be unique (case-insensitive) within the account
- [ ] On save, make is immediately available for model creation
- [ ] Makes list sorted alphabetically by default

Priority: High
Estimated: XS

---

**US-003-02: Create Vehicle Model**
As a catalog editor, I want to add a vehicle model under a specific make, so that I can specify the model-level hierarchy for compatibility.

Acceptance Criteria:
- [ ] Model form: make (required, dropdown), model name (required), body type (Sedan, SUV, Hatchback, Pickup, Van, Coupe, Convertible, Wagon — select), segment (optional: subcompact, compact, mid-size, full-size, luxury)
- [ ] Model name must be unique within the selected make
- [ ] Model immediately available for year/trim creation

Priority: High
Estimated: XS

---

**US-003-03: Create Vehicle Year/Trim**
As a catalog editor, I want to add specific year and engine/trim variants for a model, so that I can map parts to the exact vehicle specification.

Acceptance Criteria:
- [ ] Trim form: make (required), model (required, filtered by make), production year from (required, 4-digit), production year to (optional — for multi-year spans), engine displacement (e.g. 1.6, 2.0), fuel type (Gasoline/Diesel/Hybrid/Electric/Flex), engine code (optional), trim name (optional, e.g. "Sport", "Base", "Limited"), transmission type (Manual/Automatic/CVT/DCT)
- [ ] Year "from" cannot exceed current year + 2
- [ ] Year "to" must be >= year "from" if provided
- [ ] Multiple trims can exist for same make/model/year combination (different engines)
- [ ] Each trim gets a unique system-generated vehicle ID

Priority: High
Estimated: M

---

**US-003-04: Browse Vehicle Catalog (Admin)**
As a catalog editor, I want to browse all vehicles in the system with filters, so that I can find vehicles to edit or to use for compatibility mapping.

Acceptance Criteria:
- [ ] List view: make, model, year range, engine, fuel type, trim, compatibility count
- [ ] Filter by: make, model, year, fuel type
- [ ] Hierarchical tree view alternative: expand make → models → year/trims
- [ ] Search within vehicle catalog by any field
- [ ] Export vehicle list to CSV

Priority: High
Estimated: M

---

**US-003-05: Edit and Deactivate Vehicle Entry**
As a catalog editor, I want to edit vehicle details or deactivate obsolete entries, so that the vehicle database stays accurate.

Acceptance Criteria:
- [ ] All fields editable for any trim entry
- [ ] Deactivating a trim warns: "X parts are mapped to this vehicle. Mappings will be hidden from search."
- [ ] Deactivated trims hidden from search and compatibility dropdowns
- [ ] Deactivated trims visible in admin with "Inactive" badge
- [ ] Edit log maintained (same pattern as parts)

Priority: Medium
Estimated: S

---

**US-003-06: Bulk Import Vehicles via CSV**
As a catalog admin, I want to bulk import vehicle data from a CSV, so that I can quickly populate the vehicle database without manual entry for each make/model/trim.

Acceptance Criteria:
- [ ] CSV template downloadable with headers: make, model, year_from, year_to, engine_displacement, fuel_type, engine_code, trim_name, transmission
- [ ] Validation before commit with error report by row
- [ ] Duplicate detection: same make+model+year+engine+trim combination flagged
- [ ] Import creates Makes and Models automatically if they don't exist
- [ ] Same async handling and size limits as parts import (US-002-05)

Priority: Medium
Estimated: L

---

### EPIC-004: Compatibility System

**Description:** Mapping engine between parts and vehicles. Editors define which parts fit which vehicle trims. The system supports one-to-many (one part compatible with many vehicles) and many-to-one (many parts compatible with one vehicle) relationships.

**Business Value:** This is the differentiating feature of the platform. It transforms a flat parts list into an intelligent fitment guide — the core reason mechanics and stores pay for the product.

---

**US-004-01: Add Vehicle Compatibility to a Part**
As a catalog editor, I want to add one or more vehicle trims to a part's compatibility list, so that the part shows up when mechanics search by vehicle.

Acceptance Criteria:
- [ ] Compatibility management accessible from part detail page ("Compatibility" tab)
- [ ] Add vehicle form: make (dropdown) → model (filtered dropdown) → year range (from/to) → engine variants (multi-select from matching trims)
- [ ] Year range filter auto-suggests matching trims from vehicle catalog
- [ ] Multiple vehicles can be added in a single session (add more button before saving)
- [ ] Each compatibility entry shows: make, model, year range, engine, trim name
- [ ] Duplicate check: adding an already-mapped vehicle shows warning, not error
- [ ] On save, compatibility is immediately live for search

Priority: High
Estimated: M

---

**US-004-02: Remove Compatibility Mapping**
As a catalog editor, I want to remove a vehicle from a part's compatibility list, so that incorrect or outdated mappings don't mislead users.

Acceptance Criteria:
- [ ] Each entry in compatibility list has a Remove button
- [ ] Removal requires confirmation: "Remove compatibility for [Vehicle]? This may affect search results."
- [ ] Bulk remove: select multiple entries + "Remove selected"
- [ ] Removal is soft-delete (logged, recoverable by admin within 30 days)
- [ ] Removal takes effect immediately in search

Priority: High
Estimated: S

---

**US-004-03: View All Parts Compatible with a Vehicle (Admin)**
As a catalog editor, I want to see all parts mapped to a specific vehicle, so that I can audit compatibility coverage and identify gaps.

Acceptance Criteria:
- [ ] Accessible from vehicle detail page: "Compatible Parts" tab
- [ ] Lists all active parts mapped to that vehicle trim with: part number, name, brand, category
- [ ] Filter by category within the compatible parts list
- [ ] Export compatible parts for that vehicle to CSV
- [ ] Shows count: "42 parts compatible with this vehicle"

Priority: Medium
Estimated: S

---

**US-004-04: Compatibility Coverage Report**
As a store admin, I want to see which vehicles in my catalog have zero compatible parts, so that I can prioritize completing the compatibility mappings.

Acceptance Criteria:
- [ ] Report page accessible from Admin Dashboard
- [ ] Table: vehicle (make/model/year/trim), parts mapped count, last mapping added
- [ ] Filter: zero parts only, < 5 parts only, > X parts
- [ ] Sort by parts count ascending (surfaces gaps first)
- [ ] Export to CSV

Priority: Low
Estimated: M

---

**US-004-05: Bulk Compatibility Import via CSV**
As a catalog admin, I want to import compatibility mappings from a CSV file, so that I can load existing fitment data without manual entry for thousands of records.

Acceptance Criteria:
- [ ] CSV format: part_number, make, model, year_from, year_to, engine_displacement, fuel_type, engine_code (optional)
- [ ] System resolves part_number to part ID and vehicle fields to vehicle trim ID
- [ ] Unresolvable references listed in validation report as errors (e.g. "Part ABC-123 not found")
- [ ] Valid rows can be imported despite errors in other rows (proceed with valid option)
- [ ] Duplicate mappings silently skipped with count in summary
- [ ] Max 50,000 rows per import file
- [ ] Async processing with progress indicator

Priority: Medium
Estimated: L

---

### EPIC-005: Search & Discovery

**Description:** The end-user-facing search experience. Mechanics and consumers can search by part number for direct lookups, or browse by vehicle (make → model → year → engine) to discover all compatible parts. Results are filterable and paginated. This is the primary value delivery surface for non-admin users.

**Business Value:** The reason mechanics and consumers use the product. Search quality and speed directly determine whether users return and recommend the platform.

---

**US-005-01: Search by Part Number**
As a workshop mechanic, I want to type a part number and immediately see the matching part with full details, so that I can quickly confirm I have the right part for the job.

Acceptance Criteria:
- [ ] Global search bar prominent on the main search page and in the header
- [ ] Partial part number search supported (prefix and contains matching)
- [ ] Also matches against OEM reference numbers stored on parts
- [ ] Results appear within 2 seconds of submitting search
- [ ] Each result shows: part number, name, brand, category, thumbnail (if available), compatibility count
- [ ] Clicking a result opens the part detail page
- [ ] If zero results: "No parts found for [query]" with suggested actions
- [ ] Search is scoped to the authenticated user's account (no cross-tenant data leakage)

Priority: High
Estimated: M

---

**US-005-02: Search by Vehicle (Guided Selector)**
As a workshop mechanic, I want to select my customer's vehicle step-by-step (make → model → year → engine) and see all compatible parts, so that I find the right parts without knowing part numbers.

Acceptance Criteria:
- [ ] Vehicle selector is a cascading dropdown/stepper: Make → Model → Year → Engine/Trim
- [ ] Each step filters the next step's options dynamically (no invalid combinations)
- [ ] Year selector shows range: "2018–2022" (collapsed year spans)
- [ ] Engine step shows: displacement + fuel type + engine code (if available)
- [ ] After selecting all vehicle parameters, results page shows all compatible active parts
- [ ] Results grouped by category (Braking, Engine, Suspension, etc.)
- [ ] Result count shown: "127 parts found for 2020 Toyota Corolla 2.0 Flex"
- [ ] Vehicle selection persisted in URL for sharing/bookmarking

Priority: High
Estimated: L

---

**US-005-03: Filter Search Results**
As a user viewing search results, I want to filter by category, brand, and other attributes, so that I can narrow down results to what I'm looking for.

Acceptance Criteria:
- [ ] Filter panel visible on results page (sidebar on desktop, drawer on mobile)
- [ ] Filters: Category (multi-select with counts), Brand (multi-select with counts), Has technical document (yes/no), Has image (yes/no)
- [ ] Filters are additive (AND logic between different filters, OR within same filter type)
- [ ] Active filters shown as dismissible chips above results
- [ ] "Clear all filters" button
- [ ] Filter state persisted in URL query parameters
- [ ] Results update in < 1 second after applying filter (client-side if all results loaded, server-side for large sets)

Priority: High
Estimated: M

---

**US-005-04: Part Detail Page (Public)**
As a user who found a part in search results, I want to see full details about the part, so that I can confirm it's the right part before ordering.

Acceptance Criteria:
- [ ] Part detail page accessible via direct URL (`/parts/{part-number}`)
- [ ] Displays: part number, name, brand, category, description, dimensions, weight, OEM references
- [ ] Image gallery: shows uploaded images (thumbnails + full-size lightbox)
- [ ] Technical documents: list of uploaded PDFs with download links
- [ ] Compatible vehicles list: make, model, year range, engine — paginated if > 10 entries
- [ ] "Back to results" breadcrumb navigation
- [ ] Page title and meta description populated for SEO (within tenant context)

Priority: High
Estimated: M

---

**US-005-05: Save / Bookmark Parts**
As a workshop mechanic, I want to save parts I've looked up to a personal list, so that I can quickly find them again during a repair session without re-searching.

Acceptance Criteria:
- [ ] "Save" button on part detail page and search result cards
- [ ] Saved parts stored per user account (not per tenant)
- [ ] "Saved Parts" page accessible from user menu
- [ ] Saved parts list shows: part number, name, brand, saved date
- [ ] Remove from saved list with one click
- [ ] Max 100 saved parts per user (soft limit with warning at 80%)

Priority: Low
Estimated: S

---

**US-005-06: Recent Searches**
As a returning user, I want to see my recent search queries and vehicle selections, so that I can quickly repeat common lookups.

Acceptance Criteria:
- [ ] Last 10 searches displayed on search page when search bar is focused
- [ ] Each item shows: query or vehicle spec + timestamp
- [ ] Click to re-execute search
- [ ] Clear search history option
- [ ] History stored client-side (localStorage) — no server persistence for MVP

Priority: Low
Estimated: XS

---

### EPIC-006: Media Management

**Description:** Upload, organize, and serve images and PDF documents attached to parts. Images are used in the search results gallery. PDFs serve as technical documentation (installation guides, spec sheets, technical bulletins).

**Business Value:** Technical documentation is a key differentiator vs. generic catalogs. Mechanics trust and prefer platforms where they can download the installation guide or spec sheet directly. Images reduce returns by giving buyers visual confirmation.

---

**US-006-01: Upload Part Images**
As a catalog editor, I want to upload images for a part, so that mechanics and consumers can visually confirm they're selecting the right component.

Acceptance Criteria:
- [ ] Image upload accessible from part detail page > Media tab
- [ ] Accepted formats: JPG, PNG, WebP
- [ ] Max file size per image: 10MB
- [ ] Max images per part: 10
- [ ] Drag-and-drop upload zone + click-to-browse fallback
- [ ] Multiple images uploadable in a single operation
- [ ] Upload progress bar per file
- [ ] Uploaded images auto-processed to generate: thumbnail (200×200px), medium (800×600px), original preserved
- [ ] First uploaded image set as "primary" automatically; editor can reorder to set a different primary
- [ ] Images displayed in gallery on part detail page

Priority: High
Estimated: M

---

**US-006-02: Upload Technical Documents (PDF)**
As a catalog editor, I want to upload PDF documents to a part, so that mechanics can download installation guides and spec sheets.

Acceptance Criteria:
- [ ] PDF upload accessible from part detail page > Media tab
- [ ] Accepted format: PDF only
- [ ] Max file size per PDF: 25MB
- [ ] Max PDFs per part: 5
- [ ] Each PDF requires a label/name field (e.g. "Installation Guide", "Technical Bulletin", "Spec Sheet")
- [ ] Label is editable after upload
- [ ] PDF upload triggers virus scan (async); file marked "processing" until scan complete
- [ ] PDF available for download immediately after scan passes
- [ ] Files that fail scan are quarantined and admin notified
- [ ] PDFs not publicly accessible — require authenticated user or signed URL

Priority: High
Estimated: M

---

**US-006-03: Delete Media Files**
As a catalog editor, I want to delete images or PDFs from a part, so that I can remove outdated or incorrect files.

Acceptance Criteria:
- [ ] Delete button on each media item with confirmation prompt
- [ ] On image delete: thumbnail, medium, and original all removed from storage
- [ ] If primary image is deleted, next image in order becomes primary automatically
- [ ] Deletion is permanent (no recycle bin for media files)
- [ ] Deleted files removed from CDN within 5 minutes (cache invalidation)

Priority: Medium
Estimated: S

---

**US-006-04: Media Storage Quotas**
As a store admin, I want to see how much storage my account is using, so that I can manage media usage and understand plan limits.

Acceptance Criteria:
- [ ] Storage usage displayed in Settings > Account: used / total GB with progress bar
- [ ] Per-plan storage limits: Free 1GB, Starter 10GB, Professional 50GB, Enterprise unlimited
- [ ] When account reaches 80% of limit: warning banner in admin dashboard
- [ ] When account reaches 100%: new uploads blocked with error message and upgrade prompt
- [ ] Storage calculated in near real-time (< 5 min lag)

Priority: Medium
Estimated: S

---

**US-006-05: Bulk Media Download**
As a catalog admin, I want to download all media files for a specific part as a ZIP, so that I can back up or migrate media assets.

Acceptance Criteria:
- [ ] "Download all media" button on part detail page > Media tab
- [ ] ZIP generated server-side with all images (originals) and PDFs
- [ ] ZIP named: `{account_slug}_{part_number}_media.zip`
- [ ] Download link valid for 15 minutes after generation
- [ ] ZIP generation triggered asynchronously; user notified via in-app notification when ready

Priority: Low
Estimated: M

---

### EPIC-007: Subscription & Plans

**Description:** Subscription plan management for accounts. Defines feature tiers, limits, and billing model. For MVP, billing integration is minimal — plan assignment managed by admin internally, with self-service upgrade flow.

**Business Value:** Core monetization mechanism. Defines the commercial model and gates feature access by plan tier.

---

**US-007-01: View Available Plans**
As a prospective or existing customer, I want to see a clear comparison of subscription plans and their features, so that I can choose the right plan for my business.

Acceptance Criteria:
- [ ] Plans page accessible without authentication at `/plans`
- [ ] 4 plans for MVP: Free, Starter, Professional, Enterprise
- [ ] Comparison table showing per-plan: price/month, parts limit, vehicle catalog size, storage quota, team members, search API access, support level
- [ ] Current plan highlighted for logged-in users
- [ ] "Upgrade" CTA on current plan card if not on highest plan
- [ ] Annual billing option shown with discount (e.g. "Save 20% annually")

| Plan | Parts Limit | Storage | Team Members | Price/month |
|------|------------|---------|--------------|-------------|
| Free | 100 | 1 GB | 1 | $0 |
| Starter | 1,000 | 10 GB | 3 | $29 |
| Professional | 10,000 | 50 GB | 10 | $99 |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom |

Priority: High
Estimated: M

---

**US-007-02: Upgrade Plan (Self-Service)**
As a store owner on a lower plan, I want to upgrade to a higher plan directly from the app, so that I can unlock more parts capacity, storage, and team seats.

Acceptance Criteria:
- [ ] "Upgrade Plan" accessible from: Settings > Billing, Storage quota warning banner, team seats warning, parts limit warning
- [ ] Upgrade flow: select plan → review changes → enter payment (credit card via Stripe) → confirm
- [ ] Plan upgrade takes effect immediately (not at next billing cycle)
- [ ] Prorated charge calculated and shown before confirmation
- [ ] Confirmation email sent with invoice
- [ ] Downgrade follows same flow but warns about data loss if new plan limits are lower than current usage
- [ ] Downgrade effective at end of current billing period

Priority: High
Estimated: L

---

**US-007-03: Plan Limit Enforcement**
As the system, I want to enforce plan limits on parts count, storage, and team members, so that users don't exceed their plan without upgrading.

Acceptance Criteria:
- [ ] Parts limit: creating a new part when at limit shows inline error with upgrade prompt
- [ ] Storage limit: uploading a file when at 100% storage shows inline error with upgrade prompt
- [ ] Team limit: inviting a new team member when at seat limit shows error with upgrade prompt
- [ ] All limit errors provide a direct "Upgrade now" button linking to billing
- [ ] Usage metrics updated within 5 minutes of change (parts count, storage)
- [ ] Limits applied at account level (not per-user)

Priority: High
Estimated: M

---

**US-007-04: View Billing History**
As a store owner, I want to view my past invoices, so that I can provide receipts for accounting.

Acceptance Criteria:
- [ ] Billing page under Settings > Billing
- [ ] Lists all past invoices: date, amount, plan, status (Paid/Failed/Pending)
- [ ] Each invoice has a downloadable PDF receipt link
- [ ] Payment method management: view current card (masked), update card
- [ ] Next billing date and amount shown at top of page
- [ ] Failed payment shown with "Retry payment" button and update card option

Priority: Medium
Estimated: M

---

**US-007-05: 14-Day Free Trial**
As a new user, I want to access Professional plan features for 14 days without providing payment info, so that I can evaluate the full platform before committing.

Acceptance Criteria:
- [ ] All new accounts start on 14-day Professional trial automatically
- [ ] No credit card required for trial activation
- [ ] Trial banner shown in dashboard: "X days remaining in your trial. Upgrade to keep access."
- [ ] At trial end: account automatically downgraded to Free plan (data preserved, access restricted)
- [ ] Trial-to-paid conversion tracked as key metric
- [ ] Users on trial can upgrade at any time during trial (billing starts immediately, trial cancelled)

Priority: High
Estimated: M

---

### EPIC-008: Admin Dashboard & Analytics

**Description:** Overview dashboard for account admins showing catalog health, search activity, and account status. Provides operational visibility without requiring external BI tools.

**Business Value:** Gives store owners confidence that the platform is working and helps them prioritize catalog improvement (e.g. which parts are most searched, what vehicles have no coverage).

---

**US-008-01: Dashboard Home Overview**
As a store admin, I want to see a summary of my account's key metrics on login, so that I know the health of my catalog and search activity at a glance.

Acceptance Criteria:
- [ ] Dashboard page is the default landing after login
- [ ] Widgets shown: Total active parts, Total vehicles, Compatibility mappings count, Total searches (last 30 days), Top 10 searched part numbers, Storage used / total, Team members active, Subscription plan + trial/renewal status
- [ ] Widgets load within 3 seconds
- [ ] Date range selector for search metrics: 7d / 30d / 90d
- [ ] Low-coverage alert: if > 20% of vehicles have 0 compatible parts, show warning widget

Priority: Medium
Estimated: M

---

**US-008-02: Search Analytics**
As a store admin, I want to see what users are searching for on my platform, so that I can identify missing parts and popular demand.

Acceptance Criteria:
- [ ] Search analytics page: Settings > Analytics > Search
- [ ] Table: search query, search count, zero-result rate, last searched
- [ ] Filter: zero-results only (identifies catalog gaps), date range
- [ ] Top 50 search terms shown (MVP scope)
- [ ] Export to CSV
- [ ] Data refreshed daily (not real-time for MVP)

Priority: Medium
Estimated: M

---

**US-008-03: Catalog Health Score**
As a store admin, I want to see a health score for my catalog, so that I know how complete and well-structured my data is.

Acceptance Criteria:
- [ ] Health score displayed on dashboard as a percentage (0–100%)
- [ ] Score is composite of: % parts with at least 1 image, % parts with at least 1 compatibility, % parts with description > 50 chars, % active vehicles with >= 1 compatible part
- [ ] Score breakdown shown with per-dimension scores and improvement suggestions
- [ ] "Improve score" links to relevant admin pages (e.g. "Add images to 47 parts")
- [ ] Score recalculated nightly

Priority: Low
Estimated: M

---

**US-008-04: Activity Log**
As a store admin, I want to see a log of all actions taken by my team on the platform, so that I can audit changes and hold team members accountable.

Acceptance Criteria:
- [ ] Activity log under Settings > Activity
- [ ] Logs: user, action type, target (e.g. part number or vehicle), timestamp, IP address
- [ ] Action types logged: part created/edited/deactivated, vehicle created/edited, compatibility added/removed, media uploaded/deleted, user invited/deactivated, plan changed
- [ ] Filter by: user, action type, date range
- [ ] Pagination: 50 entries per page
- [ ] Log retained for 90 days (MVP)
- [ ] Export to CSV

Priority: Low
Estimated: M

---

## 4. USER FLOWS

### Flow 1: Workshop Mechanic Searching for a Part by Vehicle

**Actor:** Mechanic / Workshop user
**Goal:** Find all brake pads compatible with a customer's 2019 Honda Civic 1.5T

**Steps:**

```
1. LAND
   User opens the platform URL → redirects to /search (or login if not authenticated)
   Mechanic logs in with credentials → lands on search page

2. INITIATE VEHICLE SEARCH
   Mechanic clicks "Search by Vehicle" tab (vs. "Search by Part Number")
   Vehicle selector stepper becomes active

3. SELECT MAKE
   Mechanic clicks Make dropdown → types "Hon" → autocomplete filters to "Honda"
   Selects "Honda"

4. SELECT MODEL
   Model dropdown populates with Honda models
   Mechanic scrolls or types "Civic" → selects "Civic"

5. SELECT YEAR
   Year dropdown shows available years for Honda Civic in the catalog
   Mechanic selects "2019"

6. SELECT ENGINE/TRIM
   Engine dropdown shows: "1.5 Turbo Gasoline", "2.0 Naturally Aspirated Gasoline"
   Mechanic selects "1.5 Turbo Gasoline"
   "Search" button activates

7. VIEW RESULTS
   Results page loads in < 2 seconds
   Header: "127 parts found for 2019 Honda Civic 1.5 Turbo"
   Parts grouped by category: Braking (23), Engine (18), Suspension (31)...
   Left filter panel shows category checkboxes with counts

8. FILTER TO BRAKING
   Mechanic clicks "Braking" in category filter
   Results update to 23 braking parts: Brake Pads, Brake Discs, Calipers, Brake Lines...

9. FURTHER FILTER TO BRAKE PADS
   Mechanic clicks "Brake Pads" subcategory chip (if available) or scrolls to find them
   Sees 6 brake pad options from different brands

10. VIEW PART DETAIL
    Mechanic clicks "Front Brake Pad Set — EBC Sport"
    Part detail page loads: images, description, OEM references, PDF download for spec sheet
    Compatible vehicles section confirms: "Compatible with 2019 Honda Civic 1.5T ✓"

11. CONFIRM AND NOTE
    Mechanic notes part number (or uses "Save" to bookmark for this session)
    Returns to results ("← Back to results") to check rear pads

TOTAL TIME: Target < 3 minutes from opening platform to confirmed part number
```

---

### Flow 2: Admin Adding a New Part with Compatibility Data

**Actor:** Catalog Editor (store staff with Editor role)
**Goal:** Add a new front brake pad set to the catalog, upload product image and PDF, and map it to compatible vehicles

**Steps:**

```
1. NAVIGATE TO CATALOG
   Admin logs in → Dashboard
   Clicks "Catalog" in left nav → "Parts" → "Add New Part" button

2. FILL PART DETAILS
   Part Number: "EBC-DP21163"
   Name: "EBC Greenstuff Front Brake Pad Set"
   Brand: "EBC" (select from dropdown or type to create)
   Category: "Braking" → Subcategory: "Brake Pads"
   Description: "Low-dust, high-performance brake pads for daily driving..."
   OEM References: "45022-TBA-A00", "45022-TBG-H00" (add chip for each)
   Weight: 0.85 kg
   Clicks "Save Part"
   → Part created with ID, status Active

3. UPLOAD IMAGES
   On part detail page → Media tab
   Drag-drops product image JPG → upload progress → thumbnail appears
   Clicks "Set as Primary" (already set as primary since it's the first)

4. UPLOAD PDF
   Still on Media tab
   Clicks "Upload PDF" → selects spec-sheet.pdf
   Label field: types "Product Specification Sheet"
   Clicks "Upload"
   → Processing indicator → PDF available

5. ADD COMPATIBILITY
   Clicks "Compatibility" tab on part detail page
   Clicks "Add Compatible Vehicle"
   Modal opens:
     Make: "Honda"
     Model: "Civic"
     Year From: 2016  |  Year To: 2021
     Engine: [multi-select] "1.5 Turbo Gasoline", "2.0 NA Gasoline" (both selected)
   Clicks "Add Another" → adds Toyota Corolla 2018-2022 1.8 Gasoline
   Clicks "Save Compatibility"
   → 4 vehicle trim mappings created (2 Honda Civic engine variants × 1 year span + 1 Toyota)

6. VERIFY
   Clicks "Preview" link → opens part in public search view
   Confirms images, PDF download link, and compatible vehicles section display correctly

TOTAL TIME: Target < 10 minutes for a complete, fully documented part entry
```

---

### Flow 3: New User Signing Up and Upgrading to Premium Plan

**Actor:** Auto parts store owner (new user)
**Goal:** Register account, explore the platform during trial, and upgrade to Professional plan

**Steps:**

```
1. LAND ON MARKETING SITE
   Owner sees ad / referral → lands on marketing site
   Clicks "Start Free Trial" CTA

2. REGISTRATION
   Registration form: Full name, Business name, Email, Password, Password confirmation
   Checks "I agree to Terms of Service and Privacy Policy"
   Clicks "Create Account"

3. EMAIL VERIFICATION
   "Check your email" screen shown
   Owner opens email → clicks "Verify my email" link
   Browser opens → account activated → auto-logged in → lands on Dashboard

4. ONBOARDING
   First-time dashboard shows welcome banner: "Your 14-day Professional trial is active"
   Onboarding checklist visible: "Add your first part", "Add your first vehicle", "Create your first compatibility"
   Owner dismisses checklist and explores freely

5. USING THE PLATFORM (DAYS 1-13)
   Owner adds 300 parts (within trial Professional limit of 10,000)
   Adds 150 vehicles
   Creates 800 compatibility mappings
   Team: adds 2 editors via Settings > Team

6. UPGRADE TRIGGER (DAY 12)
   Dashboard shows: "2 days left in trial. Upgrade to keep your data and access."
   Owner clicks "Upgrade Now"

7. PLAN SELECTION
   Plans page shown with Professional highlighted (current trial plan)
   Owner reviews: Professional = $99/month, 10,000 parts, 50GB storage, 10 team members
   Clicks "Choose Professional" → "Monthly" selected

8. PAYMENT
   Stripe payment form: Card number, expiry, CVC, billing address
   Owner enters details
   Clicks "Subscribe — $99.00/month"

9. CONFIRMATION
   Success screen: "You're now on Professional. Your trial has been converted."
   Confirmation email with invoice sent to registered email
   Dashboard updates: subscription badge shows "Professional — Active"
   Trial countdown banner disappears

10. DOWNGRADE SCENARIO (ALTERNATIVE)
    If owner does not upgrade before trial end:
    Day 15 login → "Your trial has ended. Your account is now on the Free plan."
    Data preserved but access restricted: only 100 parts visible, 1 team member, 1GB storage
    Prominent "Upgrade to restore full access" banner on all pages

TOTAL TIME (steps 1-3): Target < 5 minutes to verified, active trial account
```

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Search response time (p50) | < 1 second | Server-side, from query receipt to results JSON |
| Search response time (p95) | < 2 seconds | Server-side |
| Page load time (FCP) | < 2 seconds | Lighthouse on 4G connection |
| Part detail page load | < 1.5 seconds | First meaningful paint |
| Media upload throughput | >= 5 MB/s | Client to storage |
| Catalog list (admin) | < 1 second | For up to 10,000 parts |

### 5.2 Availability & Reliability

| Metric | Target |
|--------|--------|
| Uptime SLA | 99.5% monthly (~3.6h downtime/month) |
| Planned maintenance window | Sundays 02:00–04:00 UTC (announced 48h in advance) |
| Data backup frequency | Daily (full), hourly (incremental) |
| Recovery Point Objective (RPO) | 1 hour |
| Recovery Time Objective (RTO) | 4 hours |
| Zero data loss | Zero tolerance for committed data loss |

### 5.3 Scalability

- Catalog: Support up to 100,000 parts per account, 1M parts platform-wide at launch
- Vehicles: Support up to 500,000 vehicle trims platform-wide
- Compatibility: Support up to 10M part-vehicle mappings platform-wide
- Concurrent users: Support 500 concurrent users per account, 5,000 platform-wide (MVP launch)
- API requests: Sustain 200 req/sec for search endpoint

### 5.4 Security

| Requirement | Detail |
|-------------|--------|
| Authentication | JWT with refresh token rotation |
| Data isolation | Strict multi-tenant: row-level tenant ID filtering on all queries |
| Passwords | Bcrypt hashing (min cost factor 12) |
| Transport security | HTTPS/TLS 1.2+ on all connections |
| File uploads | Virus scanning on all uploaded files |
| Session management | Idle timeout 8h (configurable), absolute timeout 30 days |
| Audit trail | All admin actions logged with user, timestamp, IP |
| OWASP Top 10 | All endpoints validated against OWASP Top 10 before launch |

### 5.5 Compatibility & Devices

**Browser Support (latest 2 major versions):**
- Google Chrome
- Microsoft Edge
- Safari (macOS and iOS)
- Mozilla Firefox

**Device / Viewport:**
- Mobile-first responsive design
- Minimum viewport: 320px width (iPhone SE)
- Tablet: 768px+
- Desktop: 1024px+
- Touch-friendly: minimum 44×44px tap targets on mobile

**Accessibility:**
- WCAG 2.1 Level AA compliance for all user-facing pages
- Keyboard navigable for all core flows
- Screen reader compatible (ARIA labels on interactive elements)

### 5.6 Internationalisation (MVP Baseline)

- Default language: English (en-US)
- Currency: USD for billing
- Date format: ISO 8601 (YYYY-MM-DD) in data, localized display in UI
- Future-ready: i18n string architecture from day one (no hardcoded UI strings)

---

## 6. OUT OF SCOPE (MVP)

The following capabilities are explicitly excluded from MVP scope and deferred to post-launch:

| Feature | Reason for Deferral |
|---------|-------------------|
| OCR for part number extraction from images | Requires ML pipeline; high complexity |
| Semantic / AI-powered search | Embeddings infrastructure; cost; post-MVP |
| Image recognition / visual part search | Computer vision; post-MVP |
| TecDoc integration | Third-party data licensing; API complexity |
| Marketplace integrations (MercadoLivre, etc.) | Out of core product scope |
| Public / external API for partners | Security, rate limiting, API key management |
| Mobile native apps (iOS / Android) | Web-first MVP; native deferred |
| Multi-language UI | English-only for launch |
| ERP / Inventory system integrations | Complex; post-MVP |
| POS integration | Out of scope |
| B2C e-commerce (shopping cart, checkout) | Catalog + search only; no transaction engine |

---

## 7. GLOSSARY

| Term | Definition |
|------|-----------|
| **Part** | An automotive component SKU with a unique part number within an account |
| **Vehicle Trim** | A specific vehicle variant: make + model + year + engine + trim name |
| **Compatibility Mapping** | A defined relationship between a Part and a Vehicle Trim indicating the part fits that vehicle |
| **Account** | A multi-tenant unit representing one store or business; all data is scoped per account |
| **OEM Reference** | Original Equipment Manufacturer part number — the number used by the vehicle maker |
| **Catalog Editor** | A user role with permission to create and modify parts, vehicles, and compatibility data |
| **Admin** | A user role with full access including billing, team management, and account settings |
| **Viewer** | A user role with read-only access to catalog and search |
| **SKU** | Stock Keeping Unit — a unique identifier for a product variant |
| **Zero-result search** | A search that returns no matching parts — a catalog gap indicator |
| **Tenant** | Synonym for Account in multi-tenant architecture context |

---

*Document generated: 2026-05-18*
*PRD Version: 1.0 — MVP Scope*
*Next review: After first sprint planning*
