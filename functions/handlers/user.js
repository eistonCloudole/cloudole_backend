const { admin, db } = require("../util/admin")

const config = require("../util/config")

const firebase = require("firebase");
firebase.initializeApp(config);

const {
    validateSignupData,
    validateLoginData,
  } = require("../util/validators");

exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        shopifyToken: request.body.shopifyToken,
        createdAt: new Date().toISOString()
    }
    
    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return res.status(400).json(errors);

    let token, userId;

    db.doc(`/users/${newUser.shopifyToken}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return response.status(400).json({ token: "this token is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
        userId = data.user.uid
        return data.user.getIdToken()
    })
    .then(cloudoleToken => {
        token = cloudoleToken
        const userCredential = {
            shopifyToken: newUser.shopifyToken,
            email: newUser.email,
            createdAt: newUser.createdAt,
            userId: userId
        }
        return db.doc(`/users/${newUser.email}`).set(userCredential)

    }).then(() => {
        return response.status(201).json({token})
    })
    .catch(error => {
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
        return response.json({token})
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