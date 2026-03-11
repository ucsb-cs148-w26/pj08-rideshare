# Product Overview

The UCSB Rideshare app is a campus-focused carpool coordination platform for the UCSB community. It helps drivers host rides and riders join available rides, with built-in in-app messaging, profile/vehicle details, ride status tracking, and payment support for ride participation.

## Audience

UCSB students/faculty/staff:

- Aims to provide a method of reliable communication and coordination, leveraging community trust, for shared rides to common destinations
- Gives those willing to host rides an opportunity to split travel costs

## System Requirements

- Mobile device running a modern iOS (app currently runs via ExpoGo)
- Internet connection for real-time ride updates and messaging
- Valid account credentials to create an account - @ucsb.edu

## Profile

### Account Registration/Login

- Create an account via the register page with a valid @ucsb.edu email. Fill out all required fields.

  _Note: Adding a vehicle upon account creation is not necessary. To host a ride, a valid vehicle will need to be added to your profile. You may add vehicle(s) after creating your account in your edit profile page._

  Insert screenshot

- Login via the login page.

  Insert screenshot

### Edit Profile

- Edit your profile information in the edit tab. Feel free to upload your own profile picture or use some of our fun Gaucho preset icons!

  Insert screenshot

### Adding Vehicles

- Add/edit your vehicle information. Complete vehicle info is required before hosting rides.

  Insert screenshot

### Viewing Other User Profiles

- You can view other users' profiles from places like group chats and ride history participant lists.
- Profile pages help with trust and coordination by showing:
	- Their basic profile details (name, role, major, etc.)
	- Their Fun Fact
	- Their reviews and average rating (when available)

Insert screenshot

## User Roles

- Every user can act as both a rider and a driver.
- Rider role:
	- Browse available rides, join open seats, join waitlists for full rides, view your pickup PIN, and message your ride group.
- Driver role:
	- Post rides, set seat count/price/cancellation deadline, verify riders at pickup, start/end rides, and manage/cancel posted rides.
- You can switch between these roles at any time depending on the ride you are in.

## Joining a Ride (Rider flow)

### Quick Join (Home shortcut)

- On the Home page, the Quick Join section shows a few currently available rides.
- Tap any Quick Join card to open ride details immediately.
- You can join directly from that details flow, or tap View All Available Rides to open the full Join Ride page with search and filters.

Insert screenshot

1. Open Available Rides by clicking Join Ride.

	Insert screenshot

2. Scroll through all ride listings.
	1. Optionally, use the search bar at the top to type in a desired destination.

		Insert screenshot

	2. You can also use the filter drop down to filter rides by tags.

		Insert screenshot

	3. Return to viewing all ride listings by clicking "View all rides".

		Insert screenshot

3. View details of a ride by clicking "View Details"
4. Select "Join" to join a ride.
	1. If a ride is full, click "Join Waitlist" to be added to the waitlist.

		Insert screenshot

5. Confirm payment details to secure your seat.

	Insert screenshot

6. Find your ride's group chat in the messaging tab to communicate with your driver and fellow riders.

	Insert screenshot

## Hosting a Ride (Driver flow)

### Quick Create (Home shortcut)

- On the Home page, Quick Create gives one-tap templates (for example grocery run, downtown trip, airport/amtrak).
- Selecting a template opens the Host Ride form with key fields pre-filled (like tag, seats, and price), so posting is faster.
- You can adjust any pre-filled values before submitting.

Insert screenshot

1. On the Home page, click "Host Ride".

	Insert screenshot

2. Fill out the details on the host ride form and click submit to add the ride to available rides.

	Insert screenshot

	1. Use the addresses from the dropdown to help you set the To and From locations.

		Insert screenshot

	2. The cancellation time is the latest riders can cancel without a fee. The fee will be processed to the driver of the ride.

		Insert screenshot

	3. Select tags to help riders find your ride easily.

		Insert screenshot

	4. Add any additional notes.

		Insert screenshot

3. Monitor who is joining your ride as well as ride availability via the notifications center and group chat messages tab.

	Insert screenshot

4. When the posted ride time arrives, the "Start Ride" button will become available. Start the ride when scheduled.

	Insert screenshot

5. Communicate via group chat with your riders.
6. Complete post-ride flow.

	_Note: Riders can leave reviews (stars and comments) that will show up on your profile._

## Ride Management

### Group Chats

- A ride-linked group conversation is created for communicating in the Messages tab.
- Riders and drivers can coordinate pickup timing, updates, and any other necessary details.
- Riders who leave the ride are automatically removed from the group chat.
- Ride listing that are cancelled result in automatic group chat deletion.

Insert screenshot

### Active Ride

- When the "Start Ride" button becomes available, an active ride screen is provided for drivers and riders for the ride in progress.
- Driver Side:
	- Before starting, verify each rider using their 4-digit pickup PIN (or mark no-show if needed).
	- Once riders are processed, start the ride to move everyone into the in-progress screen.
	- During the ride, view live elapsed time and route details.
	- End the ride when complete. Riders are removed from the active state and the ride is moved to history.
- Rider Side:
	- Open My Rides and tap View Pin to see your 4-digit pickup PIN for driver verification.
	- After the driver starts the ride, you can access the ride-in-progress view showing route and timing details.
	- Riders can continue using group chat for coordination during the ride.

### Leaving a Ride/Cancellation Policy

- Riders can choose to leave a joined ride, subject to the cancellation policy. The driver is allowed to set a cancellation deadline. If the rider leaves _after_ the cancellation deadline, a fee set at 25% of the seat price is incurred. If the rider leaves _before_ the cancellation deadline, no fee is incurred. Riders are notified and clearly aware of the cancellation deadline throughout the app flow to ensure they don't miss the cancellation deadline.

### Post Ride/Transaction History

- The ride is ended when the driver clicks end ride. There is also an automatic timeout after a set interval if the driver forgets to click end ride.
- Post-ride completion, users can view their past rides in the history tab.
- History supports filters for role (hosted/joined), status, and time range so users can quickly find past trips.
- Tapping a ride opens ride details, including participants.
- Users can leave reviews for other participants (driver or rider) after the ride.
- Reviews must be submitted within 48 hours of ride completion.

Insert screenshot

## Payments and Cancellation Policy

- Joining a ride requires payment confirmation.
- Payment is processed before seat assignment is finalized.
- Cancellation deadlines are set per ride.
- Leaving after a deadline can trigger a cancellation fee. See details below:
- If a rider leaves before the cancellation deadline, no cancellation fee is charged.
- If a rider leaves after the cancellation deadline, a fee of 25% of the seat price is charged.
- For full rides, users may join a waitlist.
- Waitlist joins place a temporary card hold (not an immediate final charge).
- If a waitlisted rider gets promoted into a seat, the hold is captured and the rider is added to the ride.
- If a waitlisted rider leaves the waitlist, the hold is released.
- Users see cancellation deadline reminders before confirming join so expectations are clear in advance.

## Notifications and Updates

- Real-time ride listing updates (seat counts, status changes e.g. waitlists)
- In-app prompts for join confirmation, payment status, and errors
- Chat/message updates are tied to ride conversations
- Ride lifecycle updates (scheduled, new riders joined, active, completed, cancelled)

## Safety Measures

- @ucsb.edu users only to leverage community trust
- Driver/rider profile visibility to improve trust, accountability, and transparency
- Reviews and ratings for drivers to increase community engagement
- In-app group chat record for coordination to prevent personal numbers, details, etc. to be shared for external communication
- Payment confirmation and cancellation policy prompts before final actions

## Known Limitations

- The app is currently used through Expo Go (project workflow), so experience and setup can differ from a fully store-distributed build.
- Waitlist joining is restricted close to departure time (users cannot newly join waitlist within 24 hours of the ride).
- Some notification detail views are still basic (for example, fare adjustment breakdowns are not fully expanded yet).
- Additional Security Limitations Include: 
	- Reviews and ratings do not currently have content moderation handling. 
	- Users are not currently asked for license/registration/insurance information. 
	- DUO/2FA with SSO for UCSB.edu is only provided for fully deployed apps so this current version is unable to include it. 
	- There is no feature for reporting users for misconduct. There is also no privacy policy, etc. in place with this version.  
