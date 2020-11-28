// const functions = require('firebase-functions');
// const stripe = require('stripe')(functions.config().stripe.token);

// exports.charge = (request, response) => {
//     const body = JSON.parse(request.body);
//     const token = body.token.id;
//     const amount = body.charge.amount;
//     const currency = body.charge.currency;

//     // Charge card
//     stripe.charges.create({
//         amount,
//         currency,
//         description: 'Firebase Example',
//         source: token,
//     }).then(charge => {
//         console.log(charge)
//         return response.status(200).json(charge)
//     })
//     .catch(err => {
//         console.log(err);
//      });
// }



