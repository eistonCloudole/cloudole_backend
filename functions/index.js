const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/fbAuth");
const dotenv = require("dotenv").config();
const cors = require("cors");
const crypto = require("crypto");
const cookie = require("cookie");
const nonce = require("nonce")();
const querystring = require("querystring");
const request = require("request-promise");
const axios = require("axios");

app.use(cors());

const { db } = require("./util/admin");

const {
  signup,
  login,
  storeToken,
  storeNearCustomer,
} = require("./handlers/user");
const { shopifyLogin, shopifyRedirect } = require("./handlers/shopify");
const {
  productList,
  modifyInventory,
  getLocation,
  savePrice,
} = require("./handlers/product");
const {
  createPaymentIntent,
  webhook,
  createOrder,
  getOrder,
  receivePayment,
} = require("./handlers/checkout");

const { setupConnectedAccount } = require("./handlers/connectedAccount");

app.post("/storeToken", storeToken)
app.post("/signup", signup);
app.post("/login", login);

app.get("/shopify", shopifyLogin);
app.get("/shopify/callback", shopifyRedirect);

app.get("/token", (req, res) => {
  return res.status(200).send("accessToken: " + req.app.get("access_token"));
});

app.get("/productList", productList);

app.get("/storeNearCustomer", storeNearCustomer);

app.post("/checkout", createPaymentIntent);
app.post("/createOrder", createOrder);
app.get("/getOrder", getOrder);

app.post("/webhook", webhook);

app.post("/modifyInventory", modifyInventory);

app.post("/setupConnectedAccount", setupConnectedAccount);

app.get("/getLocation", getLocation);

app.get("/getOrder", getOrder);

app.post("/savePrice", savePrice);

app.post("/receivePayment", receivePayment);

exports.api = functions.https.onRequest(app);
