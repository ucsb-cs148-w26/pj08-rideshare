const { generateRidePIN, shouldShowPIN } = require('../../src/utils/pin');

describe('generateRidePIN', () => {
  it('returns a 4-digit zero-padded string', () => {
    const pin = generateRidePIN('ride123', 'userABC');
    expect(pin).toMatch(/^\d{4}$/);
  });

  it('is deterministic – same inputs always produce the same PIN', () => {
    const a = generateRidePIN('ride1', 'user1');
    const b = generateRidePIN('ride1', 'user1');
    expect(a).toBe(b);
  });

  it('returns different PINs for different riders on the same ride', () => {
    const pinA = generateRidePIN('ride1', 'userA');
    const pinB = generateRidePIN('ride1', 'userB');
    expect(pinA).not.toBe(pinB);
  });

  it('returns different PINs for different rides for the same rider', () => {
    const pinA = generateRidePIN('rideX', 'user1');
    const pinB = generateRidePIN('rideY', 'user1');
    expect(pinA).not.toBe(pinB);
  });

  it('returns null when rideId is missing', () => {
    expect(generateRidePIN(null, 'user1')).toBeNull();
    expect(generateRidePIN('', 'user1')).toBeNull();
  });

  it('returns null when userId is missing', () => {
    expect(generateRidePIN('ride1', null)).toBeNull();
    expect(generateRidePIN('ride1', '')).toBeNull();
  });
});

describe('shouldShowPIN', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns false when rideDate is falsy', () => {
    expect(shouldShowPIN(null)).toBe(false);
    expect(shouldShowPIN(undefined)).toBe(false);
    expect(shouldShowPIN('')).toBe(false);
  });

  it('returns false when rideDate is an invalid string', () => {
    expect(shouldShowPIN('not-a-date')).toBe(false);
  });

  it('returns false when more than 30 minutes before ride', () => {
    const rideDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    jest.setSystemTime(new Date());
    expect(shouldShowPIN(rideDate.toISOString())).toBe(false);
  });

  it('returns true when exactly 30 minutes before ride', () => {
    const now = new Date('2026-03-01T10:00:00Z');
    const rideDate = new Date('2026-03-01T10:30:00Z');
    jest.setSystemTime(now);
    expect(shouldShowPIN(rideDate.toISOString())).toBe(true);
  });

  it('returns true when less than 30 minutes before ride', () => {
    const now = new Date('2026-03-01T10:15:00Z');
    const rideDate = new Date('2026-03-01T10:30:00Z');
    jest.setSystemTime(now);
    expect(shouldShowPIN(rideDate.toISOString())).toBe(true);
  });

  it('returns true after ride has started', () => {
    const now = new Date('2026-03-01T11:00:00Z');
    const rideDate = new Date('2026-03-01T10:30:00Z');
    jest.setSystemTime(now);
    expect(shouldShowPIN(rideDate.toISOString())).toBe(true);
  });

  it('accepts a Date object', () => {
    const now = new Date('2026-03-01T10:20:00Z');
    const rideDate = new Date('2026-03-01T10:30:00Z');
    jest.setSystemTime(now);
    expect(shouldShowPIN(rideDate)).toBe(true);
  });
});
