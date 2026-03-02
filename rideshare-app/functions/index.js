const { onCall, HttpsError } = require("firebase-functions/v2/https");

exports.createPaymentIntent = onCall(async (request) => {
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