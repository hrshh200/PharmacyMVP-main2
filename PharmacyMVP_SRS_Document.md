# PharmacyMVP - Software Requirements Specification (SRS)

**Document Version:** 1.0  
**Date:** April 1, 2026  
**Status:** Final - Ready for Demo

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [User Roles & Personas](#user-roles--personas)
4. [Functional Requirements](#functional-requirements)
5. [Database Architecture](#database-architecture)
6. [Key Features Summary](#key-features-summary)
7. [User Workflows](#user-workflows)
8. [Technology Stack](#technology-stack)
9. [API Endpoints](#api-endpoints)
10. [Demo Scenarios](#demo-scenarios)
11. [Non-Functional Requirements](#non-functional-requirements)
12. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**PharmacyMVP** is a comprehensive digital healthcare and pharmaceutical platform that connects patients with pharmacy stores, enabling seamless medicine ordering, prescription management, vaccination tracking, and customer support through dynamic query management.

### Key Highlights
- **Multi-role Architecture**: Support for Patients, Store Owners, and Store Staff
- **Dynamic Features**: Real-time order tracking, instant query responses, vaccination records
- **Prescription Management**: Digital prescription upload, store review, and approval workflow
- **Store Intelligence**: Complete dashboard with orders, staff management, and comprehensive analytics
- **Responsive UI**: Patient and Store Dashboards with role-based access
- **Scalable Backend**: MongoDB + Node.js/Express with JWT authentication

---

## System Overview

### Purpose
PharmacyMVP bridges the gap between patients and pharmacies by providing:
- A convenient online pharmacy for medicine ordering
- Secure prescription upload and management
- Real-time order tracking
- Vaccination record maintenance
- Direct customer support through query management

### Scope

**In Scope:**
- Patient registration and authentication
- Medicine browsing, cart management, and checkout
- Prescription digital submission and approval
- Order management with dynamic tracking
- Vaccination record management
- Query management with store responses
- Store staff administration
- Comprehensive reporting and analytics

**Out of Scope:**
- Doctor appointments and medical consultations
- Payment gateway integration (UI prepared)
- SMS/Email notification delivery (infrastructure prepared)

---

## User Roles & Personas

### 1. **Patient**
**Primary Goals:**
- Browse and purchase medicines conveniently
- Upload prescriptions for verification
- Track orders in real-time
- Maintain vaccination records
- Get support through query system

**Key Characteristics:**
- Requires easy navigation and quick checkout
- Needs real-time order status updates
- Values privacy and secure prescription handling

**Permissions:**
- View medicines and add to cart
- Checkout with delivery/pickup selection
- Upload prescriptions
- View order history and tracking
- Manage vaccination records
- Raise and track queries
- Edit profile and notification preferences

---

### 2. **Store Owner**
**Primary Goals:**
- Manage pharmaceutical store operations
- Monitor orders and revenue
- Staff administration
- Review and approve prescriptions
- Track store performance metrics

**Key Characteristics:**
- Requires quick access to business metrics
- Needs staff management capabilities
- Values comprehensive reporting

**Permissions:**
- View all store orders and transactions
- Review and approve/reject prescriptions
- Manage store staff (add, edit, activate, remove)
- Access detailed reports and analytics
- Respond to customer queries
- Import patients via CSV
- Track revenue by period

---

### 3. **Store Staff**
**Primary Goals:**
- Update order status
- Assist with order processing
- Help customers with queries

**Key Characteristics:**
- Needs quick access to order information
- Requires simple status update mechanism

**Permissions:**
- View assigned store orders
- Update order tracking status (Packed, Ready for Pick up, Out for Delivery, Delivered)
- Respond to customer queries

---

## Functional Requirements

### 1. **Authentication & User Management**

#### 1.1 User Registration
- Support registration for Patients and Store Owners
- Email and mobile validation
- Password encryption with bcrypt
- Welcome email confirmation (infrastructure ready)

#### 1.2 User Login
- Secure JWT token-based authentication
- Token expiration and refresh
- Role-based token payload (Patient, Store, Staff)
- Remember me functionality (localStorage)

#### 1.3 User Profile Management
- Edit patient profile (name, email, mobile, address, health info)
- Changes persist immediately to database
- Update user health data (weight, height, blood group, DOB)
- Edit and save operation fully dynamic

---

### 2. **Patient Dashboard**

#### 2.1 Dashboard Header
- Attractive greeting with time-aware messages (Good Morning/Afternoon/Evening)
- Live avatar with patient initials
- Current date and time display
- Status indicator badge
- Navigation to home with quick access

#### 2.2 Quick Summary Cards
- **Total Orders**: Count and total spending
- **Pending Orders**: Orders awaiting delivery/pickup
- **Prescriptions**: Accepted and pending prescriptions
- **Vaccinations**: Count of vaccinations recorded
- **Open Queries**: Count badge with unresolved queries

#### 2.3 My Orders Section
- List of all patient orders with customer name
- Order ID, total amount, status, address
- Payment method display
- Tracking button for each order
- Dynamic loading from database

#### 2.4 My Prescriptions Section
- List of uploaded prescriptions
- Status indicators (Pending review, Approved, Rejected)
- Meaningful messages:
  - Approved: "Your Prescription is Approved. Stay in Touch!!"
  - Pending: "Our Pharmacists are carefully reviewing your Prescription. Stay in Touch!"
  - Rejected: "Your prescription is rejected. Reason can be less visibility of the prescription or missing required information. Can you re-upload it?"
- Re-upload button for rejected prescriptions
- Prescription details and review progress

#### 2.5 My Vaccinations Section
- List of all vaccinations from VaccinationMaster
- Track vaccination status (Completed, Pending)
- Add vaccination date
- Real-time syncing to database
- Count badge in sidebar

#### 2.6 Raise a Query Section
- List-first interface showing recent queries when they exist
- Raise a Query button to create new query
- Query form with subject and message
- Status display: Open or Answered
- Store answer visible immediately
- Auto-refresh after submission
- Query count badge showing open queries only

#### 2.7 Notification Settings
- SMS Alerts toggle
- Email Alerts toggle
- Attractive confirmation modal with success animation
- Instant save to database on confirm
- No separate save button

#### 2.8 Edit Profile Section
- Edit patient details form
- Supports: First/Middle/Last Name, Email, Mobile, Address, City, State, Pincode
- Save button that persists to User collection immediately
- Form validation
- Success feedback

---

### 3. **Online Pharmacy**

#### 3.1 Medicine Catalog
- Browse all available medicines
- Search by medicine name
- Category filtering
- Medicine details display

#### 3.2 Shopping Cart
- Add/remove medicines from cart
- Update quantity (increase/decrease/delete)
- Cart persistence in Cart collection (1 cart per user)
- Display cart item count in header

#### 3.3 Checkout Flow
- **Step 1**: View cart items
- **Step 2**: Enter delivery address
  - Select delivery type: Store Pick Up or Home Delivery
- **Step 3**: Select payment method
- **Step 4**: Order confirmation

#### 3.4 Order Management
- Dynamic order creation with:
  - Order ID (unique)
  - User ID (from token)
  - Store ID (assigned automatically)
  - Delivery type (Pickup/Delivery)
  - Items list
  - Total price
  - Delivery address
  - Payment info

---

### 4. **Prescription Management System**

#### 4.1 Patient Side - Upload Prescription
- File upload dialog for prescription images
- Supported formats: PDF, JPG, PNG
- File size validation
- Upload to backend storage

#### 4.2 Store Side - Review Prescriptions
- List of pending prescriptions from all patients
- Patient details display
- Prescription attachment preview
- Approve or Reject action
- Add review notes/reason

#### 4.3 Prescription Status Workflow
- **Pending**: Awaiting pharmacy review
- **Approved**: Prescription verified, patient can proceed to order
- **Rejected**: Patient needs to re-upload with reason

#### 4.4 Re-upload Feature
- Rejected prescriptions show meaningful rejection reason
- Patient can re-upload same prescription
- Re-upload sets status back to pending for fresh review
- No duplicate prescriptions created

---

### 5. **Order Tracking System**

#### 5.1 Delivery Type Selection
- Patient chooses during checkout:
  - **Store Pick Up**: Order ready in 1-2 hours
  - **Home Delivery**: Order delivered to address

#### 5.2 Tracking Status Progression

**For Store Pick Up:**
1. Order Placed
2. Packed
3. Ready for Pick up

**For Home Delivery:**
1. Order Placed
2. Packed
3. Out for Delivery
4. Delivered

#### 5.3 Store Staff Update Capability
- Store Dashboard shows orders with current tracking status
- Staff can update status from dropdown
- Status changes immediately in database
- Patient sees real-time updates in dashboard and tracking page

#### 5.4 Patient Tracking Page
- Visual step progression indicator
- Completed steps in green
- Current step highlighted
- Estimated delivery info (for delivery orders)
- Dynamic based on delivery type

---

### 6. **Store Dashboard**

#### 6.1 Staff Management
- Add new staff members with:
  - Name, Role (Manager, Delivery, Counter), Contact Number, Email
- Edit staff details
- Activate/Inactivate staff members
- Remove staff from system
- All operations persist to StoreStaff collection
- Meaningful display: Name, Role, Contact Number, Email ID

#### 6.2 Orders Section
- List all store orders with:
  - Order number
  - Customer name
  - Order date
  - Total amount
  - Tracking status (with colored indicator)
  - Delivery type icon
- Click order to view full details including:
  - Items list with quantities and prices
  - Payment method
  - Delivery address
  - Customer contact
  - Update tracking status dropdown
- Real-time status update with instant UI refresh

#### 6.3 Prescription Review Section
- List pending prescriptions for approval
- Patient details display
- Prescription attachment with preview
- Approve/Reject buttons (only visible for pending)
- Hidden after approval or rejection
- Add review notes or rejection reason

#### 6.4 Queries Section
- List all customer queries assigned to this store
- Query subject and message display
- Status indicator (Open/Answered)
- Answer text box for store response
- Submit answer button
- Auto-refresh query list after answering

#### 6.5 Reports Section
- **Revenue Summary:**
  - Monthly Revenue (last 30 days)
  - Weekly Revenue (last 7 days)
  - Today's Revenue
  - Growth percentage (week-over-week)
  - All calculated dynamically from live orders

- **Order Metrics:**
  - Total Order Revenue (all-time)
  - Average Order Value
  - Order Completion Rate (percentage)

- **Operational Snapshot:**
  - Total Completed Orders
  - Pending Orders
  - Unique Customers
  - All updated in real-time as orders change

#### 6.6 Import Patients
- CSV file upload for bulk patient import
- CSV headers: firstName, middleName, lastName, email, mobile, address, city, state, pincode, salutation, countryCode, dob, sex, weight, height, bloodgroup
- Validation before import
- Result summary: Created, Skipped, Errors
- Creates users in User collection with authentication

---

### 7. **Vaccination Management System**

#### 7.1 Vaccination Master
- Pre-defined vaccination list from VaccinationMaster collection:
  - BCG, DPT1, DPT2, DPT3, Polio1, Polio2, Polio3, Hepatitis B, Measles, Chickenpox, Typhoid, Yellow Fever
- Each vaccination has ID, name, description

#### 7.2 User Vaccinations
- Track which vaccinations each patient has received
- Store vaccination date
- Personal vaccination record linked to user

#### 7.3 My Vaccinations Display
- Count of vaccinations on dashboard card
- List of all available vaccinations
- Status toggle (Completed/Pending) for each
- Date selection for completed vaccinations
- Database persistence with unique vaccinationMasterId reference
- Auto-duplicated prevention with unique index

---

### 8. **Query Management System**

#### 8.1 Patient - Raise Query
- Subject and message fields
- Auto-assigned to patient's store
- Status: Open (default)
- Queries list shows all recent queries
- List-first interface: queries shown first, form opens on button click
- Auto-refresh after submission

#### 8.2 Store - Answer Query
- View all open queries assigned to store
- List of problems with patient details
- Provide answer/response
- Mark as Answered

#### 8.3 Patient - View Answer
- Recent Queries section shows:
  - Query subject and status
  - Store's answer (when provided)
  - Submission date

---

### 9. **Notification Settings**

#### 9.1 SMS Alerts
- Toggle SMS notifications on/off
- Confirmation modal before change
- Instant save on confirm

#### 9.2 Email Alerts
- Toggle email notifications on/off
- Confirmation modal before change
- Instant save on confirm

#### 9.3 Confirmation Experience
- Attractive modal with gradient header
- Context-aware title
- Success checkmark animation
- Instant database persistence

---

## Database Architecture

### Collections & Relationships

| Collection | Fields | Purpose | Key Relations |
|-----------|--------|---------|----------------|
| **users** | _id, firstName, middleName, lastName, name, email, mobile, address, city, state, pincode, salutation, countryCode, dob, sex, weight, height, bloodgroup, password, hash_password, role, storeName, ownerName, licenceNumber, gstNumber | Core user data (patient/store owner) | orders, prescriptions, vaccinations, queries, cart, storeStaff |
| **orders** | _id, orderId, userId, storeId, items[], totalPrice, deliveryType, trackingStatus, address, payment, createdAt | Patient orders with tracking | userId (users), storeId (users), items (medicines) |
| **cart** | _id, userId, items[], createdAt, updatedAt | Shopping cart per user | userId (users) |
| **prescriptions** | _id, userId, fileName, filePath, mimeType, status, reviewNotes, createdAt, updatedAt | Prescription uploads | userId (users) |
| **orders (Order.js model)** | Same as above | Separate dedicated tracking | userId, storeId |
| **storeStaff** | _id, storeId, name, role, contactNumber, email, status | Store staff members | storeId (users) |
| **userVaccination** | _id, userId, vaccinationMasterId, status, dateReceived | User vaccination records | userId (users), vaccinationMasterId (vaccinationMaster) |
| **vaccinationMaster** | _id, name, description | Vaccination definitions | userVaccination refs |
| **userQuery** | _id, userId, storeId, subject, message, status, storeAnswer, createdAt, updatedAt | Customer queries | userId (users), storeId (users) |

---

## Key Features Summary

| Feature | Status | Type | Backend | Frontend | Notes |
|---------|--------|------|---------|----------|-------|
| User Authentication | ✅ Complete | Dynamic | JWT tokens | Login/Signup | Role-based access |
| Patient Dashboard | ✅ Complete | Dynamic | Multiple APIs | Full dashboard | Header redesigned, attractive UI |
| Online Pharmacy | ✅ Complete | Dynamic | Cart API | Browse + checkout | Dynamic cart with ID tracking |
| Order Management | ✅ Complete | Dynamic | Order API | Dashboard + Tracking | Real-time updates |
| Prescription Upload | ✅ Complete | Dynamic | Prescription API | Upload -> Review workflow | Re-upload for rejected |
| Order Tracking | ✅ Complete | Dynamic | Tracking API | Step progression | Pickup vs Delivery workflows |
| Store Dashboard | ✅ Complete | Dynamic | Store APIs | Staff + Orders + Reports | All sections dynamic |
| Staff Management | ✅ Complete | Dynamic | Staff API | Add/Edit/Activate/Remove | Meaningful display |
| Vaccination System | ✅ Complete | Dynamic | Vaccination API | My Vaccinations card | Auto-refresh, no duplicates |
| Query Management | ✅ Complete | Dynamic | Query API | List-first interface | Auto-assign to store |
| Notification Settings | ✅ Complete | Dynamic | Notification API | Toggle + modal | Instant save, no separate button |
| Edit Profile | ✅ Complete | Dynamic | Profile API | Dashboard form | Immediate DB persistence |
| Reports | ✅ Complete | Dynamic | Order data | Store Dashboard | Real-time metrics |
| Bulk Patient Import | ✅ Complete | Dynamic | CSV import API | Store Dashboard | Creates in User collection |

---

## User Workflows

### Workflow 1: Patient Ordering Medicine

**Steps:**
1. Patient logs in to dashboard
2. Clicks "Online Pharmacy" sidebar item
3. Browses medicines and adds to cart
4. Cart count updates in header
5. Clicks cart icon to view items
6. Proceeds to checkout
7. **Step 1**: Reviews cart items
8. **Step 2**: Enters address and selects:
   - Store Pick Up OR
   - Home Delivery
9. **Step 3**: Selects payment method
10. **Step 4**: Sees order confirmation
11. Order appears in My Orders with:
    - Tracking status: "Order Placed"
    - Delivery type icon
    - Customer name and total
12. Patient can click "Track Order" to see progress visualization
13. Store staff updates status: Packed → Ready for Pick up/Out for Delivery
14. Patient sees real-time updates in both Dashboard and Tracking page
15. Final status: Delivered or Ready for Pick up
16. Order marked as completed

**Key Points:**
- Cart persists in Cart collection per user
- Each order gets unique orderId and is stored in orders collection
- Delivery type determines tracking workflow
- Store staff only updates status, no manual order creation

---

### Workflow 2: Prescription Upload & Approval

**Steps (Patient):**
1. Patient logs in to Dashboard
2. Clicks "My Prescriptions"
3. Sees existing prescriptions with status
4. For rejected: Sees meaningful reason + "Re-upload Prescription" button
5. For pending: Sees "Our Pharmacists are carefully reviewing..."
6. For approved: Sees "Your Prescription is Approved. Stay in Touch!!"
7. Clicks "Upload Prescription" to add new
8. Selects PDF/JPG/PNG file
9. File uploaded to backend

**Steps (Store):**
1. Store owner logs in to Store Dashboard
2. Goes to Prescriptions section
3. Sees list of pending prescriptions
4. Clicks prescription to see attachment
5. Reviews prescription image
6. Either:
   - Clicks "Approve" → Goes into approval workflow
   - Clicks "Reject" → Adds reason for rejection
7. After approve/reject, attachment and buttons disappear
   (Shows only status, no actions)

**Steps (Patient - After Response):**
1. Patient sees prescription status updated
2. If approved: Prescription now available for medicine ordering
3. If rejected: Re-upload button visible with reason

**Key Points:**
- Prescriptions are NOT embedded on user document
- Stored in separate Prescription collection
- Each has userId reference
- Status: pending → approved/rejected
- Re-upload creates new record, doesn't duplicate

---

### Workflow 3: Store Managing Orders & Updating Tracking

**Steps:**
1. Store owner logs in to Store Dashboard
2. Goes to "Orders" section
3. Sees all orders assigned to this store with:
   - Order number
   - Customer name
   - Order date
   - Status badge with color (Amber=Placed, Violet=Packed, Blue=Out, Green=Ready/Delivered)
4. Clicks on specific order to see details
5. Details panel shows:
   - Full order number
   - Customer name and date
   - Items list with quantities/prices
   - Payment method
   - Delivery address
   - Current tracking status
   - "Update tracking status" section
6. Staff selects new status from dropdown
   - For Pick Up: Packed → Ready for Pick up
   - For Delivery: Packed → Out for Delivery → Delivered
7. Status updates immediately in:
   - Store Dashboard order list
   - Patient Dashboard My Orders
   - Patient Tracking page (visual progression)
8. Real-time DB update with no page reload needed

**Key Points:**
- Only Staff can update status
- Status progression depends on delivery type
- UI buttons become gray/disabled for completed statuses
- Patient sees real-time tracking changes

---

### Workflow 4: Customer Query Management (Bidirectional)

**Steps (Patient - Raise Query):**
1. Patient logs in to Dashboard
2. Clicks "Raise a Query" in sidebar (shows badge if open queries)
3. If no queries exist: Form appears directly
4. If queries exist: List shows first with "Raise a Query" button
5. Enters subject and message (e.g., "Can I get refund for this medicine?")
6. Clicks "RAISE A QUERY"
7. Query submitted and saved to DB
8. Query list auto-refreshes immediately
9. Query appears with status "Open"
10. Patient adds to Recent Queries section

**Steps (Store - Answer Query):**
1. Store owner logs in to Store Dashboard
2. Goes to "Queries" section
3. Sees list of all open queries assigned to this store
4. Clicks on specific query
5. Sees patient's subject and message
6. Types answer in text area (e.g., "Yes, refund will be processed within 5 days")
7. Clicks "SUBMIT ANSWER"
8. Query status changes to "Answered"
9. Answer saved to DB

**Steps (Patient - See Answer):**
1. Patient sees query list updated
2. "Open" status changed to "Answered"
3. Store's answer text visible in "Store Answer" block
4. Patient knows issue has been addressed

**Key Points:**
- Queries auto-assigned to patient's store at creation
- Query count badge in sidebar shows only OPEN queries
- List-first UI: shows queries when they exist
- Auto-refresh on submit means instant feedback

---

### Workflow 5: Staff Management System

**Steps (Store Owner - Add Staff):**
1. Store owner logs in to Store Dashboard
2. Goes to "Staff Members" section
3. Sees list of existing staff with:
   - Name
   - Role
   - Contact Number
   - Email ID
4. Clicks "Add Staff Member"
5. Form appears with:
   - Name field
   - Role dropdown (Manager, Delivery, Counter)
   - Contact Number
   - Email ID
6. Fills form and clicks "Add Staff"
7. New staff saved to StoreStaff collection
8. Staff appears in list immediately (no page reload)

**Steps - Edit Staff:**
1. Clicks "Edit" on staff card
2. Form pre-populated with current data
3. Edits fields (e.g., change phone number)
4. Clicks "Update Staff"
5. Staff record updated in DB
6. List refreshes to show new data

**Steps - Activate/Inactivate Staff:**
1. Sees Activate/Inactivate button on each staff card
2. Clicks to toggle status
3. Status changes in DB
4. Card shows updated status immediately

**Steps - Remove Staff:**
1. Clicks "Remove" button on staff card
2. Staff deleted from system
3. No longer appears in list

**Key Points:**
- NO Identity Proof field (removed)
- Staff tied to store via storeId
- All CRUD operations fully dynamic
- Meaningful display: Name, Role, Contact, Email only

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Validation**: Custom validation middleware
- **API Design**: RESTful architecture

### Frontend
- **Framework**: React.js
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux
- **HTTP Client**: Axios
- **Icons**: React Icons / SVG
- **UI Components**: Custom React components
- **Form Handling**: React hooks (useState)

### Infrastructure
- **Hosting**: Local development
- **Database**: MongoDB
- **File Storage**: Server filesystem (backend/uploads)
- **Authentication**: JWT tokens stored in localStorage
- **CORS**: Enabled for frontend-backend communication

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/signup` | Register new user | None |
| POST | `/api/signin` | Login user | None |
| GET | `/api/fetchdata` | Get logged-in user data | User |

### Cart Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/updateorderedmedicines` | Add/update cart item | User |
| GET | `/api/cart` | Get user's cart | User |

### Order Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/orders` | Create new order | User |
| GET | `/api/orders/me` | Get patient's orders | User |
| GET | `/api/orders/:id` | Get single order details | User |
| PATCH | `/api/orders/:id/tracking` | Update order tracking status | Staff |
| GET | `/api/store-orders` | Get store's orders | Store |

### Prescription Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/prescriptions` | Upload prescription | User |
| GET | `/api/prescriptions` | Get user prescriptions | User |
| PATCH | `/api/prescriptions/:id/approve` | Approve prescription | Store |
| PATCH | `/api/prescriptions/:id/reject` | Reject prescription | Store |
| PATCH | `/api/prescriptions/:id/reupload` | Re-upload rejected prescription | User |

### Staff Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/store-staff` | Add staff member | Store |
| GET | `/api/store-staff` | Get store staff | Store |
| PATCH | `/api/store-staff/:id` | Edit staff | Store |
| PATCH | `/api/store-staff/:id/status` | Toggle staff status | Store |
| DELETE | `/api/store-staff/:id` | Remove staff | Store |

### Vaccination Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/vaccinations/master` | Get all vaccinations | User |
| POST | `/api/vaccinations` | Add/update user vaccination | User |
| GET | `/api/vaccinations` | Get user vaccinations | User |

### Query Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/queries` | Raise new query | User |
| GET | `/api/queries` | Get user queries | User |
| GET | `/api/queries/store` | Get store queries | Store |
| PATCH | `/api/queries/:id/answer` | Answer query | Store |

### Profile Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| PUT | `/api/patientprofile` | Update patient profile | User |
| PUT | `/api/user-notifications` | Update notification settings | User |

### Import Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/import-patients` | Import patients from CSV | Store |

---

## Demo Scenarios

### Scenario 1: Complete Patient Journey (15 minutes)

**Objective:** Demonstrate patient ordering flow from browsing to tracking

**Steps:**
1. **Login**: Show patient login with credentials
2. **Dashboard**: Show attractive header, cards with order/prescription counts
3. **Online Pharmacy**: 
   - Browse medicines
   - Add 2-3 medicines to cart
   - Show cart count updating in header
4. **Checkout**: 
   - Review cart items
   - Enter address
   - **Live Demo**: Select "Home Delivery" → Show tracking steps (4 steps)
   - Select payment method
   - See confirmation
5. **My Orders**: 
   - Show new order with "Order Placed" status
   - Status badge with color coding
6. **Track Order**: 
   - Click track button
   - Show step progression with current "Order Placed" step highlighted
7. **Switch to Store**: 
   - Store staff updates order to "Packed"
   - **Switch back to Patient**: 
   - Dashboard auto-refreshes showing "Packed" status
   - Tracking page shows step 2 now highlighted

---

### Scenario 2: Prescription Upload & Approval Workflow (10 minutes)

**Objective:** Show end-to-end prescription management

**Steps:**
1. **Patient**: 
   - Go to My Prescriptions
   - Show "Upload Prescription" button
   - Upload sample prescription image
   - See status: "Our Pharmacists are carefully reviewing..."
2. **Store Dashboard**:
   - Go to Prescriptions section
   - See pending prescription from patient
   - Show preview of attachment
   - Click "Approve" button
   - See "Approved" status
   - Attachment and buttons disappear
3. **Patient Dashboard**:
   - Refresh page
   - See prescription now shows "Your Prescription is Approved. Stay in Touch!!"
   - Show re-upload button is gone (only for rejected)

---

### Scenario 3: Store Operations Dashboard (10 minutes)

**Objective:** Showcase store management features

**Steps:**
1. **Staff Management**:
   - Show list of staff with Name, Role, Contact, Email
   - Add new staff member (fill form, click Add)
   - Show new staff appears immediately
   - Show Edit functionality
   - Show Activate/Inactivate toggle
   - Show remove option
2. **Orders**:
   - Show order list with status badges
   - Click to view order details
   - Show update tracking dropdown
   - Update status and show instant refresh
3. **Queries**:
   - Show open customer query
   - Type answer
   - Submit
   - Show query status changes to "Answered"
4. **Reports**:
   - Show revenue metrics (Monthly, Weekly, Today)
   - Show all updating dynamically
   - Show order completion rate
   - Show operational snapshot with real data

---

## Non-Functional Requirements

### Performance
- **Page Load Time**: < 2 seconds for dashboard
- **API Response Time**: < 500ms for most endpoints
- **Cart Updates**: Real-time with < 100ms feedback
- **Order Status Updates**: Immediate reflection on both dashboards

### Security
- **Authentication**: JWT token with 24-hour expiration
- **Password**: bcryptjs encryption with salt rounds
- **Authorization**: Role-based access control on all endpoints
- **Data Privacy**: Prescriptions and queries visible only to authorized users
- **File Upload**: Validation of file types and sizes
- **SQL/NoSQL Injection**: Protected through Mongoose and input validation

### Scalability
- **Database**: MongoDB supports horizontal scaling
- **Backend**: Stateless Node.js servers
- **Frontend**: CDN-ready assets with Vite build optimization
- **Concurrent Users**: Designed for 1000+ concurrent connections

### Reliability
- **Error Handling**: Graceful error messages for all operations
- **Data Consistency**: Transaction-like patterns for multi-step workflows
- **Backup**: Regular database backups recommended
- **Recovery**: Clear error states for user recovery

### Usability
- **Responsive Design**: Mobile, tablet, desktop support
- **Accessibility**: Semantic HTML, color contrast compliance
- **Navigation**: Intuitive sidebar with clear labeling
- **Feedback**: Loading states, confirmation modals, success animations
- **Localization**: Ready for multi-language support

---

## Future Enhancements

### Phase 2 Improvements

1. **Payment Integration**
   - Stripe/Razorpay integration for real payments
   - Payment history and receipts
   - Refund management

2. **Advanced Notifications**
   - SMS delivery via Twilio
   - Email delivery via SendGrid
   - Push notifications for mobile app

3. **Medicine Inventory**
   - Real-time stock management
   - Low stock alerts
   - Supplier management

4. **Analytics & Insights**
   - Patient health trends
   - Popular medicines dashboard
   - Prescription patterns analysis

5. **Doctor Integration**
   - Online doctor consultations
   - E-prescriptions from doctors
   - Medical history linking

6. **Mobile Application**
   - Native iOS app
   - Native Android app
   - Biometric authentication

7. **AI/ML Features**
   - Personalized medicine recommendations
   - Disease prediction models
   - Chatbot for FAQs

8. **Multi-Store Operations**
   - Central admin dashboard
   - Inter-store inventory transfers
   - Consolidated reporting

9. **Subscription Management**
   - Monthly medicine subscriptions
   - Auto-refill orders
   - Subscription discounts

10. **Loyalty Program**
    - Points on each purchase
    - Redeem points for discounts
    - Tier-based benefits

---

## Appendix: Quick Reference

### Key Collections & Primary Keys
- **users**: _id (MongoDB ObjectId)
- **orders**: _id (MongoDB ObjectId), orderId (unique string)
- **cart**: _id (MongoDB ObjectId), userId (reference)
- **prescriptions**: _id (MongoDB ObjectId), userId (reference)
- **storeStaff**: _id (MongoDB ObjectId), storeId (reference)
- **userVaccination**: _id (MongoDB ObjectId), userId + vaccinationMasterId (unique)
- **vaccinationMaster**: _id (MongoDB ObjectId)
- **userQuery**: _id (MongoDB ObjectId), userId + storeId (references)

### Role Permissions Matrix

| Feature | Patient | Store Owner | Staff |
|---------|---------|-------------|-------|
| Browse Medicines | ✅ | ❌ | ❌ |
| Add to Cart | ✅ | ❌ | ❌ |
| Upload Prescription | ✅ | ❌ | ❌ |
| Review Prescriptions | ❌ | ✅ | ❌ |
| View Orders | ✅ | ✅ | ✅ |
| Update Order Status | ❌ | ❌ | ✅ |
| Manage Staff | ❌ | ✅ | ❌ |
| View Reports | ❌ | ✅ | ❌ |
| Answer Queries | ❌ | ✅ | ❌ |
| Raise Query | ✅ | ❌ | ❌ |
| Raise Vaccination | ✅ | ❌ | ❌ |

---

**Document Prepared For:** Demonstration & Stakeholder Review  
**Last Updated:** April 1, 2026  
**Status:** Ready for Demo
