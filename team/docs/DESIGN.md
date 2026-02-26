# UCSB Rideshare App – Design Document

# Introduction

This design document describes the architecture, product rationale, and implementation plan for our rideshare app for the UCSB community. The project is grounded in a user-centered problem scenario and journey analysis, and was refined through sprint-based team decisions recorded in our repository meeting logs. Our goal is to deliver a reliable product that supports the core rider flow: request a ride, get matched, complete the trip, and handle post-ride actions clearly and safely.

This document explains how product decisions (scope, UX flow, and priorities) map to technical decisions (component structure, testing strategy, and iteration plan). It also captures tradeoffs made during development, including adjustments after MVP demo feedback, as well as the team practices that supported overall app quality and progress.

---

# Summary of Team Decisions

Since the beginning of the project, the team has made several consistent decisions that shaped both our process and product direction, as reflected in sprint meeting logs and team documentation.

1. **Prioritizing explicit collaboration structure early.**  
   An early team decision was to formalize operating practices rather than rely on informal coordination. This included defining role clarity, communication norms, and decision ownership. (See: `AGREEMENTS.md`, `NORMS.md`, `LEADERSHIP.md`, sprint meeting notes)

2. **Making explicit MVP tradeoffs and revisiting features after feedback.**  
   The team intentionally created a barebones app for the MVP release. We agreed to limit scope in order to deliver a stable and complete core experience. After the MVP demo, we revisited feature ideas and incorporated feedback following Agile methodology. (See: `MVP_DEMO.md`, `MVP_FOLLOWUP.md`, sprint meeting notes)

3. **Aligning features with documented scenario and journey artifacts.**  
   As we iterated on the app, we made a deliberate decision to ensure that each change aligned with documented user value from our problem scenario and user journey artifacts. This prevented us from adding features based solely on technical convenience. (See: `problem_scenario.md`, `user_journey.md`)

---

# User Experience Considerations

## High-Level Task / User Flow

The following outlines the primary app flow for driver and rider interaction. Edge cases and additional functionality are addressed in later sections.

1. **Start / Account Setup:**  
   Users enter the app and either register for a new account or log into an existing account. Registration requires UCSB-affiliated credentials to maintain community trust and safety.

2. **Joining a Ride:**  
   Users can browse available rides and choose which ones to join. Each ride listing displays the destination, departure time, available seats, and price so riders have the necessary information before requesting to join.

3. **Hosting a Ride:**  
   Users with a vehicle attached to their account can host a ride. They specify the destination, departure time, available seat count, price per rider, and cancellation deadline. The hosted ride then appears on the available rides list for others to join.

4. **Messaging:**  
   When a rider joins a ride, all participants are placed into a group chat with in-app messaging to support communication between riders and the driver. The chat is created when a rider joins and archived after the ride is marked complete. If a rider leaves before departure, they are removed from the group chat.

5. **Cancellation Policy and Payments:**  
   Users may cancel hosted rides with no fee. Riders may leave rides without penalty until the cancellation deadline set by the host, which is defined as a fixed window before departure time. After this deadline, leaving may incur a penalty cost to discourage last-minute cancellations. Full payment implementation is deferred post-MVP; the current MVP uses an honor system where riders are provided the driver’s Venmo or Zelle handle to complete payment outside the app.

6. **Completion and Post-Ride Actions:**  
   Ride completion is triggered by the driver. This clears the ride state from users’ landing pages and moves the ride to ride history for all participants. Any outstanding payments are settled at this stage. Users are prompted to leave an optional review and rating, which are stored internally and displayed on a host’s profile for future riders.

---

## Additional UX Considerations

- Restricted to valid `@ucsb.edu` users to create community trust  
- Users can view past rides and transaction history to track app usage  
- In-app notifications to drivers and riders when rides are joined and when group chats are active to streamline communication  
- Map integration to help users visualize locations and simplify location entry through dropdowns  
- Profile customizations that allow users to build familiarity within the community  
- Cancellation rules and policies handled by the app according to a standard basic cancellation policy rather than relying on informal agreements between drivers and riders



