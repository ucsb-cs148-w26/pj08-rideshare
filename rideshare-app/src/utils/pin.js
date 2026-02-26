/**
 * Ride PIN Utilities
 *
 * Generates a deterministic 4-digit verification PIN for a ride so the rider
 * can confirm they are meeting the correct driver. The PIN is derived from
 * the rideId and the rider's userId, so every rider on the same ride gets
 * their own unique PIN, but it stays the same every time they open the card.
 *
 * The PIN should only be revealed to the rider within 30 minutes of the
 * ride's scheduled start time.
 */

/**
 * Simple string-hash (djb2) that returns a positive 32-bit integer.
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0; // unsigned 32-bit
  }
  return hash;
}

/**
 * Generate a deterministic 4-digit PIN (0000 – 9999) for a rider on a ride.
 *
 * @param {string} rideId  – Firestore ride document ID
 * @param {string} userId  – Firebase Auth UID of the rider
 * @returns {string} A zero-padded 4-digit PIN, e.g. "0472"
 */
function generateRidePIN(rideId, userId) {
  if (!rideId || !userId) return null;
  const hash = hashString(`${rideId}::${userId}`);
  return String(hash % 10000).padStart(4, '0');
}

/**
 * Determine whether the PIN should be shown to the rider right now.
 *
 * The PIN is visible starting 30 minutes before the ride's scheduled
 * departure time and remains visible afterwards (so the rider can still
 * read it upon arrival).
 *
 * @param {string|Date} rideDate – the ride's scheduled start (ISO string or Date)
 * @returns {boolean}
 */
function shouldShowPIN(rideDate) {
  if (!rideDate) return false;
  const start = new Date(rideDate);
  if (isNaN(start.getTime())) return false;

  const now = new Date();
  const thirtyMinBefore = new Date(start.getTime() - 30 * 60 * 1000);
  return now >= thirtyMinBefore;
}

module.exports = {
  generateRidePIN,
  shouldShowPIN,
};
