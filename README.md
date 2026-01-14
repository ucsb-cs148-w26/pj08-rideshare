# UCSB Rideshare App

## Description

The UCSB Rideshare App is an iOS-based ridesharing service designed exclusively for the UCSB community. It allows users with a valid `@ucsb.edu` email to safely coordinate rides with other students.

Unlike public rideshare platforms such as Uber or Lyft, this app is restricted to UCSB affiliates only, prioritizing trust, affordability, and campus-specific travel needs (e.g., rides to and from campus, Isla Vista, airports, or nearby cities).

---

## Audience

### Ideal Users

The ideal users are UCSB students, faculty, or staff with a valid `@ucsb.edu` email address who want to either:
- Find rides within or near the UCSB area, or
- Offer rides to others in the UCSB community

Access to the app is restricted to `@ucsb.edu` emails for both sign-up and login.

### User Roles

There are **two primary types of users**, with a potential third administrative role:

1. **Riders**
   - Users who are looking for rides
   - Can search for available rides
   - Can request or join a ride

2. **Drivers**
   - Users who offer rides
   - Can create ride listings
   - Can manage ride details (destination, time, available seats)

3. **Admins (optional / future role)**
   - Oversee platform usage
   - Can remove inappropriate or unsafe ride listings
   - Can manage user accounts if necessary

### User Goals & How the App Supports Them

- **Riders** want affordable, reliable transportation with people they trust.  
  - The app supports this by restricting access to the UCSB community and providing a centralized place to find rides.

- **Drivers** want to share rides, reduce travel costs, and coordinate passengers easily.  
  - The app allows them to post rides and manage rider participation.

- **Admins** want to maintain a safe and respectful platform.  
  - The app can provide moderation tools to remove problematic content.

---

## Framework

### Technologies Used

- **Platform**: iOS (via cross-platform development)
- **Frontend**: React Native  
  - Enables a single codebase for multiple platforms  
  - Integrates well with modern mobile UI development

- **Backend**: Node.js  
  - Works seamlessly with React Native  
  - Well-suited for API-based and real-time services

- **Authentication**: Firebase Authentication  
  - Provides secure user authentication  
  - Easily enforces `@ucsb.edu` email restrictions

### Why This Framework

This technology stack was chosen to:
- Enable rapid development and iteration
- Support scalable backend services
- Ensure secure authentication limited to the UCSB community
- Allow future expansion to additional platforms if needed

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



