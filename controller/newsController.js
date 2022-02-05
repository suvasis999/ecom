const express = require("express");
const router = express.Router();
const News = require("../models/News");

exports.createNews = async (req, res) => {
  try {
    const news = new News(req.params.body);
    let savedNews = await news.save();
    res.status(200).json({
      status: true,
      data: savedNews,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
      status: false,
    });
  }
};
exports.getNews = async (req, res) => {
  try {
    let news = await News.find();
    res.status(200).json({
      status: true,
      data: news,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
      status: false,
    });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    let id = req.params.id;
    let news = await News.findOne({ id });
    res.status(200).json({
      status: true,
      data: news,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      error: err,
    });
  }
};
exports.removeNews = async (req, res) => {
  try {
    let id = req.params.id;
    let news = await News.findByIdAndRemove({ id });
    res.status(200).json({
      status: true,
      data: news,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      error: err,
    });
  }
};
