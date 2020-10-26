const functions = require('firebase-functions');
const app = require('express')();
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


const { signup, login, addUserDetails, getUser} = require('./handlers/user');
const { shopifyLogin, shopifyRedirect} = require('./handlers/shopify')
const { productList} = require('./handlers/product')

app.post('/signup', signup);
app.post('/login', login);
app.get('/users', getUser);
app.post('/users', FBAuth, addUserDetails);

app.get('/shopify', shopifyLogin);
app.get('/shopify/callback', shopifyRedirect);

app.get('/token', (req, res) => {
    return res.status(200).send('accessToken: ' + req.app.get('access_token'))
})

app.get('/productList', productList)

exports.api = functions.https.onRequest(app)