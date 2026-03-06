# Contributions

---

## Moiez Baqar

### Summary

Served as the **product owner** for the Rideshare app throughout the quarter. Primary role was defining the app's overall vision, discussing requirements with the team, and providing UI and implementation direction that teammates then drafted into formal user stories and built out. Also contributed to testing, standup documentation, and conducted the team's AI experiment.

### Product Owner — Vision & Requirements

Led discussions and defined requirements for core features that shaped the direction of the app. These ideas and specifications were later formalized into user stories and implemented by teammates.

**UCSB Email Authentication** — Defined the requirement that the app restrict registration to `@ucsb.edu` emails to keep the platform limited to the UCSB community. Discussed validation rules, error handling, and security expectations with the team.

- [Issue #22](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/22)

**Home Screen & Navigation** — Outlined the post-login experience: a home screen with clear rider/driver options and a navigation bar for Messages, Profile, and Log Out so users wouldn't get lost.

- [Issue #70](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/70) · [Issue #72](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/72)

**Late Cancellation Notifications** — Specified the two-case notification logic: late cancellations notify only the driver with a warning, while normal departures notify the driver and all remaining riders.

- [Issue #141](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/141)

**Tag Dropdown (Host Page)** — Defined the acceptance criteria for the tag selection dropdown including inline expansion, colored dot indicators, placeholder states, and form validation.

- [Issue #297](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/297)

### Testing

**Unit Tests — UCSB Email Validation:** Created unit tests verifying that only `@ucsb.edu` emails are accepted, covering valid emails, non-UCSB domains, case insensitivity, and malformed inputs. Tests follow the AAA pattern.

- Closes [#199](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/199) and [#200](https://github.com/ucsb-cs148-w26/pj08-rideshare/issues/200)

### Documentation & Scribe

Maintained standup documentation during team check-ins.

- [PR #191 — Scrums Week 6 Lecture 1](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/191)
- [PR #205 — Standup Week 6 Lecture 2](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/205)
- [PR #226 — Completed Scrums](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/226)

### AI Experiment

Conducted an AI experiment using standup documentation as part of the team's AI usage exploration.

- Documented in [PR #205](https://github.com/ucsb-cs148-w26/pj08-rideshare/pull/205)

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

*WIP — contributions to be added.*

---

## Anna

*WIP — contributions to be added.*

---

## Wyatt

*WIP — contributions to be added.*

---

## Ruben

*WIP — contributions to be added.*