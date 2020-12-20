const { admin, db } = require("../util/admin")

const config = require("../util/config")

const firebase = require("firebase")
const functions = require('firebase-functions');
const geofirestore = require('geofirestore')
firebase.initializeApp(config)

const {validateSignupData, validateLoginData} = require("../util/validators")
const {shopifyShopAddress} = require('./shopifyApi')
const {shopifyProductList} = require("./shopifyApi")

const firestore = firebase.firestore()

const GeoFirestore = geofirestore.initializeApp(firestore);
const geocollection = GeoFirestore.collection('users');
const stripe = require('stripe')(functions.config().stripe.token);


exports.signup = (request, response)  => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        shopifyToken: request.body.shopifyToken,
        shopName: request.body.shopName,
        createdAt: new Date().toISOString()
    }
    
    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return response.status(400).json(errors);

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
        .then(async (shop) => {
            // console.log(shop)
            const customer = await stripe.customers.create({
                email: newUser.email,
                description: newUser.shopName
                }
            );
            console.log(customer)
            const userCredential = {
                shopifyToken: newUser.shopifyToken,
                email: newUser.email,
                createdAt: newUser.createdAt,
                shopName: newUser.shopName,
                userId: userId,
                shop: shop,
                stripe_customer: customer.id,
                stripe_account: ""
            }
            geocollection.doc(userCredential.email).set({
                coordinates: new firebase.firestore.GeoPoint(shop.latitude, shop.longitude),
                userCredential: userCredential
            })
            return response.status(201).json({token, id: customer.id})
        })        
    }).catch(error => {
        console.log(error)
        if (error.code === 'auth/email-already-in-use') {
            return response.status(400).json({email: 'Email is already in used'})
        } 
        return response.status(500).json({error: error.code})
    })
    return null
}



exports.login = async (request, response) => {
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
    .then(async token  => {
        const doc = await db.collection('users').doc(user.email).get()
        shopify_token = doc.get('userCredential').shopifyToken
        shop_name = doc.get('userCredential').shopName
        stripe_id = doc.get('userCredential').stripe_customer
        return {token, shopify_token, shop_name, stripe_id}
    })
    .then((requireInfo) => {
            return response.json({...requireInfo})
    })
    .catch(error => {
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
    db.collection('users').get()
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

exports.storeNearCustomer = async (request, response) => {
    const info = {
        currentShopName: request.header('shopifyShopName'),
        latitude:request.header('latitude'),
        longitude: request.header('longitude'),
        barcode: request.header('barcode')
    }


    const query = geocollection.near({ center: new firebase.firestore.GeoPoint(parseFloat(info.latitude), parseFloat(info.longitude)), radius: 5 });
    query.get()
    try{
        const querySnapshot = await query.get();
    totalSize = querySnapshot.size
    // need to discuss
    if (totalSize === 0) {
        return response.status(200).json([])
    } 
    size = 0
    ans = []
    coordinates = []

    for await (const doc of querySnapshot) {
        shopName =  doc.data().userCredential.shopName,
        shopifyToken = doc.data().userCredential.shopifyToken,
        connectedAccount = doc.data().userCredential.stripe_account
        coordinates.push(doc.data().coordinates)  
        const shopProduct = await shopifyProductList(shopName, shopifyToken)
        for (const [barcode, product] of Object.entries(shopProduct)) {
            console.log(shopName)
            console.log(info.currentShopName)
            console.log(barcode, info.barcode)
            if (barcode === info.barcode && shopName !== info.currentShopName && connectedAccount) {
                ans.push({barcode: barcode,
                          product: product,
                          coordinates: coordinates[size],
                          connectedAccount: connectedAccount})
            }
        }
        size += 1
        if (size === totalSize) {
            return response.status(200).json(ans)
        }
        return null
    }
    } catch (error) {
            console.log("Error getting documents: ", error);
    };

}

