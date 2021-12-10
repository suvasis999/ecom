const Product = require('../models/Product')




exports.getproducts = async () => {
    const products = await Product.find();
    return products;
};


exports.getproductById = async id => {
    const product = await Product.findById(id);
    return product;
}


exports.createProduct = async payload => {
    const newProduct = await Product.create(payload);
    return newProduct
}


exports.removeProduct = async id => {
    const product = await Product.findByIdAndRemove(id);
    return product
}