const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const adminDb = getFirestore();

/**
 * Utility to generate a 4-digit PIN
 */

const generatePickupPin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

exports.createPaymentIntent = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { amount, rideId } = request.data;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new HttpsError("invalid-argument", "A valid positive amount is required.");
  }

  if (!rideId || typeof rideId !== "string") {
    throw new HttpsError("invalid-argument", "A valid rideId is required.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        rideId: rideId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || "",
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Stripe error:", error.message);
    throw new HttpsError("internal", error.message);
  }
});

exports.finalizeJoinRide = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { rideId, paymentIntentId } = request.data;
  const userId = request.auth.uid;
  const userEmail = request.auth.token.email || "";

  if (!rideId || !paymentIntentId) {
    throw new HttpsError("invalid-argument", "Missing rideId or paymentIntentId.");
  }

  try {
    // Verify with Stripe that the payment actually succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
       throw new HttpsError("failed-precondition", "Payment was not successful.");
    }

    const rideRef = adminDb.collection("rides").doc(rideId);
    const joinRef = rideRef.collection("joins").doc(userId);

    // Run the transaction securely on the server
    await adminDb.runTransaction(async (tx) => {
      const [rideSnap, joinSnap] = await Promise.all([
        tx.get(rideRef),
        tx.get(joinRef)
      ]);

      if (!rideSnap.exists) {
        throw new HttpsError("not-found", "This ride no longer exists.");
      }
      if (joinSnap.exists) {
        throw new HttpsError("already-exists", "You already joined this ride.");
      }

      const rideData = rideSnap.data();
      const seatsNum = Number(rideData.seats);

      // Prevent race conditions: What if 2 users pay for the last seat at the same time?
      if (!Number.isFinite(seatsNum) || seatsNum <= 0) {
        // Refund the user automatically because the seat was taken while they were paying!
        await stripe.refunds.create({ payment_intent: paymentIntentId });
        throw new HttpsError("resource-exhausted", "No seats left. Your payment has been refunded.");
      }

      // Generate the secure PIN
      const pickupPin = generatePickupPin();

      // Decrement seats
      tx.update(rideRef, {
        seats: seatsNum - 1,
        total_seats: rideData.total_seats ?? seatsNum,
      });

      // Save the joined user with their unique PIN
      tx.set(joinRef, {
        riderId: userId,
        riderEmail: userEmail,
        joinedAt: FieldValue.serverTimestamp(),
        pricePaid: Number(rideData.price) || 0,
        paymentIntentId: paymentIntentId,
        pickupPin: pickupPin, 
        status: "confirmed"
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Finalize Join Error:", error);
    throw new HttpsError(error.code || "internal", error.message);
  }
});

exports.createWaitlistHold = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { amount, rideId } = request.data;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new HttpsError("invalid-argument", "A valid positive amount is required.");
  }

  if (!rideId || typeof rideId !== "string") {
    throw new HttpsError("invalid-argument", "A valid rideId is required.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: "usd",
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      metadata: {
        rideId: rideId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || "",
        type: "waitlist_hold",
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Stripe waitlist hold error:", error.message);
    throw new HttpsError("internal", error.message);
  }
});

exports.cancelWaitlistHold = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { paymentIntentId } = request.data;

  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    throw new HttpsError("invalid-argument", "A valid paymentIntentId is required.");
  }

  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
    return { success: true };
  } catch (error) {
    console.error("Stripe cancel hold error:", error.message);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Promote the first person on the waitlist into the ride.
 * Captures their payment hold, adds them to joins, decrements seats,
 * removes them from waitlist, and creates a notification.
 */
exports.promoteFromWaitlist = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { rideId } = request.data;

  if (!rideId || typeof rideId !== "string") {
    throw new HttpsError("invalid-argument", "A valid rideId is required.");
  }

  try {
    // Get the ride to check if there are seats available
    const rideRef = adminDb.collection("rides").doc(rideId);
    const rideSnap = await rideRef.get();

    if (!rideSnap.exists) {
      return { promoted: false, reason: "Ride not found." };
    }

    const rideData = rideSnap.data();
    const seatsAvailable = Number(rideData.seats);

    if (!Number.isFinite(seatsAvailable) || seatsAvailable <= 0) {
      return { promoted: false, reason: "No seats available." };
    }

    // Get the first person on the waitlist (ordered by joinedAt)
    const waitlistSnap = await rideRef
      .collection("waitlist")
      .orderBy("joinedAt", "asc")
      .limit(1)
      .get();

    if (waitlistSnap.empty) {
      return { promoted: false, reason: "Waitlist is empty." };
    }

    const waitlistDoc = waitlistSnap.docs[0];
    const waitlistData = waitlistDoc.data();
    const riderId = waitlistDoc.id;
    const { paymentIntentId: holdId, riderEmail } = waitlistData;

    // Try to capture the payment hold
    let captureSuccess = false;
    if (holdId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(holdId);
        if (pi.status === "requires_capture") {
          await stripe.paymentIntents.capture(holdId);
          captureSuccess = true;
        } else {
          // Hold expired or already canceled — still promote but note no charge
          console.warn(`Hold ${holdId} status is ${pi.status}, cannot capture.`);
        }
      } catch (captureErr) {
        console.error("Failed to capture hold:", captureErr.message);
        // Still promote the rider even if capture fails
      }
    }

    // Run a transaction to add rider to joins, decrement seats, remove from waitlist
    await adminDb.runTransaction(async (tx) => {
      const freshRideSnap = await tx.get(rideRef);
      if (!freshRideSnap.exists) throw new Error("Ride no longer exists.");

      const freshRideData = freshRideSnap.data();
      const currentSeats = Number(freshRideData.seats);

      if (!Number.isFinite(currentSeats) || currentSeats <= 0) {
        throw new Error("No seats available.");
      }

      const joinRef = rideRef.collection("joins").doc(riderId);
      const joinSnap = await tx.get(joinRef);

      if (joinSnap.exists) {
        // Already joined somehow — just remove from waitlist
        tx.delete(rideRef.collection("waitlist").doc(riderId));
        return;
      }

      // Add to joins
      tx.set(joinRef, {
        riderId: riderId,
        riderEmail: riderEmail || "",
        joinedAt: FieldValue.serverTimestamp(),
        pricePaid: Number(freshRideData.price) || 0,
        paymentIntentId: holdId || "",
        promotedFromWaitlist: true,
      });

      // Decrement seats
      tx.update(rideRef, {
        seats: currentSeats - 1,
        total_seats: freshRideData.total_seats ?? currentSeats,
      });

      // Remove from waitlist
      tx.delete(rideRef.collection("waitlist").doc(riderId));
    });

    // Create a notification for the promoted rider
    await adminDb.collection("notifications").add({
      userId: riderId,
      type: "waitlist_promoted",
      title: "You Got a Seat!",
      body: "A spot opened up and you've been added to the ride. Your payment hold has been captured.",
      rideId: rideId,
      driverId: rideData.ownerId || "",
      fromAddress: rideData.fromAddress || "",
      toAddress: rideData.toAddress || "",
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
    });

    return {
      promoted: true,
      riderId: riderId,
      captureSuccess: captureSuccess,
    };
  } catch (error) {
    console.error("Promote from waitlist error:", error.message);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Leave a ride and immediately promote the first waitlisted user in one
 * server-side call so there is no client round-trip delay between the two.
 */
exports.leaveRideAndPromote = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { rideId } = request.data;
  if (!rideId || typeof rideId !== "string") {
    throw new HttpsError("invalid-argument", "A valid rideId is required.");
  }

  const leavingUid = request.auth.uid;
  const rideRef = adminDb.collection("rides").doc(rideId);

  try {
    // ── Step 1: Leave the ride ──────────────────────────────────────────
    let rideData;
    await adminDb.runTransaction(async (tx) => {
      const rideSnap = await tx.get(rideRef);
      const joinRef = rideRef.collection("joins").doc(leavingUid);
      const joinSnap = await tx.get(joinRef);

      if (!rideSnap.exists) throw new Error("Ride no longer exists.");
      if (!joinSnap.exists) throw new Error("You have not joined this ride.");

      rideData = rideSnap.data();
      const seatsNum = Number(rideData.seats) || 0;
      const totalSeatsRaw = Number(rideData.total_seats ?? seatsNum);
      const totalSeats = Number.isFinite(totalSeatsRaw) ? totalSeatsRaw : null;
      const nextSeats = totalSeats !== null
        ? Math.min(seatsNum + 1, totalSeats)
        : seatsNum + 1;

      tx.update(rideRef, {
        seats: nextSeats,
        total_seats: rideData.total_seats ?? seatsNum,
      });
      tx.delete(joinRef);
    });

    // ── Step 2: Promote the first waitlisted rider (if any) ─────────────
    const waitlistSnap = await rideRef
      .collection("waitlist")
      .orderBy("joinedAt", "asc")
      .limit(1)
      .get();

    let promoted = false;
    let promotedRiderId = null;

    if (!waitlistSnap.empty) {
      const waitlistDoc = waitlistSnap.docs[0];
      const waitlistData = waitlistDoc.data();
      promotedRiderId = waitlistDoc.id;
      const holdId = waitlistData.paymentIntentId;
      const riderEmail = waitlistData.riderEmail || "";

      // Capture the Stripe hold before committing the promotion
      if (holdId) {
        try {
          const pi = await stripe.paymentIntents.retrieve(holdId);
          if (pi.status === "requires_capture") {
            await stripe.paymentIntents.capture(holdId);
          }
        } catch (captureErr) {
          console.error("Failed to capture hold:", captureErr.message);
        }
      }

      await adminDb.runTransaction(async (tx) => {
        const freshRideSnap = await tx.get(rideRef);
        if (!freshRideSnap.exists) throw new Error("Ride no longer exists.");

        const freshRideData = freshRideSnap.data();
        const currentSeats = Number(freshRideData.seats);
        if (!Number.isFinite(currentSeats) || currentSeats <= 0) {
          throw new Error("No seats available for promotion.");
        }

        const promoteJoinRef = rideRef.collection("joins").doc(promotedRiderId);
        const existingJoin = await tx.get(promoteJoinRef);
        if (existingJoin.exists) {
          tx.delete(rideRef.collection("waitlist").doc(promotedRiderId));
          return;
        }

        tx.set(promoteJoinRef, {
          riderId: promotedRiderId,
          riderEmail: riderEmail,
          joinedAt: FieldValue.serverTimestamp(),
          pricePaid: Number(freshRideData.price) || 0,
          paymentIntentId: holdId || "",
          promotedFromWaitlist: true,
        });
        tx.update(rideRef, {
          seats: currentSeats - 1,
          total_seats: freshRideData.total_seats ?? currentSeats,
        });
        tx.delete(rideRef.collection("waitlist").doc(promotedRiderId));
        promoted = true;
      });

      if (promoted) {
        // Add promoted rider to the ride conversation
        const convoRef = adminDb.collection("conversations").doc(rideId);
        try {
          let promotedName = riderEmail;
          const promotedUserDoc = await adminDb.collection("users").doc(promotedRiderId).get();
          if (promotedUserDoc.exists) {
            promotedName = promotedUserDoc.data().name || promotedName;
          }
          await convoRef.update({
            participants: FieldValue.arrayUnion(promotedRiderId),
            [`participantNames.${promotedRiderId}`]: promotedName,
            [`lastReadAt.${promotedRiderId}`]: FieldValue.serverTimestamp(),
          });
        } catch (convoErr) {
          console.warn("Could not add promoted rider to conversation:", convoErr.message);
        }

        // Notification
        await adminDb.collection("notifications").add({
          userId: promotedRiderId,
          type: "waitlist_promoted",
          title: "You Got a Seat!",
          body: "A spot opened up and you've been added to the ride. Your payment hold has been captured.",
          rideId: rideId,
          driverId: rideData.ownerId || "",
          fromAddress: rideData.fromAddress || "",
          toAddress: rideData.toAddress || "",
          createdAt: FieldValue.serverTimestamp(),
          readAt: null,
        });
      }
    }

    return {
      success: true,
      promoted: promoted,
      promotedRiderId: promotedRiderId,
      ownerId: rideData.ownerId || "",
    };
  } catch (error) {
    console.error("leaveRideAndPromote error:", error.message);
    throw new HttpsError("internal", error.message);
  }
});