const functions = require("firebase-functions");
const stripe = require("stripe")(functions.config().stripe.token);
const { admin, db } = require("../util/admin");
const orderid = require("order-id")("mysecret");

exports.createPaymentIntent = async (req, res) => {
  const { items, currency, customer_id} = req.body;
  price = calculatePrice(items);
  // let customer_id = "cus_IeNvO3GTKGD7KV";
  // Create or use a preexisting Customer to associate with the payment
  // Create a PaymentIntent with the order amount and currency and the customer id
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 10000,
      currency: currency,
      payment_method_types: ["card"],
      customer: customer_id,
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

exports.receivePayment = async (req, res) => {
  const { account, amount, currency, password, email } = req.body;
  try {
    passwordRef = db.collection("password").doc(email);
    doc = await passwordRef.get();
    if (!doc.exists) {
      return res.status(400).json({ error: "No such password" });
    }
    if (password !== doc.data().password) {
      return res.status(400).json({ error: "Wrong password" });
    }
    const transfer = await stripe.transfers.create({
      amount: amount * 100,
      currency: currency,
      destination: account,
      transfer_group: "distribute payment",
    });
    return res.status(201).json(transfer);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.createOrder = async (req, res) => {
  // tax rate?
  const { orders, buyerEmail } = req.body;
  const orderTime = new Date().toISOString();
  let totalFee = 0;
  let transactionDetail = [];
  let deliveryFee = 2.99;
  // order = [{email, barcode, quantity, locationId}]
  try {
    /* eslint-disable no-await-in-loop */
    const groupedOrder = orders.reduce(
      (acc, cur) => ({ ...acc, [cur.email]: [...(acc[cur.email] || []), cur] }),
      {}
    );
    for (email in groupedOrder) {
      const userRef = db.collection("users").doc(email);
      const user = await userRef.get();
      const shopName = user.data().userCredential.shopName;
      const shopifyToken = user.data().userCredential.shopifyToken;
      const shopProduct = await shopifyProductList(shopName, shopifyToken);
      const orderId = orderid.generate();
      const password = Math.floor(1000 + Math.random() * 9000);
      let verification = {
        orderId: orderId,
        password: password,
      };
      db.collection("password").doc(email).set({
        verification,
      });
      for (item of groupedOrder[email]) {
        const param = {
          inventory_item_ids: shopProduct[item.barcode].inventory_item_id,
          location_ids: item.locationId,
        };
        const inventoryData = await getInventory(shopName, shopifyToken, param);
        if (
          inventoryData.inventory_levels &&
          inventoryData.inventory_levels[0].available >= item.quantity
        ) {
          const price = shopProduct[item.barcode].price * item.quantity;
          const stripeTransactionFee = price * 0.03 + 0.3;
          OrderDetail = {
            orderId,
            unitPrice: shopProduct[item.barcode].price,
            price,
            quantity: item.quantity,
            deliveryFee,
            stripeTransactionFee,
            orderTime: orderTime,
            product: shopProduct[item.barcode],
            orderStatus: "processed",
          };
          db.collection("orders")
            .doc(buyerEmail)
            .set(
              {
                orderList: admin.firestore.FieldValue.arrayUnion({
                  ...orderDetail,
                  buyer: true,
                }),
              },
              { merge: true }
            );
          db.collection("orders")
            .doc(sellerEmail)
            .set(
              {
                orderList: admin.firestore.FieldValue.arrayUnion({
                  ...orderDetail,
                  seller: true,
                }),
              },
              { merge: true }
            );
          transactionDetail.push(orderDetail);
          totalFee += price + deliveryFee + stripeTransactionFee;
        }
      }
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
