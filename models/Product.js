const mongoose = require("mongoose");
const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Include the product name"],
  },
  price: {
    type: String,
    required: [true, "Please Include the product price"],
  },
 image: {
    type: String,
    required: true,
  },
  rating : {
    type: String,
  },
  description : {
      type : String,
  },
  Seller_Name : {
      type : String
  }
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;

 