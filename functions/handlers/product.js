const {
  shopifyProductList,
  modifyInventory,
  findLocation,
} = require("./shopifyApi");
const { admin, db } = require("../util/admin");
const { info } = require("firebase-functions/lib/logger");

exports.productList = async (req, res) => {
  console.log(req.header("shopifyToken"));
  const apiInfo = {
    shopifyShopName: req.header("shopifyShopName"),
    shopifyToken: req.header("shopifyToken"),
    email: req.header("email")
  };


  return shopifyProductList(apiInfo.shopifyShopName, apiInfo.shopifyToken)
    .then(async (products) => {
      const productInfo = {};
      Object.keys(products).forEach((key) => {
        productInfo[key] = products[key].price
      });
      const productRef = db.collection("products").doc(apiInfo.email);
      const product = await productRef.get();
      if (!product.exists) {
        db.collection("products")
          .doc(apiInfo.email)
          .set(
            {
              products: productInfo,
            },
            { merge: true }
          );
        return res.status(200).json(products);
      } else {
        console.log('Document data:', product.data().products);
        for (barcode in productInfo) {
          
          if (barcode in product.data().products) {
            continue
          }
          else {
            console.log(barcode)
            const key = `products.${barcode}`
            db.collection("products")
              .doc(apiInfo.email)
              .update(
                {
                  [key]: productInfo[barcode]
                }
              )
          }
        }
      }
      Object.keys(product.data().products).forEach((key) => {
        products[key].price = product.data().products[key]
      });
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

exports.saveMultiplePrice = async (req, res) => {
  try {
    const { email, changeInfo } = req.body;
    console.log(changeInfo)
    for (var i = 0; i < changeInfo.length; i++) {
      console.log(Object.keys(changeInfo[i])[0], changeInfo[i][Object.keys(changeInfo[i])[0]])
      db.collection("products")
        .doc(email)
        .set(
          {
            products: admin.firestore.FieldValue.arrayUnion(
              { [Object.keys(changeInfo[i])[0]]: changeInfo[i][Object.keys(changeInfo[i])[0]] }
            ),
          },
          { merge: true }
        );
    }
    return res.status(200)
  }
  catch(error) {
    return res.status(400).json(error)
  }
}

exports.savePrice = async (req, res) => {
  try {
    const { email, barcode, price } = req.body;
    const key = `products.${barcode}`
      db.collection("products")
        .doc(email)
        .update(
          {
            [key]: price
          }
        );
    return res.sendStatus(200)
  }
  catch (error) {
    return res.status(400).json(error)
  }
}

exports.getLocation = async (req, res) => {
  const shopifyShopName = req.header("shopifyShopName");
  const shopifyToken = req.header("shopifyToken");
  try {
    const locations = await findLocation(shopifyShopName, shopifyToken);
    return res.status(200).json(locations);
  } catch (error) {
    return res.status(400).json(error);
  }
};
