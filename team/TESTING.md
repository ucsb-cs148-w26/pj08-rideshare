# Testing Documentation

This document outlines our current testing setup for the Rideshare App
(React Native + Expo Router), including both unit tests and higher-level
integration/component tests.

------------------------------------------------------------------------

# Testing Libraries

We use the following testing tools in our project:

## Jest (Test Runner)

-   **Why:** Jest provides assertions, mocking, watch mode, and coverage
    support.
-   **Use case:** Unit tests and integration/component tests.
-   **Documentation:** https://jestjs.io/

## jest-expo (Expo Preset)

-   **Why:** Provides proper environment configuration for testing React
    Native + Expo apps.
-   **Use case:** Allows Jest to correctly transform Expo modules and
    React Native components.

## React Native Testing Library (RNTL)

-   **Package:** `@testing-library/react-native`
-   **Why:** Enables testing components/screens the way users interact
    with them (press, type, render UI).
-   **Use case:** Integration/component testing of screens and user
    flows.
-   **Documentation:**
    https://callstack.github.io/react-native-testing-library/

## @testing-library/jest-native

-   **Why:** Adds React Native-specific matchers like
    `toBeOnTheScreen()`, `toHaveTextContent()`, etc.

------------------------------------------------------------------------

# Installation

``` bash
npm install --save-dev jest@29.7.0 jest-expo@51
npm install --save-dev react-test-renderer@19.1.0 --save-exact
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

------------------------------------------------------------------------

# 1️⃣ Unit Tests (Lab 05 Requirement)

### File: **tests**/unit/validation.unit.test.js

This file contains unit tests for the validation utilities in
`src/utils/validation.js`.

We test:

-   Email validation
-   UCSB email detection
-   Digit extraction
-   Phone formatting and validation
-   Password validation rules

These utilities are pure functions and are ideal for deterministic unit
testing.

------------------------------------------------------------------------

# 2️⃣ Higher-Level Testing (Lab 06 Requirement)

## File: **tests**/integration/notificationspage.integration.test.js

We implemented a component/integration test using React Native Testing
Library.

### What it tests

-   Subscribes to notifications (mocked Firestore subscription)
-   Renders notification rows
-   Opens a details modal when tapped
-   Marks notifications as read
-   Deletes notifications and removes them from the UI

### How we made the screen testable

-   Added stable `testID` attributes to key UI elements
-   Introduced light dependency injection for:
    -   subscribeToNotifications
    -   markRead
    -   deleteNotif

This allows us to simulate Firestore behavior without a real backend and
verify UI updates and handler calls.

### Why this qualifies as higher-level testing

This test renders a full screen, simulates real user interaction, and
verifies UI + business logic integration.

------------------------------------------------------------------------

# Running Tests

``` bash
npm test # for all tests
npm test unit # for unit tests only
npm test integration # for integration tests only
npm test -- --watch
npm test -- --coverage
```

------------------------------------------------------------------------

# Testing Strategy Going Forward

## Unit Tests

We will continue writing unit tests for:

-   Utility functions
-   Validation logic
-   Business-rule helpers (deadlines, seat calculations, permission
    logic)

## Integration/Component Tests

We plan to expand integration testing to cover:

-   Join Ride flow
-   Ride cancellation flow
-   Messaging screen basic functionality
-   Critical navigation flows

## Future Consideration: End-to-End (E2E)

We may adopt Detox for device-level E2E testing in the future once the
app stabilizes. For now, React Native Testing Library provides the best
balance of speed, maintainability, and coverage for our course timeline.

------------------------------------------------------------------------

# Summary

-   Unit tests implemented with Jest (validation utilities)
-   Integration/component test implemented with React Native Testing
    Library (Notifications screen)
-   Tests runnable via `npm test`
-   Clear path forward for expanded testing coverage
