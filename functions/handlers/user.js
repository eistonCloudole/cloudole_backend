const { admin, db } = require("../util/admin")

const config = require("../util/config")

const firebase = require("firebase")
firebase.initializeApp(config)

const {validateSignupData, validateLoginData} = require("../util/validators")
const {shopifyShopAddress} = require('./shopifyApi')

const GeoPoint = require('geopoint')



exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        shopifyToken: request.body.shopifyToken,
        shopName: request.body.shopName,
        createdAt: new Date().toISOString()
    }
    
    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return res.status(400).json(errors);

    let token, userId;
    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data => {
        userId = data.user.uid
        return data.user.getIdToken()
    })
    .then(cloudoleToken => {
        token = cloudoleToken
        return shopifyShopAddress(newUser.shopName, newUser.shopifyToken)
        .then((res) => {
            return res
        })
        .then((shop) => {
            console.log(shop)
            const userCredential = {
                shopifyToken: newUser.shopifyToken,
                email: newUser.email,
                createdAt: newUser.createdAt,
                shopName: newUser.shopName,
                userId: userId,
                shop: shop
            }
            return db.doc(`/users/${newUser.email}`).set(userCredential)})
        })
        .catch((error) => {
            console.log(error)
        })     
    .then(() => {
        return response.status(201).json({token})
    }).catch(error => {
        console.log(error)
        if (error.code === 'auth/email-already-in-use') {
            return response.status(400).json({email: 'Email is already in used'})
        } 
        return response.status(500).json({error: error.code})
    })
    return null
}



exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }

    const { valid, errors } = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
        return data.user.getIdToken()
    })
    .then(token => {
        return db.collection('users').doc(user.email).get()
        .then((data) => {
            shopify_token = data._fieldsProto.shopifyToken.stringValue
            shop_name = data._fieldsProto.shopName.stringValue
            return {shopify_token, shop_name}
        })
        .then((requireInfo) => {
            return response.json({token, ...requireInfo})
        })
        .catch((error) => {
            console.log(error)
        })

    }).catch(error => {
        console.log(error)
        if (error.code === 'auth/wrong-password') {
            return response.status(403).json({general: 'Wrong credentials, please try again'})
        }
        return response.status(500).json({error: error.code})
    })
    return null
}

exports.addUserDetails = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        shopifyToken: request.body.shopifyToken,
        createdAt: new Date().toISOString()
    }
    db.collection('users')
    .add(newUser)
    .then((user) => {
        return response.json({message: `user ${user.id} created successfully`})
    })
    .catch((error) => {
        response.status(500).json({error: error})
    })
}

exports.getUser = (request, response) => {
    console.log(calculateDistance())
    db.collection('users').orderBy('createdAt', 'desc').get()
     .then((data) => {
         let user = [];
         data.forEach((doc) => {
             user.push({
                 ...doc.data()
             });
         });
         return response.json(user);
     })
     .catch((error) => console.log(error));
}

function calculateDistance() {
    origin = new GeoPoint(43.445069, -80.49329)
    destination = new GeoPoint(43.473698, -80.535986)
    return origin.distanceTo(destination, true)
}

