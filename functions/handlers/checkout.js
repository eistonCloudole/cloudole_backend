const functions = require("firebase-functions");
const stripe = require("stripe")(functions.config().stripe.token);
const { admin, db } = require("../util/admin");
const orderid = require("order-id")("mysecret");

exports.createPaymentIntent = async (req, res) => {
  // const { items, currency, customer_id } = req.body;
  // price = calculatePrice(items);
  let customer_id = "cus_IeNvO3GTKGD7KV";
  // Create or use a preexisting Customer to associate with the payment
  // Create a PaymentIntent with the order amount and currency and the customer id
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 10000,
      currency: "cad",
      payment_method_types: ["card"],
      customer: customer_id,
    });

    const transfer = await stripe.transfers.create({
      amount: 7000,
      currency: "cad",
      destination: "acct_1I35N3IZgQOrwOU1",
      transfer_group: "distribute payment",
    });

    const secondTransfer = await stripe.transfers.create({
      amount: 2000,
      currency: "cad",
      destination: "acct_1I359OASYMyIsvvU",
      transfer_group: "distribute payment",
    });

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer_id,
      type: "card",
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      publicKey: "pk_test_dpjyOGsBaKQFXRYd5gTVoBYL00mtQJMKeo",
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      paymentMethods: paymentMethods,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: error.message,
    });
  }
};

const calculatePrice = (items) => {
  let price = 0;
  for (item of items) {
    price += item.price * item.quantity;
  }
  return price;
};

exports.createOrder = async (req, res) => {
  // tax rate?
  const { orders, buyerEmail, sellerEmail } = req.body;
  const orderTime = new Date().toISOString();
  let arriveTime = new Date();
  ArriveTime.setDate(ArriveTime.getDate() + 1);
  let totalFee = 0;
  let transactionDetail = [];
  let deliveryFee = 1;
  try {
    /* eslint-disable no-await-in-loop */
    for (order of orders) {
      const balanceTransaction = await stripe.balanceTransactions.retrieve(
        order.id
      );
      const orderId = orderid.generate();
      for (item of order.items) {
        totalFee += item.price * item.quantity;
        OrderDetail = {
          orderId: orderId,
          price: item.price,
          quantity: item.quantity,
          delivery: deliveryFee,
          stripeTransactionFee: balanceTransaction.fee / 100,
          orderTime: orderTime,
          arriveTime: arriveTime,
          itemInfo: order.itemInfo,
          // customerInfo: order.customerInfo,
          orderStatus: "processed",
        };
        db.collection("orders")
          .doc(buyerEmail)
          .set(
            { orderList: admin.firestore.FieldValue.arrayUnion(orderDetail) },
            { merge: true }
          );
        db.collection("orders")
          .doc(sellerEmail)
          .set(
            { orderList: admin.firestore.FieldValue.arrayUnion(orderDetail) },
            { merge: true }
          );
        transactionDetail.push(orderDetail);
      }
      totalFee += deliveryFee + balanceTransaction.fee / 100;
    }
    return res.status(201).json({
      totalFee: totalFee,
      transactionDetail: transactionDetail,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getOrder = async (req, res) => {
  email = req.header("email");
  order = await db.collection("orders").doc(email).get();
  return order.data();
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
    console.log(
      "💰 Payment succeeded with payment method " + data.object.payment_method
    );
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
