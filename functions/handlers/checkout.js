const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().stripe.token);


exports.createPaymentIntent = async (req, res) => {
  const { price, currency, customer_id} = req.body;

  // Create or use a preexisting Customer to associate with the payment
  // Create a PaymentIntent with the order amount and currency and the customer id
  const paymentIntent = await stripe.paymentIntents.create({
    amount: price,
    currency: currency,
    customer: customer_id
  });
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customer_id,
    type: 'card',
  });
  // Send publishable key and PaymentIntent details to client
  res.send({
    publicKey: 'pk_test_dpjyOGsBaKQFXRYd5gTVoBYL00mtQJMKeo',
    clientSecret: paymentIntent.client_secret,
    id: paymentIntent.id,
    paymentMethods: paymentMethods
  });
}



exports.chargeSavedCard = async (req, res) => {
  try {
    const { price, currency, customer_id} = req.body
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer_id,
      type: "card"
    });

    // Create and confirm a PaymentIntent with the order amount, currency, 
    // Customer and PaymentMethod ID
    console.log(paymentMethods.data[0])
    paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: currency,
      payment_method: paymentMethods.data[0].id,
      customer: customer_id,
      off_session: true,
      confirm: true
    });
    res.send({
      succeeded: true,
      clientSecret: paymentIntent.client_secret,
      publicKey: 'pk_test_dpjyOGsBaKQFXRYd5gTVoBYL00mtQJMKeo'
    });
  } catch (err) {
    if (err.code === "authentication_required") {
      // Bring the customer back on-session to authenticate the purchase
      // You can do this by sending an email or app notification to let them know
      // the off-session purchase failed
      // Use the PM ID and client_secret to authenticate the purchase
      // without asking your customers to re-enter their details
      res.send({
        error: "authentication_required",
        paymentMethod: err.raw.payment_method.id,
        clientSecret: err.raw.payment_intent.client_secret,
        publicKey: 'pk_test_dpjyOGsBaKQFXRYd5gTVoBYL00mtQJMKeo',
        amount: price,
        card: {
          brand: err.raw.payment_method.card.brand,
          last4: err.raw.payment_method.card.last4
        }
      });
    } else if (err.code) {
      // The card was declined for other reasons (e.g. insufficient funds)
      // Bring the customer back on-session to ask them for a new payment method
      res.send({
        error: err.code,
        clientSecret: err.raw.payment_intent.client_secret,
        publicKey: 'pk_test_dpjyOGsBaKQFXRYd5gTVoBYL00mtQJMKeo',
      });
    } else {
      console.log("Unknown error occurred", err);
    }
  }
};


exports.webhook = async (req, res) => {
  // Check if webhook signing is configured.
  let data, eventType;
  if (functions.config().stripe.webhook) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        functions.config().stripe.webhook
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }
  if (eventType === "payment_intent.succeeded") {
    // The payment was complete
    // Fulfill any orders, e-mail receipts, etc
    console.log("💰 Payment succeeded with payment method " + data.object.payment_method);
  } else if (eventType === "payment_intent.payment_failed") {
    // The payment failed to go through due to decline or authentication request 
    const error = data.object.last_payment_error.message;
    console.log("❌ Payment failed with error: " + error);
  } else if (eventType === "payment_method.attached") {
    // A new payment method was attached to a customer 
    console.log("💳 Attached " + data.object.id + " to customer");
  }
  res.sendStatus(200);
};






