# EVAL_RESPONSE.md  
**Team:** pj08-rideshare  
**Date:** 03/02/2026

---


# 1. Decisions Based on Feedback on Our USER_FEEDBACK_NEEDS.md

The reviewing team provided strong insights aligned with our evaluation goals. Based on their responses, we are making the following decisions:

---

## Registration Improvements

### Feedback Received
- Required fields were not clearly marked.
- UCSB email requirement was not explicitly stated.
- Some fields (Years at UCSB, Major) became uneditable.


### Team Decisions
- Add clear `* Required` indicators to all mandatory fields.
- Explicitly state: “You must use a @ucsb.edu email.” Since we can't add the UCSB SSO until we deploy our app
- Fix validation bug causing fields to become uneditable.

This directly addresses confusion identified in the Registration & Joining section.

---

## Safety & Trust Features

### Feedback Received
- Add driver ratings/reviews.
- Increase clarity around safety.
- Confidence rating was moderate (~3/5).

### Team Decisions
- We are currently working on the ratings/reviews logic.
- Add a basic driver rating system (1-5 stars).
- Clicking on the profile in the ride card leads to the profile of the driver. We plan to add a reviews button which will lead to a page of review.

Improving trust and safety will directly increase user confidence.

---

## Payment Clarity

### Feedback Received
- Confusion about whether payment happens before or after ride.
- Concern about how drivers are guaranteed payment.
- Some users preferred paying after the ride.

### Team Decisions
- We have integrated in-app payment now.
- The payment confirmation happens before the ride, but the money is on hold until the ride is over.

---

## Navigation Fixes

### Feedback Received
- Back button inconsistent.
- Some pages lack back buttons.
- Messages → Profile → Back goes to wrong page.
- Confusion between “searching” vs “joining.”

### Team Decisions
- Standardize back button behavior across all screens.
- Rename “Joined Rides” → “Upcoming Rides.”

Navigation improvements are a high priority.

---

## Notifications

### Feedback Received
- Want departure reminder (10 minutes before ride).
- Want message alerts.
- Want new ride notifications for recent searches.
- Suggestion: red dot for unread messages.

### Team Decisions
- Add red dot indicator for unread messages.
- Implement departure reminder notification.
- Add push notification for driver messages.

---

# 2. Response to Reviewers’ Understanding of Product Features

The reviewing team correctly understood the core features:

- Register with UCSB email
- Browse and join rides
- Host rides with pricing
- Messaging between riders and drivers

### What They Liked
- Clean UI
- Clear price display
- Simple hosting flow
- Functional filtering
- Professional design


### Our Plans
- Improve filter UI (dropdown).
- Redesign ride cards to include rating and reviews.
- Add a button in the Homepage, which has basic user information on how to use the app.

---

# 3. Effectiveness of Project in Current State (Robustness & UI/UX)

### Reviewer Observations
- App feels polished overall.
- UI is cohesive and professional.
- Filtering works well.
- Messaging works well.
- Minor bugs present.
- Navigation inconsistencies.
- Enter Location button non-functional.
- Validation behavior confusing.

### Our Actions

#### Immediate Bug Fixes
- Fix Enter Location functionality.
- Fix field validation locking bug.
- Fix navigation routing inconsistencies.

#### UX Improvements
- Convert tag input into dropdown selection.
- Add explicit validation messages.

The app is functional but requires stability improvements to feel production-ready.

---

# 4. Deployment Instructions & Repo Organization

No major issues were reported regarding:
- README clarity
- Deployment instructions
- Kanban Board organization

---

# 5. Final Closing Thoughts from Reviewers & Our Response

### What They Liked
- Useful concept
- Clean UI
- Clear pricing
- Messaging functionality

### Most Impactful Improvement Opportunity
- Improve safety and payment clarity.


### Team Reflection

We agree that safety and payment trust are the largest gaps between a functional prototype and a real-world usable product. These areas will guide our next sprint priorities.

---

# Additional Decisions Based on Sections 2–5

## From Section 2 (Feature Understanding)
- Rename “Joined Rides” → “Upcoming Rides.”
- Improve ride card clarity.

## From Section 3 (Robustness & UI)
- Add red notification indicator.
- Fix Enter Location button.
- Improve filtering UX.

## From Section 4 (Repo & Deployment)
- Improve README structure.

## From Section 5 (Closing Thoughts)
Primary focus:
1. Safety features (profile photos, ratings).
2. Payment clarity.
3. Navigation consistency.

Stretch goals:
- Driver review system with comments.

---


# Final Reflection

The feedback confirmed that our core concept is strong and usable. The biggest gaps are trust, clarity, and navigation polish. By addressing these areas, we believe the app can move from a functional prototype to a confidently usable system.