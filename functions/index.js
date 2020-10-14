const functions = require('firebase-functions');
const express = require('express')
const app = express();
const FBAuth = require('./util/fbAuth');
const dotenv = require('dotenv').config()
const cors = require('cors');
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const axios = require('axios');


app.use(cors());

const { db } = require('./util/admin');

const apiKey = '3184f521fc3473624d2142ae452aaec6';
const apiSecret = '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';
const scopes = 'read_products';
const forwardingAddress = "https://cloudole-2f23d.firebaseapp.com/api";

const { signup, login, addUserDetails, getUser} = require('./handlers/user');

app.post('/signup', signup);
app.post('/login', login);
app.get('/users', getUser);
app.post('/users', FBAuth, addUserDetails);

app.get('/shopify', (req, res) => {
    const shop = req.query.shop;
    if (shop) {
      const state = nonce();
      const redirectUri = forwardingAddress + '/shopify/callback';
      const installUrl = 'https://' + shop +
        '/admin/oauth/authorize?client_id=' + apiKey +
        '&scope=' + scopes +
        '&state=' + state +
        '&redirect_uri=' + redirectUri;
  
      res.cookie('state', state);
      return res.redirect(installUrl);
    } else {
      return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
    }
});
app.get('/shopify/callback', (req, res) => {
    const { shop, hmac, code, state } = req.query;
    // const stateCookie = cookie.parse(req.headers.cookie).state;
  
    // if (state !== stateCookie) {
    //   return res.status(403).send('Request origin cannot be verified');
    // }
  
    if (shop && hmac && code) {
    //   // DONE: Validate request is from Shopify
    //   const map = Object.assign({}, req.query);
    //   delete map['signature'];
    //   delete map['hmac'];
    //   const message = querystring.stringify(map);
    //   const providedHmac = Buffer.from(hmac, 'utf-8');
    //   const generatedHash = Buffer.from(
    //     crypto
    //       .createHmac('sha256', apiSecret)
    //       .update(message)
    //       .digest('hex'),
    //       'utf-8'
    //     );
    //   let hashEquals = false;
  
    //   try {
    //     hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
    //   } catch (e) {
    //     hashEquals = false;
    //   }
  
    //   if (!hashEquals) {
    //     return res.status(400).send('HMAC validation failed');
    //   }
      // DONE: Exchange temporary code for a permanent access token
      const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
      const accessTokenPayload = {
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      };
      // return res.status(200).send(accessTokenPayload)
      axios.post(accessTokenRequestUrl, accessTokenPayload)
      .then((response) => {
        console.log(response.data)
        return res.status(200).send('accessToken: ' + response.data.access_token)
      })
      .catch((error) => {
        return res.status(error.statusCode).send(error);
      });
    } else {
        res.status(400).send('Required parameters missing');
    }
});


const main = express();
main.use('/api', app);

exports.main = functions.https.onRequest(main);
// exports.api = functions.https.onRequest(app)
