var mongoose = require('mongoose');
const Schema = mongoose.Schema;


// define the schema for our user model
var ProductSchema = new Schema({

    Title: String,
    Rating: String,
    Description: String,
    Price: String,
    Image: String,
    Seller_Name: String,
});


module.exports = Product = mongoose.model('product', ProductSchema);

