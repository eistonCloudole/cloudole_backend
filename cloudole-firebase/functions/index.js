const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth');

const cors = require('cors');
app.use(cors());

const { db } = require('./util/admin');

const { signup, login, addUserDetails, getUser} = require('./handlers/user');

app.post('/signup', signup);
app.post('/login', login);
app.get('/users', getUser);
app.post('/users', FBAuth, addUserDetails);

exports.api = functions.https.onRequest(app)



