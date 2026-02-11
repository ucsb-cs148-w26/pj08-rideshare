# Testing Documentation

## Testing Libraries

We experimented with the following testing library for our React Native/Expo application:

### Jest (Test Runner)
- **Why:** Jest is a strong JavaScript testing framework with assertions, mocking, and code coverage support.
- **Use case:** Unit testing utility functions and validation logic.
- **Documentation:** https://jestjs.io/

## Installation

```bash
npm install --save-dev jest@29.7.0 jest-expo@51 --legacy-peer-deps
```

Add to `package.json`:
```json
"scripts": {
  "test": "jest"
},
"jest": {
  "testEnvironment": "node",
  "testMatch": ["**/__tests__/**/*.test.js"],
  "transform": {}
}
```

## Project Structure

```
rideshare-app/
├── __tests__/
│   └── validation.test.js    ← Unit tests
├── src/
│   └── utils/
│       └── validation.js     ← Validation utilities
└── team/
    └── TESTING.md            ← This file
```

## Test Files Implemented

### `__tests__/validation.test.js`

This file contains unit tests for the validation utilities in `src/utils/validation.js`:

| Function | Description | Tests |
|----------|-------------|-------|
| `emailLooksValid` | Validates email format | Valid emails, invalid emails, whitespace handling |
| `isUcsbEmail` | Checks for @ucsb.edu domain | UCSB emails, non-UCSB emails, case insensitivity |
| `digitsOnly` | Extracts digits from strings | Mixed input, empty strings, digit-only strings |
| `formatPhone` | Formats phone as (XXX) XXX-XXXX | Partial numbers, full numbers, truncation |
| `isValidPhone` | Validates 10-digit phone | Valid phones, invalid phones |
| `passwordHasMinLength` | Checks 8+ characters | Long passwords, short passwords |
| `passwordHasSpecial` | Checks for special characters | With/without special chars |
| `passwordHasUppercase` | Checks for uppercase letters | With/without uppercase |

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage
```

## Test Structure

We follow the AAA (Arrange-Act-Assert) pattern:

```javascript
describe('emailLooksValid', () => {
  it('should return true for valid email formats', () => {
    // Arrange & Act
    const result = emailLooksValid('test@example.com');
    
    // Assert
    expect(result).toBe(true);
  });
});
```

## Notes

- All test files are located in the `__tests__/` directory
- Test files follow the naming convention `*.test.js`
- Validation utilities use CommonJS (`module.exports`) for Jest compatibility