const Router = require('koa-router');
const router = new Router();
const parse = require('co-body');

// Import queries and mutations here
const { restApi } = require('../functions/handlers/queries.js');
const { url } = require('koa-router');
 
const prepareAuth = (ctx) => {
    const accessToken = ctx.cookies.get("accessToken");
    const shopOrigin = ctx.cookies.get("shopOrigin");
    return {
        token: accessToken,
        shop: shopOrigin
    }
};

// Define routes here
// Create the 'products' route
router.get('/products/', async (ctx) => {
 
    const auth = prepareAuth(ctx);
    const url = `https://${auth.shop}/admin/api/2020-10/products.json`
    const method = 'GET'
    await restApi(auth, url, method).then(response => {
        console.log(response.data.products)
        ctx.body = response.data.products
    });

});

module.exports = {
    router
}
