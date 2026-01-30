# UCSB Rideshare App

## App Type

**Mobile Application (Campus Ridesharing Platform)**  
The UCSB Rideshare App is a mobile-first social-utility app designed to help UCSB students, faculty, and staff coordinate shared rides safely and efficiently within their campus community.

---

## Description

The UCSB Rideshare App is an iOS-based ridesharing service designed exclusively for the UCSB community. It allows users with a valid `@ucsb.edu` email to safely coordinate rides with other students, faculty, and staff.

Unlike public rideshare platforms such as Uber or Lyft, this app is restricted to UCSB affiliates only, prioritizing trust, affordability, and campus-specific travel needs (e.g., rides to and from campus, Isla Vista, airports, or nearby cities).

---

## Quick Start

### Prerequisites

- **Node.js** (v16+) - [Download](https://nodejs.org/)
- **Expo Go App** on your phone:
  - [iOS App Store](https://apps.apple.com/us/app/expo-go/id982107779)
  - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation & Running
```bash
# Clone the repository
git clone [your-repo-url]

# Navigate to the app directory
cd pj08-rideshare/rideshare-app

# Install dependencies
npm install

# Start the app
npx expo start
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

This project aims to build a simple, safe, and reliable platform for UCSB community members to coordinate shared transportation. The app will allow users to create ride listings, search for available rides, and communicate ride details in a centralized system. By restricting access to users with a valid `@ucsb.edu` email, the app creates a trusted environment where users feel more comfortable sharing rides with people they know are affiliated with the university. The initial version of the app will focus on core functionality—posting rides, joining rides, and managing ride details—while leaving room for future features such as messaging, ratings, or ride history.

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
- Can search for available rides  
- Can request to join a ride  
- Can view ride details such as destination, time, and available seats  

**Goal:** Find affordable, reliable transportation with people they trust.  
**How the app helps:**  
- Filters access to UCSB users only  
- Provides a searchable list of ride options  

---

### 2. Drivers
Users who offer rides.
- Can create ride listings  
- Can edit or cancel their own rides  
- Can manage how many riders join their ride  

**Goal:** Share rides, reduce travel costs, and coordinate passengers easily.  
**How the app helps:**  
- Allows easy posting of ride details  
- Lets drivers control participation  

---

## Roles and Permissions

Because the app is public-facing and allows user-generated content (ride listings), safety and moderation are important.

- **Authentication:**  
  - Only users with a verified `@ucsb.edu` email can create accounts.
- **Permissions:**
  - Riders can view and join rides.
  - Drivers can create, edit, and delete their own ride listings.
  - Admins can delete any ride listing and manage users.
- **Content Control:**  
  - Restricting sign-ups to UCSB emails reduces spam and abuse.
  - Admin role ensures inappropriate content can be removed.

---

## Tech Stack

### Technologies Used

- **Platform:** Mobile Application (iOS-first, cross-platform capable)
- **Frontend:** React Native with Expo
  - Allows a single codebase for mobile platforms  
  - Modern UI development and fast iteration  

- **Backend:** Firebase
  - Cloud Firestore for database
  - Firebase Authentication for secure login
  - Real-time updates for ride listings

- **Authentication:** Firebase Authentication  
  - Secure login system  
  - Easy enforcement of `@ucsb.edu` email restriction  

- **Database:** Cloud Firestore (NoSQL)
  - Stores users, rides, and participation data  

---

### Why This Tech Stack

This tech stack was chosen to:
- Support fast development and testing  
- Work well for mobile-first applications  
- Provide secure authentication  
- Allow future expansion to Android or web  
- Scale as more users join the platform  

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

## Things to Look Out For 
 ** Search Bar is not supported in the MVP ** —
 ** Only filtering can be done by tags in MVP ** —
 ** Keyboard Blocks Last Fields in Driver Side, simply exit out of keyboard and select lower fields to fill ** - 
 
 
 
 
