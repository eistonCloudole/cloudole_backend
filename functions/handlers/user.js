const { admin, db } = require("../util/admin")

const config = require("../util/config")

const firebase = require("firebase")
const geofirestore = require('geofirestore')
firebase.initializeApp(config)

const {validateSignupData, validateLoginData} = require("../util/validators")
const {shopifyShopAddress} = require('./shopifyApi')
const {shopifyProductList} = require("./shopifyApi")

const firestore = firebase.firestore()

const GeoFirestore = geofirestore.initializeApp(firestore);
const geocollection = GeoFirestore.collection('users');


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
        .then((shop) => {
            console.log(shop)
            const userCredential = {
                shopifyToken: newUser.shopifyToken,
                email: newUser.email,
                createdAt: newUser.createdAt,
                shopName: newUser.shopName,
                userId: userId,
                shop: shop,
            }
            geocollection.doc(userCredential.email).set({
                coordinates: new firebase.firestore.GeoPoint(shop.latitude, shop.longitude),
                userCredential: userCredential
            })
            return response.status(201).json({token})
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
            shopify_token = data._fieldsProto.userCredential.mapValue.fields.shopifyToken.stringValue
            shop_name = data._fieldsProto.userCredential.mapValue.fields.shopName.stringValue
            return {shopify_token, shop_name}
        })
        .then((requireInfo) => {
            return response.json({token, ...requireInfo})
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

exports.storeNearCustomer = (request, response) => {
    const info = {
        latitude:request.header('latitude'),
        longitude: request.header('longitude'),
        barcode: request.header('barcode')
    }


    const query = geocollection.near({ center: new firebase.firestore.GeoPoint(info.latitude, info.longitude), radius: 5 });
    query.get()
    .then(function(querySnapshot) {
        totalSize = querySnapshot.size
        size = 0
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            ans = []

            console.log(doc.id, " => ", doc.data().userCredential.shopName);
            shopName =  doc.data().userCredential.shopName,
            shopifyToken = doc.data().userCredential.shopifyToken,
            coordinates = doc.data().coordinates 

            return shopifyProductList(shopName, shopifyToken)
            .then((product) => {
                allBarcode = Object.entries(product)
                for(const [barcode, product] of allBarcode) {
                    if (barcode === info.barcode) {
                        ans.push({barcode: barcode,product: product,coordinates: coordinates})
                    }
                }
                size += 1
                // manually check when to return the data alternative solution?
                if (size === totalSize) {
                    return response.status(200).json(ans)
                }
                return null
            })
        })
        return null
    })
    .catch(function(error) {
            console.log("Error getting documents: ", error);
    });

}

