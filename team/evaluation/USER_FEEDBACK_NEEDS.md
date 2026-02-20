# User Feedback Needs

This document outlines the top three areas where we would most value user feedback to improve the UCSB Rideshare App experience. These are designed for inter-team evaluation with 7 testers by **02/26/26**.

---

## 1. Pricing Display and Payment Information Clarity (PRIORITY)

### What We Want to Learn
Whether users can easily understand pricing, find payment information, and feel confident about the financial aspects of joining/hosting a ride.

### Specific Testing Tasks for Evaluators (15 minutes)
Please complete these tasks and answer the questions:

1. **Browse 3-5 available rides in the Join page**
   - On a scale of 1-5, how easy was it to see the price for each ride at a glance?
   - Did the price display give you enough information to decide whether to join? (Yes/No - explain)
   - What additional pricing information would you want to see on the ride card itself? (e.g., price per person, total cost breakdown, payment method accepted)

2. **Join one ride (or view the join confirmation modal)**
   - Before confirming, could you see: (Yes/No for each)
     - Total price you'll pay?
     - What happens if you need to cancel?
     - How you'll pay the driver?
   - Rate clarity of pricing in the confirmation screen (1-5 scale)

3. **Host a ride**
   - On a scale of 1-5, how clear was it how to set your price?
   - Did you understand how riders will pay you? (Yes/No)
   - Would you want guidance on what to charge (e.g., suggested prices based on destination)? (Yes/No)

4. **View your profile/account page**
   - Could you find where to add/edit your Venmo handle? (Yes/No)
   - On a scale of 1-5, how clear is it that payment happens outside the app via Venmo/Zelle?

### Critical Questions
- **What confused you most about pricing/payment?** (open-ended)
- **Would you feel confident paying/receiving money before experiencing the actual payment flow?** (Yes/No + explain)
- **Rank desired features** (1=most wanted, 5=least wanted):
  - See driver's Venmo handle before joining
  - Price per person calculator
  - Suggested/recommended pricing
  - Payment deadline reminders
  - In-app payment integration

### Why This Matters
Pricing transparency is our #1 concern for user trust. We've heard anecdotal confusion about when/how payment happens, and want concrete data on where to improve.

---

## 2. Ride Browsing and Information Findability

### What We Want to Learn
How quickly users can find relevant rides and whether our UI effectively highlights the information they need to make decisions.

### Specific Testing Tasks for Evaluators (10 minutes)

**Scenario**: Imagine you need a ride to LAX airport on Saturday at 2 PM, and you're looking for the cheapest option.

1. **Go to the Join page and find a suitable ride**
   - Time yourself: How many seconds did it take to find a ride to LAX?
   - How many rides did you have to read before finding one to LAX?
   - Did you use the tag filter system? (Yes/No) If yes, was it helpful? (1-5 scale)

2. **Look at the ride cards without tapping into details**
   - Can you see these details on each card: (Yes/No/Unclear for each)
     - Where the ride is going?
     - When the ride departs (date + time)?
     - How many seats are left?
     - How much it costs?
     - Who is driving?
   - What information is MISSING that you'd want to see before clicking "View Details"?

3. **Tap "View Details" on 2-3 different rides**
   - On a scale of 1-5, how much NEW useful information did the detail modal show?
   - Should more/less/different information be on the main card vs. detail modal? (explain)

4. **Rate the color-coded tags** (Downtown=red, SBA=yellow, LAX=green, etc.)
   - On a scale of 1-5, how helpful is the colored tag system?
   - Can you easily distinguish between different trip types? (Yes/No)
   - Alternative suggestion: What would be a better way to categorize/filter rides?

5. **Navigate to your Homepage**
   - On a scale of 1-5, how easy is it to distinguish "Rides I've Joined" from "Rides I'm Hosting"?
   - Any confusion about the layout? (open-ended)

### Critical Questions
- **What was the MOST frustrating part of finding a ride?** (open-ended)
- **If we could only improve ONE thing about ride browsing, what should it be?** (open-ended)
- **Would a map view (instead of/in addition to list view) be valuable?** (Yes/No + why)

### Why This Matters
Browse-to-join is the core conversion funnel. If users can't quickly scan and identify suitable rides, the app fails its primary purpose.

---

## 3. App Reliability and Technical Issues

### What We Want to Learn
What bugs, glitches, crashes, or confusing behaviors users encounter during normal app usage.

### Specific Testing Tasks for Evaluators (10 minutes)

Please test the following features and report any issues:

1. **Real-time updates**
   - Have evaluator #1 host a ride with 3 seats
   - Have evaluator #2 join that ride
   - **Evaluator #1**: Did you see that someone joined your ride? How long did it take to update? Did you get a notification?
   - **Evaluator #2**: Did the seat count decrease immediately after you joined? (Yes/No + how long it took)
   - Rate responsiveness of real-time updates (1-5 scale)

2. **Messaging system**
   - After joining a ride, go to the Messages tab
   - Send a message to the ride group
   - **Both evaluators**: Did message appear immediately? (Yes/No + delay time)
   - Did you see the typing indicator when the other person was typing? (Yes/No)
   - Any glitches in the messaging interface? (describe)

3. **Filter and search functionality**
   - On Join page, use the tag filters to show only "LAX" rides
   - On a scale of 1-5, how smoothly did filtering work?
   - Did it ever show incorrect results or fail to filter? (Yes/No + describe)

4. **Leave/Cancel ride flow**
   - **Evaluator #2**: Try to leave the ride you joined
   - Was the cancellation fee (25% of price) clearly shown? (Yes/No)
   - Did leaving the ride work correctly? (Yes/No)
   - **Evaluator #1**: Did you see the seat count increase back? (Yes/No + delay)
   - Did you receive a notification that someone left? (Yes/No)

5. **General stability**
   - Track your entire testing session: Note any of these that occur:
     - App crashes or freezes (when?)
     - Buttons that don't respond to taps (which ones?)
     - Loading screens that hang (where?)
     - UI elements that overlap or display incorrectly (screenshot if possible)
     - Error messages (what did they say?)
     - Any feature that behaved unexpectedly (describe)

### Critical Questions
- **Did you encounter ANY bugs or errors?** (Yes/No - if yes, describe each)
- **On a scale of 1-5, how reliable/stable did the app feel overall?**
- **Did anything feel slow or laggy?** (Yes/No - what specifically?)
- **What was the most severe technical issue you encountered?** (open-ended)
- **Would you trust this app for a real ride you needed?** (Yes/No + why/why not)

### Why This Matters
We're preparing for wider campus launch. Critical bugs need to be identified and fixed before real users depend on the app for actual transportation needs.

---

## Testing Logistics for Inter-Team Evaluation

### Evaluator Instructions

**Time Required**: ~35-40 minutes total
- Section 1 (Pricing): 15 minutes
- Section 2 (Browsing): 10 minutes  
- Section 3 (Reliability): 10 minutes
- Additional feedback: 5 minutes

**What You'll Need**:
- A phone with Expo Go app installed
- A UCSB email address for authentication
- Ability to coordinate with at least one other evaluator for real-time testing (Section 3)

**How to Provide Feedback**:
- We'll provide a Google Form with all questions from this document
- Take screenshots of any bugs or confusing UI elements
- Be brutally honest - we want to improve!

---

## Prioritization for 02/26/26 Evaluation

Given time constraints, we recommend evaluators focus on sections in this order:

1. **Section 1 (Pricing) - MANDATORY** - This is our top priority concern based on user complaints
2. **Section 3 (Reliability) - HIGHLY RECOMMENDED** - Critical bugs need identification before launch
3. **Section 2 (Browsing) - IF TIME PERMITS** - UI improvements are important but less urgent

If evaluators only have time for one section, please complete **Section 1**.

---

## What We'll Do With Your Feedback

Based on your responses by 02/26/26, we will:

1. **Immediate fixes** (by 03/01/26): Critical bugs that prevent core functionality
2. **Sprint planning** (week of 03/03/26): Prioritize UI improvements based on feedback severity
3. **Design iteration** (by 03/15/26): Revise pricing display and information architecture
4. **Follow-up testing** (by 03/22/26): Validate that your feedback was addressed

---

## Success Metrics for This Evaluation

We will consider this feedback collection successful if we achieve:

- All 7 evaluators complete Section 1 (Pricing)
- At least 5 evaluators complete Section 3 (Reliability)  
- At least 3 evaluators complete Section 2 (Browsing)
- Identify at least 5 specific, actionable improvements
- Receive at least 3 critical bug reports (if any exist)
