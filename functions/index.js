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
  addUserDetails,
  getUser,
  storeNearCustomer,
} = require("./handlers/user");
const { shopifyLogin, shopifyRedirect } = require("./handlers/shopify");
const { productList, modifyInventory } = require("./handlers/product");
const { createPaymentIntent, webhook } = require("./handlers/checkout");
const { setupConnectedAccount } = require("./handlers/connectedAccount");

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

app.post("/webhook", webhook);

app.post("/modifyInventory", modifyInventory);

app.post("/setupConnectedAccount", setupConnectedAccount);

exports.api = functions.https.onRequest(app);
