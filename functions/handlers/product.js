const { shopifyProductList, modifyInventory } = require("./shopifyApi")
const { admin, db } = require("../util/admin")

exports.productList = (req, res) => {
    console.log(req.header('shopifyToken'))
    const apiInfo = {
        shopifyShopName: req.header('shopifyShopName'),
        shopifyToken: req.header('shopifyToken'),
    }
    // const apiInfo = {
    //     shopifyShopName: 'ameni-coco-test.myshopify.com',
    //     shopifyToken: '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'
    // }
    return shopifyProductList(apiInfo.shopifyShopName, apiInfo.shopifyToken)
        .then((products) => {
            //console.log(products)
            return res.status(200).json(products)
        })
        .catch((error) => {
            console.log(error.response)
        })
}
exports.addShoppingCart = async (req, res) => {
    const cart = db.collection('shoppingCarts').doc(req.body.shopifyShopName);
    const quantity_key = `${req.body.location_id}.${req.body.inventory_item_id}.quantity`
    const price_key = `${req.body.location_id}.${req.body.inventory_item_id}.price`
    try {
        await cart.update({
            [quantity_key]: admin.firestore.FieldValue.increment(50),
            [price_key]: req.body.price
        });
        return res.status(200)
    } catch (error) {
        return res.status(400).json(error)
    }
}
exports.modifyInventory = async (req, res) => {
    const apiInfo = {
        shopifyShopName: req.body.shopifyShopName,
        shopifyToken: req.body.shopifyToken,
    }
    const body = {
        location_id : req.body.location_id,
        inventory_item_id: req.body.inventory_item_id,
        available_adjustment: req.body.available_adjustment,
    }

    try {
        const products = modifyInventory(apiInfo.shopifyShopName, apiInfo.shopifyToken, body);
        return res.status(200).json(products)
    } catch (error) {
        return res.status(400).json(error)
    }
}