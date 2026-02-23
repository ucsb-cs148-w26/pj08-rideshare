/**
 * Unit Tests for Validation Utilities
 * Run with: npm test
 */

const {
    emailLooksValid,
    isUcsbEmail,
    digitsOnly,
    formatPhone,
    passwordHasMinLength,
    passwordHasSpecial,
    passwordHasUppercase,
    isValidPhone,
  } = require('../../src/utils/validation');
  
  // ============================================
  // EMAIL VALIDATION TESTS
  // ============================================
  
  describe('emailLooksValid', () => {
    it('should return true for valid email formats', () => {
      expect(emailLooksValid('test@example.com')).toBe(true);
      expect(emailLooksValid('user.name@domain.org')).toBe(true);
      expect(emailLooksValid('student@ucsb.edu')).toBe(true);
    });
  
    it('should return false for invalid email formats', () => {
      expect(emailLooksValid('')).toBe(false);
      expect(emailLooksValid('notanemail')).toBe(false);
      expect(emailLooksValid('missing@domain')).toBe(false);
      expect(emailLooksValid('@nodomain.com')).toBe(false);
    });
  
    it('should handle whitespace by trimming', () => {
      expect(emailLooksValid('  test@example.com  ')).toBe(true);
    });
  });
  
  describe('isUcsbEmail', () => {
    it('should return true for valid UCSB emails', () => {
      expect(isUcsbEmail('student@ucsb.edu')).toBe(true);
      expect(isUcsbEmail('STUDENT@UCSB.EDU')).toBe(true);
    });
  
    it('should return false for non-UCSB emails', () => {
      expect(isUcsbEmail('student@gmail.com')).toBe(false);
      expect(isUcsbEmail('student@ucla.edu')).toBe(false);
    });
  });
  
  // ============================================
  // PHONE VALIDATION TESTS
  // ============================================
  
  describe('digitsOnly', () => {
    it('should extract only digits from a string', () => {
      expect(digitsOnly('123-456-7890')).toBe('1234567890');
      expect(digitsOnly('(805) 555-1234')).toBe('8055551234');
    });
  
    it('should return empty string when no digits present', () => {
      expect(digitsOnly('no digits')).toBe('');
    });
  });
  
  describe('formatPhone', () => {
    it('should return empty string for empty input', () => {
      expect(formatPhone('')).toBe('');
    });
  
    it('should format phone numbers correctly', () => {
      expect(formatPhone('8055551234')).toBe('(805) 555-1234');
      expect(formatPhone('805')).toBe('(805');
      expect(formatPhone('805555')).toBe('(805) 555');
    });
  
    it('should truncate to 10 digits max', () => {
      expect(formatPhone('80555512345678')).toBe('(805) 555-1234');
    });
  });
  
  describe('isValidPhone', () => {
    it('should return true for 10-digit phone numbers', () => {
      expect(isValidPhone('8055551234')).toBe(true);
      expect(isValidPhone('(805) 555-1234')).toBe(true);
    });
  
    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('805555')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });
  
  // ============================================
  // PASSWORD VALIDATION TESTS
  // ============================================
  
  describe('passwordHasMinLength', () => {
    it('should return true for passwords with 8+ characters', () => {
      expect(passwordHasMinLength('12345678')).toBe(true);
      expect(passwordHasMinLength('longpassword')).toBe(true);
    });
  
    it('should return false for short passwords', () => {
      expect(passwordHasMinLength('1234567')).toBe(false);
      expect(passwordHasMinLength('')).toBe(false);
    });
  });
  
  describe('passwordHasSpecial', () => {
    it('should return true when password contains special characters', () => {
      expect(passwordHasSpecial('password!')).toBe(true);
      expect(passwordHasSpecial('pass@word')).toBe(true);
    });
  
    it('should return false when no special characters', () => {
      expect(passwordHasSpecial('password')).toBe(false);
      expect(passwordHasSpecial('Password123')).toBe(false);
    });
  });
  
  describe('passwordHasUppercase', () => {
    it('should return true when password contains uppercase', () => {
      expect(passwordHasUppercase('Password')).toBe(true);
      expect(passwordHasUppercase('ALLCAPS')).toBe(true);
    });
  
    it('should return false when no uppercase letters', () => {
      expect(passwordHasUppercase('password')).toBe(false);
      expect(passwordHasUppercase('12345678')).toBe(false);
    });
  });