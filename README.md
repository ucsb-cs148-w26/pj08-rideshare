# GauchoRides

## App Type

**Mobile Application (Campus Ridesharing Platform)**  
The GauchoRides app is an Expo/React Native mobile app for coordinating rides inside the UCSB community. It supports full rider and driver workflows, real-time chat/notifications, payment-backed joining, waitlists, and post-ride reviews.

---

## Description

GauchoRides is restricted to users with `@ucsb.edu` accounts and is built around campus-oriented trips (Downtown, groceries, airports, etc.).

Current implementation includes:
- Authenticated account registration/login with Firebase Authentication
- Ride hosting with destination tags, cancellation deadlines, and driver notes
- Ride joining with Stripe payment sheet integration
- Waitlist flow with temporary card holds and automatic promotion when seats open
- Ride-linked group messaging (conversation created per ride)
- Driver pickup PIN verification and active-ride status handling
- Ride history with role/status/time filters
- 48-hour review window with profile-visible ratings/reviews

---

## Quick Start

### Prerequisites

- **Node.js** (v20 recommended for Firebase Functions; v18+ for app tooling) - [Download](https://nodejs.org/)
- **Expo Go App** on your phone:
  - [iOS App Store](https://apps.apple.com/us/app/expo-go/id982107779)
  - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **Firebase project access** (for auth/firestore/functions used by this app)

### Installation & Running
```bash
# Clone the repository
git clone https://github.com/ucsb-cs148-w26/pj08-rideshare.git

# Navigate to the app directory
cd pj08-rideshare/rideshare-app

# Install dependencies
npm install

# Start the app
npx expo start

# Run tests
npm test
```

Optional (Cloud Functions local workflow):
```bash
cd functions
npm install
npm run serve
```

### Testing on Your Phone

1. Run `npx expo start` in your terminal
2. Open **Expo Go** app on your phone
3. Scan the QR code:
   - **iOS**: Use Camera app to scan
   - **Android**: Use Expo Go app to scan
4. App will load on your phone!

---

## Project Plan

This project delivers a campus-restricted rideshare platform with the full ride lifecycle implemented:
- account creation/login
- ride creation/joining/cancellation
- payment + waitlist handling
- ride-time verification and active ride management
- communication + history + reviews

The near-term engineering direction is to harden production concerns (moderation/reporting, deeper policy/privacy support, and deployment hardening) while maintaining fast feature iteration in Expo/Firebase.

---

## Audience

### Ideal Users

The ideal users are UCSB students, faculty, or staff with a valid `@ucsb.edu` email address who want to either:
- Find rides within or near the UCSB area, or  
- Offer rides to others in the UCSB community  

Access to the app is restricted to `@ucsb.edu` emails for both sign-up and login.

---

## User Roles

There are **two main user roles**, with a possible third administrative role:

### 1. Riders
Users who are primarily looking for rides.
- Can browse full listings or use **Quick Join** from home  
- Can join available seats through Stripe payment confirmation  
- Can join/leave waitlists on full rides and track waitlist position  
- Can view pickup PIN for driver verification at pickup  
- Can use ride-linked group chat and view post-ride history/review flows  

**Goal:** Find affordable, reliable transportation with people they trust.  
**How the app helps:**  
- Filters access to UCSB users only  
- Provides searchable/tag-filtered ride discovery and real-time seat updates  

---

### 2. Drivers
Users who offer rides.
- Can create rides manually or via **Quick Create** templates  
- Can set seats, price, tags, cancellation deadline, and driver notes  
- Can verify riders with PINs before starting a ride  
- Can cancel hosted rides and trigger rider notifications  
- Can manage in-progress and completed ride lifecycle  

**Goal:** Share rides, reduce travel costs, and coordinate passengers easily.  
**How the app helps:**  
- Provides one-screen host flow, rider verification tools, and real-time messaging  

---

## Roles and Permissions

Because the app supports user-generated ride data and payments, role-bound access control is enforced at the app and backend levels.

- **Authentication:**  
  - Only users with `@ucsb.edu` emails can register.
- **Permissions:**
  - Riders can view/join/leave rides, join waitlists, and access rider-only PIN and history actions.
  - Drivers can post/cancel rides, verify riders, and control ride start/end transitions.
  - Users can view other users' profiles (including fun facts and reviews) from supported surfaces.
- **Content Control:**  
  - Restricting sign-ups to UCSB emails reduces spam and abuse.
  - No dedicated in-app admin moderation panel is currently shipped.

---

## Tech Stack

### Technologies Used

- **Platform:** Mobile Application (iOS-first, cross-platform capable)
- **Frontend:** React Native with Expo
  - Expo Router for file-based navigation  
  - React Native Gesture Handler + native UI modules (datetime picker, image picker, etc.)  

- **Backend:** Firebase
  - Cloud Firestore for database
  - Firebase Authentication for secure login
  - Firebase Cloud Functions for trusted server actions (payments, join finalization, waitlist promotion, PIN verification)
  - Real-time updates via Firestore listeners

- **Payments:** Stripe
  - Stripe PaymentSheet (`@stripe/stripe-react-native`)
  - Payment intent flow for ride joins
  - Manual-capture hold flow for waitlist entries

- **Authentication:** Firebase Authentication  
  - Email/password auth with domain restriction in app flow  

- **Database:** Cloud Firestore (NoSQL)
  - Collections include users, rides, joins, waitlist, conversations/messages, notifications, reviews  

- **Testing:** Jest + `@testing-library/react-native`
  - Unit and integration coverage for key app flows

---

### Why This Tech Stack

This tech stack was chosen to:
- Support rapid mobile development with real device testing through Expo Go  
- Enable real-time product behavior (rides, chat, notifications) without custom socket infrastructure  
- Keep sensitive operations on backend functions (payments, join finalization, waitlist promotion)  
- Provide an incremental path to production hardening and scale  

---

## Team Members

- **Ruben Alvarez-Gutierrez** — `RubenAlvarezGJ`  
- **Kenisha Vaswani** — `kenisha-v`  
- **Anna Gornyitzki** — `annagornyitzki`  
- **Moiez Baqar** — `moiez12`  
- **Joel Sanchez** — `Jsanchez021`  
- **Tanvi Ladha** — `t-ladha`  
- **Wyatt Hamabe** — `Greathambino`  
- **Hien Huynh** — `hienhuynh2026`

---

## Functionality - Usage Instructions 
After authentication, users can operate as both Passenger and Driver in the same account. Hosting is gated on having vehicle information saved in profile. 

### Passenger Side

**Browse & Book Rides:**
1. Discover rides from either **Quick Join** (home) or **View All Available Rides**.
2. Filter by tags and destination search to narrow available rides.
3. Open ride details to inspect route, schedule, cancellation deadline, and driver info.
4. Join an open ride via payment confirmation.
5. If a ride is full, optionally **Join Waitlist** (card hold is placed, not immediate final charge).
6. If promoted from waitlist, seat assignment is finalized and payment hold is captured.
7. Access ride group chat from Messages for coordination.
8. Open My Rides to view joined rides and show your pickup PIN at pickup.
9. Leave a joined ride when needed (cancellation policy and deadline rules apply).

### Driver Side

**Hosting Rides:**
1. Start from **Host Ride** or use **Quick Create** template shortcuts.
2. Configure route, datetime, seat count, price, cancellation deadline, tags, and optional driver notes.
3. Submit to publish ride into available listings.
4. Monitor joins, waitlist activity, and updates via notifications/messages.
5. At departure time, open hosted ride and verify riders using rider PINs.
6. Start ride to move the group into active state; end ride on completion.
7. Cancel hosted rides when required (riders are updated and ride conversation is closed).

### Key Features

- Quick Join and Quick Create home shortcuts
- Real-time ride browsing with tag + location filtering
- Stripe-backed join flow and waitlist hold/capture flow
- Ride-linked group chat and conversation lifecycle management
- Rider PIN verification before ride start
- Notifications for join/cancel/waitlist promotion events
- Ride history filters and 48-hour participant review flow
- User profiles with fun facts, ratings, and review details

## Known Problems
- App currently runs through Expo Go for team/dev workflow; production distribution pipeline is not finalized.
- Waitlist entry is blocked for rides departing within 24 hours.
- Notification detail views are functional but some deeper breakdowns are still basic.
- Moderation/reporting/privacy-policy tooling is not fully implemented yet.
- The current build does not enforce UCSB SSO/2FA; it uses app-level domain-restricted account creation.
 
 
 
 
