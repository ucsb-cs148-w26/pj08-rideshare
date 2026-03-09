# Contributions

---

## Moiez Baqar

### Summary

Served as the **product owner** for the Rideshare app throughout the quarter. Primary role was defining the app's overall vision, discussing requirements with the team, and providing UI and implementation direction that teammates then drafted into formal user stories and built out. Also contributed to developing core features, testing, standup documentation, and conducted the team's AI experiment.

### Product Owner — Vision & Requirements

Led discussions and defined requirements for core features that shaped the direction of the app. These ideas and specifications were later formalized into user stories and implemented by teammates.

**UCSB Email Authentication** — Defined the requirement that the app restrict registration to `@ucsb.edu` emails to keep the platform limited to the UCSB community. Discussed validation rules, error handling, and security expectations with the team.

- [Issue #22](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/22)

**Home Screen & Navigation Bar (Core implementation)** — Outlined the post-login experience: a home screen with clear rider/driver options and a navigation bar for Messages, Profile, and Log Out so users wouldn't get lost.

- [Issue #70](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/70) ·
 [Issue #72](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/72)

**Late Cancellation Notifications** — Specified the two-case notification logic: late cancellations notify only the driver with a warning, while normal departures notify the driver and all remaining riders.

- [Issue #141](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/141)

**Tag Dropdown (Host Page)** — Defined the acceptance criteria for the tag selection dropdown including inline expansion, colored dot indicators, placeholder states, and form validation.

- [Issue #297](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/297)

### Testing (Larger Contributions)

**Unit Tests — UCSB Email Validation:** Created unit tests verifying that only `@ucsb.edu` emails are accepted, covering valid emails, non-UCSB domains, case insensitivity, and malformed inputs. Ensuring security for students/vulnerabilities from login side.  Tests follow the AAA pattern.

- Closes [#199](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/199) and [#200](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/200)

### Documentation & Scribe

Maintained standup documentation during team check-ins, AI Experiemnt in a documentation/group setting, compilation of Contributions.

- [PR #191 — Scrums Week 6 Lecture 1](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/191)
- [PR #205 — Standup Week 6 Lecture 2](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/205)
- [PR #226 — Completed Scrums](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/226)
- [PR #350 - Contributions.md](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/350)

### AI Experiment

Conducted an AI experiment using standup documentation as part of the team's AI usage exploration.

- Documented in [PR #205](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/205)


### Code Reviews and PR Reviews 

## Code Reviews & Teammate PR Merges

Reviewed and merged pull requests from teammates throughout the project:
- [PR #353 — ride cards show location not address initially for cleaner UI](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/353)
- [PR #341 — standup for 03/04](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/341)
- [PR #340 — added custom preset options](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/340)
- [PR #300 — Created during ride page (UI with minimal functionality)](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/300)
- [PR #298 — show cancellation policy reminder before user confirms joining ride](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/298)
- [PR #287 — added forgot password feature plus character cap validation](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/287)
- [PR #252 — Testing Config Cleanup](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/252)
- [PR #239 — Ride Cancellation Notifications and Notification Page Improvements](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/239)
- [PR #234 — Notifications Icon + Notifications Page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/234)
- [PR #217 — added backend logic to the leave button](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/217)
- [PR #102 — added in app messaging through firebase](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/102)
- [PR #81 — Migrate navigation to Expo Router with auth + tabs](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/81)
- [PR #80 — Changed File Structure to Allow for Easier Routing Between Pages](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/80)
- [PR #77 — Refactor: extracted common styles and colors into reusable modules](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/77)
---

## Hien Huynh

### Summary

Throughout the development of the Rideshare app, Hien worked as a core full stack contributor and also served as the team scribe. From the first sprint, Hien was both writing code and documenting progress. By the end of the quarter, commits touched almost every part of the application including authentication, ride hosting, ride joining, cancellations, waitlists, account management, and the backend Cloud Functions that connect everything together.

Early in the project, Hien focused on building foundational features that other teammates could build on top of. This included the password field and validation rules on the registration screen ([PR #66](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/66)), which was one of the first UI pieces added to the authentication flow. Soon after, Hien built the rider form on the host page ([PR #83](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/83)), involving Firebase configuration, dependency installation, and the full form that drivers use to enter ride details and save them to Firestore.

After that, Hien added a tag system with unique color coding ([PR #86](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/86)) so drivers could visually categorize rides, then built the full profile and account settings page ([PR #98](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/98)), where users can manage personal information and vehicle details. That pull request alone introduced close to 500 lines of new code.

During the middle sprints, Hien shifted toward fixing bugs and improving the user experience. This included a login bug fix ([PR #101](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/101)) in the AuthProvider that prevented new users from reaching the home screen, a memo-related crash fix in the typing indicator component ([PR #110](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/110)), and a keyboard overlay bug fix ([PR #201](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/201)) using `KeyboardAvoidingView`.

On the backend side, Hien implemented the leave ride button logic ([PR #217](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/217)) and built the full driver-side ride cancellation flow ([PR #229](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/229)), one of the more complex features involving Firestore subcollection cleanup, cross-page status updates, and rider notifications.

In the later sprints, Hien added a forgot password flow and character cap validation ([PR #287](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/287)), improved joined rides loading performance ([PR #299](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/299)), and created a reusable `AddressAutocomplete` component ([PR #309](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/309)) using the Google Places API.

The largest contribution was the waitlist feature ([PR #333](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/333)), which included both frontend and backend work. On the join page, the UI allows riders to join a waitlist when a ride reaches capacity, see their position in the queue, and automatically move into the ride when a spot becomes available. On the backend, Firebase Cloud Functions using Firestore triggers handle the promotion logic. This pull request added more than 860 lines of new code across seven files.

In addition to writing code, Hien served as the **team scribe** throughout the entire quarter, documenting every standup, sprint check-in, and team meeting by recording progress updates, blockers, and next steps for each teammate. Most of the files inside the `meetings/` directory covering sprints 01 through 09 were written by Hien. Early team documents such as the NORMS and LEADERSHIP files were also contributed.

### Frontend Changes

**Password Field & Validation (Register Page)** — Implemented the password input field with a visibility toggle and added password strength validation on the registration screen.

- [PR #66 — Implemented password field and rules](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/66)

**Rider Form (Host Page)** — Built the rider form on the host page so drivers can enter ride details and store them in Firestore. Added the required Firebase configuration and package dependencies.

- [PR #83 — Added the riderForm](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/83)

**Tags Field with Color Coding (Host Page)** — Added a tag system to the host page with unique colors for each tag so drivers can visually categorize rides.

- [PR #86 — Added the tags field with unique colors per tag](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/86)

**Profile & Account Page with Vehicle Info** — Built the account and profile settings page including vehicle information fields, user validation checks, and a dedicated section for vehicle details.

- [PR #98 — Added user check for vehicle info plus profile settings](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/98)

**Login Bug Fix** — Fixed a login bug affecting the authentication layout and AuthProvider that prevented users from reaching the home screen after registering.

- [PR #101 — Fixed login bug](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/101)

**Typing Indicator Bug Fix** — Fixed a missing memo error in the typing indicator component used in group chat messaging.

- [PR #110 — Fixed missing memo error](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/110)

**Keyboard Blocking Fix** — Resolved a keyboard overlay issue across the register page, account page, and host page so users could scroll to and interact with all input fields.

- [PR #201 — Fixed the issue with the keyboard blocking the final fields](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/201)

**Forgot Password & Character Cap Validation** — Added a forgot password flow to the login screen and implemented character length validation on the registration page.

- [PR #287 — Added forgot password feature plus character cap validation](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/287)

**Joined Rides Performance Optimization** — Improved how joined rides load on the home page to reduce loading time and create a smoother user experience.

- [PR #299 — Joined rides now populate quicker](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/299)

**Address Autocomplete Component** — Created a reusable `AddressAutocomplete` component using the Google Places API so drivers can autofill pickup and dropoff addresses. Cleaned up comments and addressed privacy concerns.

- [PR #309 — Address auto fill](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/309)

**Waitlist UI (Join Page)** — Built the full waitlist interface on the join page allowing riders to join a waitlist when a ride is full, see their position in the queue, and automatically move into the ride when a spot becomes available.

- [PR #333 — Added waitlist logic](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/333)

### Backend Changes

**Leave Ride Backend Logic** — Implemented the Firestore backend logic that allows riders to leave a ride and updates rider counts and ride data accordingly.

- [PR #217 — Added backend logic to the leave button](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/217)

**Full Ride Cancellation Flow** — Built the complete driver-side cancellation process. This includes cleaning up Firestore subcollections, updating ride status across the app, and ensuring riders are properly notified.

- [PR #229 — Implemented the full cancellation process](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/229)

**Waitlist Backend (Firebase Cloud Functions)** — Implemented Firebase Cloud Functions that manage the waitlist system. Firestore triggers automatically promote riders when a spot opens and handle the required environment secrets.

- [PR #333 — Added waitlist logic](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/333)

### Scribe & Team Documentation

Served as the **team scribe** for Agile scrum check-ins throughout the quarter. Documented standups, sprint updates, and team meetings by recording each member's progress, blockers, and next steps. Wrote most of the files in the `meetings/` directory covering sprints 01 through 09.

Key documentation PRs:

- [PR #1 — NORMS](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/1)
- [PR #4 — Intro markdown file](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/4)
- [PR #13 — Lecture 02 scrums](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/13)
- [PR #18 — Scrums for 01/14](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/18)
- [PR #24 — Section 02 check-ins](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/24)
- [PR #34 — Leadership file](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/34)
- [PR #61 — Sprint 03 check-in](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/61)
- [PR #74 — 01/26 check-in](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/74)

---

## Kenisha

### User Story: Profile Picture

**Issue:** [#142 — As a user, I want to add a profile picture so that others can recognize me and feel safer](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/142) · **PR:** [#296](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/296)

Worked on the profile picture feature. Users can upload or take a photo, crop it, and have it show up everywhere in the app. This was the most complex story since it touched many different screens and had to handle different behavior on real devices vs. the iOS Simulator.

**UI: Profile Edit + Avatar Display Across App** — Made the profile edit screen work and got the profile photo showing up everywhere including the messages list, chat header, chat bubbles, participants modal, ride cards, and ride detail page. Falls back to a default emoji or initials if no photo is set.

- [Issue #145](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/145) · [PR #296](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/296)

**Add Image Cropping/Resizing** — Ensured uploaded photos get resized to the right dimensions. The avatar updates immediately after uploading and persists after reload.

- [Issue #146](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/146) · [PR #296](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/296)

**Decide Source: Upload or Camera** — Set up logic so that on a real device you get both Camera and Upload options, but on the iOS Simulator you only see Upload (since the camera doesn't work there). No crashes on any option.

- [Issue #143](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/143) · [PR #236](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/236)

**Privacy Default + Remove Photo Option** — Added a "Remove Photo" option that clears the profile picture and reverts to showing initials. The change shows up immediately across all screens.

- [Issue #147](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/147) · [PR #296](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/296)

### User Story: Ride Spot Availability

**Issue:** [#192 — As a rider, I want to see "x/total spots filled" on a ride so that I can quickly judge availability before joining](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/192) · **PR:** [#203](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/203)

Added seat tracking to rides so riders can see how many spots are left before joining.

**Add Fields: capacity, seats_taken** — Added two separate fields to each ride: total capacity and seats taken. The seats taken count increments automatically when someone joins; the total capacity stays the same.

- [Issue #193](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/193) · [PR #203](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/203)

**Update Ride Card UI to Display seats_taken/capacity** — Updated the ride card to show availability as "x/total seats". It updates live when someone joins and matches the style of the rest of the app.

- [Issue #194](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/194) · [PR #203](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/203)

### User Story: Core Navigation & Form Interactions

**Issue:** [#310 — As a UCSB student using the Rideshare app, I want core navigation and form interactions to work clearly and consistently](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/310) · **PR:** [#332](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/332)

Opened and closed all six sub-issues for this story, fixing navigation and form issues that came up in the user feedback evaluation.

**Add Red Notification Indicator for Unread Messages** — Added a red dot badge that shows up when you have unread messages, disappears once you open them, and updates in real time.

- [Issue #329](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/329) · [PR #332](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/332)

**Message Indicators in Navbar** — Made the navbar show a red dot with a number so you can see how many unread messages you have without opening the messages screen.

- [Issue #326](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/326) · [PR #332](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/332)

**Clarify UCSB Email Requirement During Registration** — Added a clear message on the registration form saying only `@ucsb.edu` emails are allowed. If a different email is used, an error appears immediately before form submission.

- [Issue #325](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/325) · [PR #332](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/332)

**Add Required Field Indicators in Registration** — Added `* Required` labels to all required fields in the registration form with inline error messages.

- [Issue #324](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/324) · [PR #332](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/332)

**Standardize Back Button Navigation** — Fixed the back button so it always navigates to the correct previous screen regardless of location in the app.

- [Issue #327](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/327) · [PR #332](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/332)

**Rename "Joined Rides" to "Upcoming Rides"** — Renamed "Joined Rides" to "Upcoming Rides" everywhere in the app since users found the old name confusing.

- [Issue #328](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/328) · [PR #332](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/332)

### Additional Features

**Allow Rider to Claim and Sign Up for a Ride** — Added the ability for riders to join a ride using a Join button and confirm their spot including payment confirmation.

- [Issue #46](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/46)

**Create a Register Page** — Built the registration page where new users sign up for the app, with all the required fields to create an account.

- [Issue #38](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/38) · [PR #65](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/65)

---

## Tanvi Ladha

### Summary

Throughout the development of the Rideshare app, Tanvi contributed as a developer, UI/UX lead, and active collaborator across product and design decisions. From the very first sprint, Tanvi was both writing code and helping shape the direction of the app, participating in discussions about how key flows like login, registration, active rides, and reviews should work, as well as contributing to early design and branding choices that the team built on throughout the quarter.

The earliest contributions helped establish the visual identity and structural foundation of the app, including creating the logo using Nanobanana and developing the initial UI layout, color scheme, and component structure that set the standard for the rest of the application. Tanvi also helped build the register and login pages, including core authentication UI, which formed the entry point into the entire app.

Beyond code and design, Tanvi played an active role in product thinking, contributing to discussions defining how features like login and registration flow, active ride management, and user reviews should behave, helping the team make decisions that shaped both the user experience and the technical implementation.

In later sprints, the focus shifted to feature enhancements and polish — implementing a search bar on the available rides page, adding a cancellation policy reminder before users confirmed joining a ride, building cancellation fee notifications to riders at 25% of the posted price, implementing a UI penalty indicator when a cancellation deadline was passed, and giving drivers the ability to set cancellation deadlines. Tanvi also handled the filtering of rides on the ride posting pages with both tags and location searches, and heavily worked on documentation throughout the quarter.

### App Features

*Note: certain PRs/code changes contributed could not be linked but feature changes are described below.*

**Logo Design & Branding** — Collaborated in designing the app logo using Nanobanana and established the initial color scheme and visual identity for the application.

**Initial UI Layout & Component Structure** — Built the foundational UI layout and component structure that the rest of the team used as the basis for subsequent screens and features throughout the quarter.

**Login Pages** — Built the registration and login screens including the core authentication UI, the entry point for the entire app. Contributed to design decisions around the registration and login flow. (PRs were shared with Anna at the beginning.)

**Filter by Tags Feature** — Added a filter-by-tags feature to the available rides page, allowing riders to narrow down rides visually by category.

- [PR #91 — filter by tags feature has been added, draft UI](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/91)

**Logo on Landing Page & UI Cleanup** — Added the app logo to the landing page and removed the confirm-and-pay placeholder to streamline the early UI.

- [PR #92 — added logo to landing page, took out confirm and pay](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/92)

**Joined Rides Display on Home Page** — Implemented the feature that shows rides a user has already joined on their home page, with a pop-up interaction. Developed the ride details card.

- [PR #97 — rides the user have joined are now displayed on their home page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/97)

**Search Bar on Available Rides Page** — Added search bar functionality to the available rides page so riders can search and filter rides more efficiently. Uses address dropdown and nearby locations with MapBox geocoding.

- [PR #331 — search bar functionality on available rides page added](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/331)

**Cancellation Policy Reminder** — Added a cancellation policy reminder dialog that appears before a user confirms joining a ride, ensuring riders are aware of the cancellation terms upfront.

- [PR #298 — show cancellation policy reminder before user confirms joining ride](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/298)

**Rider UI Penalty Indicator** — Implemented the rider-facing UI that reflects a penalty fee when the cancellation deadline has passed, making the cost of late cancellations visible to riders.

- [PR #243 — rider UI reflects penalty fee if cancellation deadline passed](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/243)

**Driver Cancellation Deadline Setting** — Built the backend logic and UI allowing drivers to set a cancellation deadline when posting a ride, enabling the cancellation fee enforcement system.

- [PR #218 — drivers can set cancellation deadline](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/218)

**Cancellation Fee Notification to Riders** — Implemented logic that triggers a cancellation fee notification to riders at 25% of the posted ride price when they cancel after the deadline.

- [PR #248 — cancellation fee notification to riders at 25% of posted price](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/248)

### Documentation Contributions

In addition to feature development, Tanvi took on a significant share of the team's documentation tasks including the user journey, problem scenario, and gathering team learnings. Tanvi was one of the retro leaders and ensured the team experiment went smoothly. Also led the planning and execution of the video script for the MVP demo and MVP documentation, completed the design document highlighting UX considerations, and wrote the app's user manual.

- [PR #5 — tanvi's initial commit](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/5)
- [PR #19 — README now includes audience, frameworks, and description of project](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/19)
- [PR #21 — user journey and problem scenario files](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/21)
- [PR #64 — LEARNING.md created](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/64)
- [PR #69 — first retro completed](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/69)
- [PR #100 — Retro 1 updated with team experiment results](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/100)
- [PR #106 — updated main readme and mvp_demo.md to reflect instructions for demo](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/106)
- [PR #219 — MVP_FOLLOWUP.md added as per lab05 requirements](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/219)
- [PR #284 — design.md created for lab07](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/284)
- [PR #346 — draft of user manual for lab 8](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/346)

---

## Joel

## Summary

Throughout the development of the Rideshare app, I worked as a full-stack contributor focused on core backend infrastructure, user-facing features, and payment integration. Starting with foundational Firebase authentication setup in the early sprints, I progressively expanded my work to include complex features like in-app messaging, profile access, and payment processing with Stripe. By the end of the quarter, my commits touched authentication flows, the host page, join page, messaging system, profile pages, and critical backend cloud functions.

Early in the project, I established the Firebase integration for the login system, which became the foundation for all subsequent authentication work. I then focused on the host page, building out features that allowed drivers to create and manage their rides—including displaying driver details, capturing driver notes, saving usernames, and enabling the host page to show all hosted rides on the landing page.

In the middle sprints, I pivoted to expanding the user experience across multiple sections of the app. I implemented the in-app messaging system using Firebase Realtime Database with a typing indicator component, allowing riders and drivers to communicate directly within the app. I then added profile page functionality and extended it across the application—making driver profiles viewable from both the home and join pages when clicking on driver names, and accessible from the chat interface as well.

In later sprints, I tackled one of the most complex integrations: Stripe payment processing for ride joining. This involved backend Cloud Functions setup, Firebase configuration, package management, and updates to the join page UI so riders could securely complete payments before joining a ride.

---

## Frontend Changes

### Firebase Authentication Setup
Established the foundational Firebase configuration and authentication system for the login flow, enabling user registration and sign-in functionality for the entire application.
- [PR #68 — Joel firebase](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/68)

### Host Page — Driver Details, Notes & Username Persistence
Built the initial driver details section on the host page, allowing drivers to see and manage ride information they create. Added the ability for drivers to include notes or special instructions for riders and implemented functionality to save the driver's username to the database when creating a ride.
- [PR #85 — Added optional driver details to hostpage.js](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/85)
- [PR #89 — Added userName to be saved to the database from host page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/89)
- [PR #93 — Added ability to add Driver Notes on hostpage](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/93)

### Display Hosted Rides on Landing Page
Implemented functionality to display all rides that a driver has hosted on the home/landing page, giving drivers quick visibility into their active listings. Modified home index page and host page to fetch and display hosted rides with styling.
- [PR #88 — Display hosted rides on landing page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/88)

### In-App Messaging System
Built a complete real-time messaging feature using Firebase Realtime Database, allowing riders and drivers to communicate within the app. Implemented the chat interface component with message history and real-time updates, created a reusable and memoized typing indicator component, and built messaging utilities with Firebase integration for message operations.
- [PR #102 — Added in app messaging through firebase](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/102)

### Profile Page Navigation & Cross-Page Profile Access
Extended the messaging feature by adding the ability to view a driver or rider's profile directly from the chat interface by clicking on their name. Later extended profile accessibility across the entire app by making driver profiles viewable from the home page and join page, updating tab navigation layout for profile routing.
- [PR #221 — View profile page from chat](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/221)
- [PR #265 — Click on profiles from home and join page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/265)

### Stripe Payment UI
Updated join page to integrate Stripe payment flows before ride confirmation. Modified authentication layout for payment context handling.
- [PR #306 — Add Stripe payment integration for ride joining](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/306)

---

## Backend Changes

### Stripe Payment Integration
Implemented end-to-end Stripe payment processing for ride joining, allowing riders to securely complete payments before joining a ride. This was one of the most technically complex features delivered, involving both frontend and backend components. Configured and initialized Firebase Cloud Functions (`functions/index.js`), set up the Stripe configuration module (`stripeConfig.js`), managed package dependencies, created `.gitignore` files for sensitive credential protection, and updated Firebase configuration for the payment backend.
- [PR #306 — Add Stripe payment integration for ride joining](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/306)

### Firebase Authentication Integration
Set up the foundational Firebase configuration and authentication backend that all subsequent user authentication depends on across the application.
- [PR #68 — Joel firebase](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/68)

### Real-Time Messaging Backend
Configured Firebase Realtime Database connections and built messaging utility functions for message operations, typing status, and real-time updates.
- [PR #102 — Added in app messaging through firebase](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/102)

---

## Documentation & Team Contributions

### Retrospective Documentation
Led the Sprint 3 retrospective and contributed to sprint retrospective analysis and team reflection documentation for the final sprint.
- [PR #318 — Retro 3](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/318)

---

## Anna

# Contributions — Anna Gornyitzki

## Summary

Throughout the development of the Rideshare app, I contributed as a frontend-focused developer across Sprints 1 through 9. I merged 11 pull requests, made 48 commits, and reviewed/merged PRs from teammates. My work centered on ride lifecycle features, UI improvements, privacy changes, bug fixes, and project documentation.

In the early sprints, I handled repository setup (README, LICENSE, .gitignore), pair-programmed the login page UI, and built the first version of the Join Page. I then iterated on pop-up card layouts, reorganizing information hierarchy, surfacing driver notes, and removing phone/email to address privacy concerns. I also fixed bugs in registration, phone number validation, and post-host redirect behavior.

In mid-project sprints, I implemented the Leave Ride button and confirmation modal, fixed the keyboard overlap issue across all form pages using `KeyboardAvoidingView`, cleaned up text casing and card styling for UI consistency, and added personalized fields (Pay Handle, Role, Years at UCSB, Major, Clubs) to registration and driver info pop-ups with backward compatibility for legacy accounts.

In later sprints, I built the Start Ride button UI with time-based activation, created the During Ride page (status bar, elapsed timer, route card, verify riders card, end ride button) along with `ActiveRideContext` for global state, and delivered the History Tab with filtering by role, status, and time range, View Details modals with participant name resolution, and a review button with 48-hour expiry logic.

Outside of code, I drafted user stories, maintained the Kanban board, recorded the MVP video, wrote user feedback documentation, and contributed to the team CONTRIBS file.

---

## Frontend Changes

### Login Page UI
Pair-programmed with Tanvi Ladha to create the login page UI.
- [PR #63 — Created login page UI](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/63)

### Join Page UI
Built the first and second iterations of the Join Page, establishing the layout for riders browsing available rides.
- Commits: `6bf7660` (Join Page UI v1), `205cf8b` (Join Page UI v2)

### Driver Notes Visibility & Redirect Fix
Made driver notes visible across all pop-up cards and fixed a bug where users were not redirected to the home screen after submitting a hosted ride.
- [PR #99 — Improve driver notes visibility and UI consistency](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/99)

### Pop-Up Card Reorganization
Restructured pop-up cards on the Join page and Home page — reordered ride info, driver info, and driver notes sections for clearer information hierarchy.
- [PR #107 — Reorganized pop-up card info](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/107)

### Privacy: Removed Phone & Email from Pop-Ups
Removed phone number and email from rider-facing pop-up cards to preserve driver privacy.
- [PR #108 — Removed phone and email from pop-ups](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/108)

### Keyboard Fix Across All Form Pages
Wrapped forms on the host page, account edit page, and registration page in `KeyboardAvoidingView`. Set `behavior="padding"` on iOS with `"height"` as Android fallback. Added `keyboardVerticalOffset` to account for the bottom nav bar height. Kept forms inside a `ScrollView` with `keyboardShouldPersistTaps="handled"` for input interaction while the keyboard is open.
- [PR #204 — Keyboard Fix v2](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/204)

### Leave Ride Button & Confirmation Modal
Added a Leave Ride button in pop-up cards for joined rides. Built a confirmation modal displaying cancellation penalties and waitlist rules, with a placeholder for cancellation deadline logic. Closes issues #124 and #125.
- [PR #216 — Added Leave Ride button for Riders, and Confirm Leave Ride Pop-up](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/216)

### UI Cleanup: Text Casing & Card Styling
Converted all uppercase text to normal case on the join and index pages. Made join page card styling consistent with the index page. Adjusted font sizes and weights for hierarchy. Changed tag color indicators from squares to circles.
- [PR #236 — Clean Up UI: Normal Case Text and Card Styling](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/236)

### Registration & Profile: Additional Fields
Added Pay Handle, Role (Undergraduate/Graduate/Faculty), Years at UCSB, Major, and Clubs fields to the registration page and driver info pop-up cards. Removed the old "bio" field. Fields are conditionally rendered (hidden if empty). Legacy accounts created before the update display correctly without the new fields.
- [PR #249 — Added more personal fields for registration/profile](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/249)

### Start Ride Button for Drivers
Added a "Start Ride" button on host ride cards. Button is grayed out and disabled by default, activating (teal color) when the scheduled ride time is reached. Added an ℹ️ info icon that shows an alert explaining activation timing. Sorted hosted rides by departure time (soonest first). Adjusted card layout so "View Details" and "Start Ride" buttons display side by side. Closes issue #261. UI only — no backend wiring.
- [PR #269 — Drivers now see a start button (no functionality)](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/269)

### During Ride Page
Created `rideshare-app/app/(tabs)/home/duringride.js` with the following components:
- "RIDE IN PROGRESS" status bar with green dot
- Elapsed timer using `startedAt` timestamp from context
- Route card showing pickup → destination, scheduled time, and driver name
- Verify Riders card — pulls riders from Firestore `joins` subcollection, displays each rider's name with a PIN input box and Verify button (UI only)
- "Drive safely!" card
- End Ride button — marks ride as `completed` in Firestore

Created `rideshare-app/src/context/ActiveRideContext.js` for global active ride state. Wired the "Start Ride" button on the homepage to set context and navigate to the during-ride page. Added a dynamic "Ride" tab (green car icon) in `nav-bar.js` that only renders when a ride is active. Wrapped app in `ActiveRideProvider` in `_layout.js`. Closes issue #262.
- [PR #300 — Created during ride page (UI with minimal functionality)](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/300)

### History Tab, End Ride Flow & Review Button Placeholders
Added a History tab accessible from the bottom nav bar (clock icon). Fetches all past rides (hosted and joined) from Firestore filtered to terminal statuses (`completed`, `cancelled`, `no_show`). Closes issues #335, #336, and #337. Includes:
- Role filter pills — All / Hosted / Joined
- Status dropdown filter — All Statuses / Completed / Cancelled / No-Show (with colored icons)
- Time range dropdown filter — All Time / Past Week / Past Month / Past 3 Months / Past Year
- Ride cards with colored status badges (green for Completed, red for Cancelled, amber for No-Show)
- View Details modal — route, date/time, price, seats, participant names resolved from Firestore
- Review button on each card — grays out and shows "Expired" after 48 hours from ride completion
- 48-hour review notice banner
- Loading spinner and empty states per filter combination
- End Ride confirmation modal with validation on the during-ride page
- [PR #344 — History Tab + UI Review Button Placeholders + Small UI fixes](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/344)

---

## Backend Changes

### Active Ride Context & State Management
Created `ActiveRideContext` (`rideshare-app/src/context/ActiveRideContext.js`) to store active ride state globally (ride ID, `startedAt` timestamp). Consumed by the during-ride page, nav bar, and homepage. Wrapped app in `ActiveRideProvider` in `_layout.js`.
- [PR #300 — Created during ride page (UI with minimal functionality)](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/300)

### End Ride Firestore Updates
Implemented End Ride logic that sets ride status to `completed` in Firestore and clears active ride context. Added End Ride confirmation modal with validation.
- [PR #300 — Created during ride page (UI with minimal functionality)](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/300)
- [PR #344 — History Tab + UI Review Button Placeholders + Small UI fixes](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/344)

### History Tab Firestore Queries
Built queries to fetch past rides (hosted and joined) filtered to terminal statuses. Resolved participant names from user documents for the View Details modal.
- [PR #344 — History Tab + UI Review Button Placeholders + Small UI fixes](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/344)

---

## Bug Fixes

### Register Bug Fix
Fixed a registration flow bug preventing users from completing sign-up.
- Commit: `2c344df`

### Phone Number Length Bug Fix
Fixed phone number length validation.
- Commit: `ab5f333`

### Bio Bug Fix
Fixed a bug with the bio field after the profile fields refactor.
- Commit: `7337999`

### History Navigation & Ride Status Lifecycle Fix
Fixed History tab navigation and UI issues. Implemented ride status lifecycle transitions.
- Commit: `daf80dc`

---

## Project Setup & Repository Management

### Initial Repository Setup
Created the README, added the MIT License, set up the .gitignore, and added app type and project details to the README.
- Commits: `95d70db`, `3b580f6`, `da44a3d`, `7d87456`

---

## Code Reviews & Teammate PR Merges

Reviewed and merged pull requests from teammates throughout the project:
- [PR #91 — tanvi-displayTags](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/91)
- [PR #92 — tanviladha](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/92)
- [PR #93 — updatedHostPageWithDriverDetails](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/93)
- [PR #106 — tanviladha](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/106)
- [PR #110 — gcBugFix](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/110)
- [PR #227 — wyatt](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/227)
- [PR #245 — k-profile-picture](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/245)
- [PR #299 — speedUp](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/299)
- [PR #304 — MoiezFilterCreationHostRides](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/304)
- [PR #332 — Updates_profile](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/332)
- [PR #342 — perRiderPinGeneration](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/342)

---

## Documentation

### User Feedback Documentation
Created and maintained `USER_FEEDBACK_NEEDS.md` to organize feedback received after the MVP presentation.
- Commits: `b6bd182`, `20b0c2d`

### User Stories & Kanban Board
Drafted user stories, added them to the Kanban board, and created additional stories based on post-MVP user feedback.
- Referenced in [week03-lecture02.md](meetings/sprint03/week03-lecture02.md), [week06-lecture01.md](meetings/sprint06/week06-lecture01.md)

### MVP Follow-Up & AI Experiment
Contributed to MVP_FOLLOWUP.md and conducted an AI experiment as part of the team's exploration of AI-assisted development.
- Referenced in [week05-lab05.md](meetings/sprint05/week05-lab05.md), [week06-lecture01.md](meetings/sprint06/week06-lecture01.md)


---

## Wyatt

*WIP — contributions to be added.*


---

## Ruben

## Summary

Throughout the development of the Rideshare app, I worked as a core full-stack contributor, participating actively across Sprints 1 through 9. Over the course of the project, I merged over 20 pull requests and made 66 commits, taking ownership of major architectural decisions, core feature implementations, and testing infrastructure.

Early in the project, I focused on system architecture and foundational setup to ensure our codebase could scale. I created a comprehensive architecture diagram to document our system design and component interactions. Alongside this, I implemented major file structure changes to organize the codebase for better maintainability. To ensure visual consistency moving forward, I centralized our common styles and colors by creating shared style modules, and I helped merge the initial pull requests related to our Firebase authentication setup.

As development progressed, I took on several critical full-stack features. I built the complete PIN Generation and Verification system, implementing the backend logic for per-rider secure ride verification and creating the frontend interface to display the PIN to riders. I also implemented the Driver Cancel Ride feature. For this, I developed a soft delete backend process to safely preserve ride history, built the cancel button UI with a driver note overlay, and resolved associated keyboard interaction issues that were breaking the modal experience.

Another major area of my contribution was the application's communication and notification systems. I built the complete notifications page from scratch—including rendering, deletion functionality, and detail modals—and set up the underlying backend infrastructure to support all notification types (such as ride canceled or ride created). Additionally, I implemented the group chat messaging system for ride participants and resolved crucial message routing bugs to ensure proper delivery and display.

In addition to feature development, I heavily prioritized quality assurance and documentation. I overhauled our testing configuration, reorganized the test file structure, and updated `TESTING.md` to establish best practices for the team. I also wrote comprehensive integration tests for critical features like the notifications page.
---

## Frontend Changes

### Notifications Page & UI Components
Built the complete notifications page including rendering, deletion functionality, and detail modals. Added the initial notifications button placeholder and later implemented the fully functional UI component.
- [PR #234 — Notifications Icon + Notifications Page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/234)
- [PR #239 — Ride Cancellation Notifications and Notification Page Improvements](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/239)

### PIN Display & Verification UI
Created the frontend interface to display the generated PIN to riders for ride confirmation and built the UI logic to accurately reflect verification status.
- [PR #343 — Display Pin To Rider](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/343)
- [PR #347 — Verify Rider Pin Logic + UI](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/347)

### Driver Cancel UI & Keyboard Fixes
Created the cancel button with a driver note overlay for cancellation messaging. Resolved keyboard interaction issues related to the cancel feature modal to ensure the UI remained usable.
- [PR #223 — Driver cancellation feature](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/223)

### Group Chat Interface
Implemented the frontend interface for the group chat messaging system for ride participants and fixed message routing bugs to ensure messages displayed correctly.
- [PR #109 — Groupchat Feature](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/109)
- [PR #283 — Routing Fix](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/283)

### Global Styling & UI Improvements
Centralized common styles and colors by refactoring `App.js` to use shared style modules. Fixed button sizing issues throughout the application for consistent UI and optimized image sizes.
- [PR #65 — Register Page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/65)
- [PR #77 — Refactor: extracted common styles and colors into reusable modules](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/77)
- [PR #80 — Changed File Structure to Allow for Easier Routing Between Pages](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/80)
- [PR #81 — Migrate navigation to Expo Router with auth + tabs](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/81)

---

## Backend Changes

### PIN Generation & Verification Backend
Implemented the backend logic for per-rider PIN generation to ensure secure ride verification. Documented all PIN generation and verification functions for developer reference.
- [PR #342 — Per-rider Pin Generation Upon Joining Ride](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/342)

### Driver Cancel Soft Delete
Implemented the backend functionality for the driver cancel ride feature, utilizing a soft delete approach to safely preserve ride history in the database.
- [PR #223 — Driver cancellation feature](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/223)

### Notifications Infrastructure
Built the backend infrastructure to support all current notification types, ensuring the system could properly handle and route events like ride cancellations and creations.
- [PR #239 — Ride Cancellation Notifications and Notification Page Improvements](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/239)

### Firebase Authentication Integration
Assisted with the backend setup and integration of Firebase authentication during the early stages of the project.
- [PR #65 — Register Page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/65)
- [PR #81 — Migrate navigation to Expo Router with auth + tabs](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/81)

---

## Architecture, Testing & Team Documentation

### System Architecture & Design
Created a comprehensive architecture diagram for the rideshare application to document system design and component interactions. Implemented major file structure changes to organize the codebase and updated design documentation with optimized images.
- [PR #301 — Architecture Overview/Diagram](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/301)
- [PR #348 — Design Doc Update](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/348)

### Testing Infrastructure
Fixed the global testing configuration and improved the test file structure for better organization. Updated `TESTING.md` and wrote comprehensive integration and unit tests for critical features.
- [PR #250 — Integration Test for Notif Page](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/250)
- [PR #251 — Test.md](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/251)
- [PR #252 — Testing Config Cleanup](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/252)
