const { shopifyProductList, modifyInventory, findLocation } = require("./shopifyApi");
const { admin, db } = require("../util/admin");

exports.productList = (req, res) => {
  console.log(req.header("shopifyToken"));
  const apiInfo = {
    shopifyShopName: req.header("shopifyShopName"),
    shopifyToken: req.header("shopifyToken"),
  };
  // const apiInfo = {
  //     shopifyShopName: 'ameni-coco-test.myshopify.com',
  //     shopifyToken: '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'
  // }
  return shopifyProductList(apiInfo.shopifyShopName, apiInfo.shopifyToken)
    .then((products) => {
      //console.log(products)
      return res.status(200).json(products);
    })
    .catch((error) => {
      console.log(error.response);
    });
};


exports.modifyInventory = async (req, res) => {
  const apiInfo = {
    shopifyShopName: req.body.shopifyShopName,
    shopifyToken: req.body.shopifyToken,
  };
  const body = {
    location_id: req.body.location_id,
    inventory_item_id: req.body.inventory_item_id,
    available_adjustment: req.body.available_adjustment,
  };

  try {
    const products = modifyInventory(
      apiInfo.shopifyShopName,
      apiInfo.shopifyToken,
      body
    );
    return res.status(200).json(products);
  } catch (error) {
    return res.status(400).json(error);
  }
};


exports.getLocation = async (req, res) => {
  const shopifyShopName = req.header("shopifyShopName")
  const shopifyToken = req.header("shopifyToken")
  try {
    const locations = await findLocation(shopifyShopName, shopifyToken)
    return res.status(200).json(locations);
  } catch (error) {
    return res.status(400).json(error);
  }
};