const { admin, db } = require("../util/admin")
const axios = require('axios');
const config = require("../util/config")

const firebase = require("firebase")
const functions = require('firebase-functions');
const geofirestore = require('geofirestore')
firebase.initializeApp(config)

const {validateSignupData, validateLoginData} = require("../util/validators")
const {findLocation} = require('./shopifyApi')
const {getInventory, shopifyProductList} = require("./shopifyApi")

const firestore = firebase.firestore()

const GeoFirestore = geofirestore.initializeApp(firestore);
const geocollection = GeoFirestore.collection('locations');
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
        return findLocation(newUser.shopName, newUser.shopifyToken)
        .then((res) => {
            return res
        })
        .then(async (locations) => {
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
                shop:locations,
                stripe_customer: customer.id,
                stripe_account: ""
            }
            /* eslint-disable no-await-in-loop */
            for (const location of locations) {
                if (location.active) {
                    geo = await geocode(location.address)
                    latitude = geo.data.results[0].geometry.location.lat
                    longitude = geo.data.results[0].geometry.location.lng
                    db.collection('users').doc(userCredential.email).set({location: admin.firestore.FieldValue.arrayUnion(location.id)},{merge: true })
                    geocollection.doc(location.id.toString()).set({
                        coordinates: new firebase.firestore.GeoPoint(latitude, longitude),
                        email: newUser.email,
                        location: location.id
                    })
                }
            }
            db.collection('users').doc(userCredential.email).set({
                userCredential: userCredential
            },{merge: true })

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


function geocode(location) {
    return axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address:location,
            key: 'AIzaSyBBWfC_zaiGD2H8qWcxnSbnb5jKs7nKfc8'
        }
    })
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

exports.storeNearCustomer = async (request, response) => {
    const info = {
        currentShopName: request.header('shopifyShopName'),
        latitude:request.header('latitude'),
        longitude: request.header('longitude'),
        barcode: request.header('barcode'),
    }


    const query = geocollection.near({ center: new firebase.firestore.GeoPoint(parseFloat(info.latitude), parseFloat(info.longitude)), radius: 100 });
    try{
        const querySnapshot = await query.get();
        // console.log(querySnapshot)
    totalSize = querySnapshot.size
    console.log(totalSize)
    // need to discuss
    if (totalSize === 0) {
        return response.status(200).json([])
    } 
    size = 0
    ans = []
    coordinates = []
    /* eslint-disable no-await-in-loop */
    for (const doc of querySnapshot._docs) {

        let email = doc.data().email
        let locationId = doc.data().location
        let userRef = db.collection('users').doc(email)
        let user = await userRef.get()
        let shopName =  user.data().userCredential.shopName
        let shopifyToken = user.data().userCredential.shopifyToken
        let connectedAccount = user.data().userCredential.stripe_account
        const shopProduct = await shopifyProductList(shopName, shopifyToken)

        for (const [barcode, product] of Object.entries(shopProduct)) {
            // console.log(shopName)
            // console.log(info.currentShopName)
            // console.log(barcode, info.barcode)
            if (barcode === info.barcode && shopName !== info.currentShopName && connectedAccount) {
                coordinates.push(doc.data().coordinates)
                let param = {
                    inventory_item_ids: product.inventory_item_id,
                    location_ids: locationId
                }  
                const inventoryData = await getInventory(shopName, shopifyToken, param)
                console.log(inventoryData.inventory_levels[0].available)
                ans.push({barcode: barcode,
                          product: product,
                          coordinates: coordinates[size],
                          connectedAccount: connectedAccount,
                          available: inventoryData.inventory_levels[0].available})
                size += 1
            }
        }


            
    }
    return response.status(200).json(ans)
    } catch (error) {
            console.log("Error getting documents: ", error);
    }

}

