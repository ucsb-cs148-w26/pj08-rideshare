## ADDITIONAL INSTRUCTIONS FOR MVP DEMO

## Quick Start

### Prerequisites

- **Node.js** (v16+) - [Download](https://nodejs.org/)
- **Expo Go App** on your phone:
  - [iOS App Store](https://apps.apple.com/us/app/expo-go/id982107779)
  - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

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
```

### Testing on Your Phone

1. Run `npx expo start` in your terminal
2. Open **Expo Go** app on your phone
3. Scan the QR code:
   - **iOS**: Use Camera app to scan
   - **Android**: Use Expo Go app to scan
4. App will load on your phone!

## Functionality - Usage Instructions 
After logging in/registering with your information you will find two choices, Passenger (join a ride) and Driver (host a ride). All users have access to both experiences but you cannot host a ride if you don't have a vehicle registered in the app. 

### Passenger Side

**Browse & Book Rides:**
1. Launch the app and click the **Join Rides** button or view your joined rides
2. View all available rides listed by drivers in your area
3. Use **tag filters** associated with common locations UCSB students love (e.g., "Groceries/Shopping," "SBA/LAX," "Downtown SB") to narrow down options
4. Tap a ride card to view driver profile and route details
5. Select **"Join Ride"** to join the trip
6. Find your joined ride on the home page 
7. To coordinate with your driver and fellow riders, navigate to the messages tab through the home bar to chat with them. 
8. Rides that are full or rides you have already joined will be grayed out 

### Driver Side

**Hosting Rides:**
1. Click the **Host Rides** button. 
2. Fill in your **pickup location**, **dropoff location**, and **ride description**
3. Add **tags** to categorize your ride type to help users find it easily
4. Submit your ride listing to make it available to passengers
5. Chat with your passengers in the messages tab to coordinate pickup. 
6. Once your ride is full, it will gray out and no other riders can join 

### Key Features

- Real-time ride browsing for passengers
- Tag-based filtering to find preferred ride types
- Driver profile ratings and reviews
- Simple one-tap ride booking
- Real-time ride request notifications

## Known Problems
 - Search Bar is not supported in the MVP 
 - Only filtering can be done by tags in MVP 
 - Keyboard Blocks Last Fields in Driver Side, simply exit out of keyboard and select lower fields to fill 
 - You cannot leave rides as of now 
