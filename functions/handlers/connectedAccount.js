const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().stripe.token);
const config = require("../util/config")
const firebase = require("firebase")
const { admin, db } = require("../util/admin")

exports.setupConnectedAccount = async(req, res)=> {
    const {email} = req.body
    var isSetup = false
    const doc = await db.collection('users').doc(email).get()
    var stripeAccount= doc.get('userCredential').stripe_account;
    console.log(stripeAccount)
        try { 
            if (stripeAccount === "") {
                console.log('empty id')
                const account = await stripe.accounts.create({
                    type: 'standard',
                    email: email
                });
                const add = await db.collection('users').doc(email).update({
                    'userCredential.stripe_account': account.id
                });
                stripeAccount = account.id;
            }
            console.log('here')

            const accountLinks = await stripe.accountLinks.create({
                account: stripeAccount,
                refresh_url: 'https://cloudole-2f23d.firebaseapp.com',
                return_url: 'https://cloudole-2f23d.firebaseapp.com',
                type: 'account_onboarding',
            });
            const created_account = await stripe.accounts.retrieve(
                stripeAccount
            );
            //console.log(created_account)
            isSetup = created_account.charges_enabled
            
            return res.status(200).json({
                url: accountLinks.url,
                isSetup: isSetup
            })
        } catch(error) {
            console.log(error)
            return res.status(400).json(error)
        }
 } 