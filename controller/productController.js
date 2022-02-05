const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const passport = require('passport');

const productRepository = require('../repo/repository');
exports.createProduct = async (req, res) => {
    try {
        let payload = {
            name: req.body.name,
            price: req.body.price,
            image: req.body.image,
            rating: req.body.rating,
            description: req.body.description,
            Seller_Name: req.body.Seller_Name
        }
        let product = await productRepository.createProduct({
            ...payload
        });
        res.status(200).json({
            status: true,
            data: product,
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: err,
            status: false,
        })
    }
}
exports.getProducts = async (req, res) => {
  try {
    let products = await productRepository.getproducts();
    res.status(200).json({
      status: true,
      data: products,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
      status: false,
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    let id = req.params.id;
    let productDetails = await productRepository.getproductById(id);
    res.status(200).json({
      status: true,
      data: productDetails,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      error: err,
    });
  }
};
exports.removeProduct = async (req, res) => {
    try {
        let id = req.params.id
        let productDetails = await productRepository.removeProduct(id)
        res.status(200).json({
            status: true,
            data: productDetails,
        })
    } catch (err) {
        res.status(500).json({
            status: false,
            error: err
        })
    }
}