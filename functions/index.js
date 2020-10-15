const functions = require('firebase-functions');
const express = require('express')
const app = express();
const FBAuth = require('./util/fbAuth');
const dotenv = require('dotenv').config()
const cors = require('cors');
const crypto = require('crypto');
const cookie = require('cookie');
const querystring = require('querystring');
const request = require('request-promise');
const axios = require('axios');
const { signup, login, addUserDetails, getUser} = require('./handlers/user');
const { shopifyLogin, shopifyRedirect} = require('./handlers/shopify');
const { db } = require('./util/admin');


app.use(cors());
app.post('/signup', signup);
app.post('/login', login);
app.get('/users', getUser);
app.post('/users', FBAuth, addUserDetails);

app.get('/shopify', shopifyLogin);
app.get('/shopify/callback', shopifyRedirect);


const main = express();
main.use('/api', app);

exports.main = functions.https.onRequest(main);
