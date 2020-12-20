const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().stripe.token);
const { admin, db } = require("../util/admin")


exports.createPaymentIntent = async (req, res) => {
  const { price, currency, customer_id, connectedAccount} = req.body;

  // Create or use a preexisting Customer to associate with the payment
  // Create a PaymentIntent with the order amount and currency and the customer id
  try{
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price * 100,
      currency: currency,
      application_fee_amount: price,
      transfer_data: {
        destination: `${connectedAccount}`,
      },
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
  catch(error) {
    console.log(error)
    return res.status(500).send({
      error: error.message
    });
  }
}






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






