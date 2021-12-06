const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const passport = require('passport');

const Product = require('../models/Product')


exports.getAllProduct = async (req, res) => {
    try {
        Product.find().exec(function (err, product) {

            return res.status(200).json(product);
        });

    } catch (err) {
        res.status(500).json(err)
    }
}

exports.addProduct = async (req, res) => {
    try {
        Product({
            Title: req.body.Title,
            Description: req.body.Description,
            Rating: req.body.Rating,
            Price: req.body.Price,
            Image: req.body.Image,
            Seller_Name: req.body.Seller_Name,

        }).save((err, data) => {
            if (err) throw err;
            else
                res.status(200).json(data);
        });
    } catch (err) {
        res.status(500).json(err);
    }
}