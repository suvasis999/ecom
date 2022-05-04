const Category = require("../models/category")

const server_url = process.env.SERVER_URL
module.exports.addCategory = async (req, res, next) => {
    try {
        const prodCategory = req.body.category_name
        const picture = req.file
        if (!prodCategory || !picture) {
            return res.status(400).json({ status: false, msg: "Please provide category_name & picture" })
        }
        const existName = await Category.findOne({ name: { $regex: prodCategory, $options: "i" } })
        if (existName) {
            return res.status(400).json({ status: false, msg: `Category name with '${prodCategory}' already exist. Please try with another name` })
        }
        const newCategory = await Category.create(
            {
                name: prodCategory,
                picture: server_url + picture.path
            }
        )
        if (newCategory != null) {
            return res.status(200).json({ status: true, msg: `New category name with '${prodCategory}' added.`, data: newCategory })
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.editCategory = async (req, res, next) => {
    try {
        const catId = req.params.id
        const prodCategory = req.body.category_name
        if (!catId) {
            return res.status(400).json({ status: false, msg: "id not found" })
        }
        if (!prodCategory && !req.file) {
            return res.status(400).json({ status: false, msg: "Please provide name or picture" })
        }
        const existName = await Category.findOne({ name: { $regex: prodCategory, $options: "i" } })
        if (existName && !existName._id.equals(catId)) {
            return res.status(400).json({ status: false, msg: `Category name with '${prodCategory}' already exist. Please try with another name` })
        }
        const existCategory = await Category.findById(catId)
        let update = {}
        if (prodCategory) {
            update.name = prodCategory
        }
        if (req.file) {
            update.picture = server_url + req.file.path
            let existFilePath = existCategory.picture.replace(server_url, "")
        }
        const updatedCategory = await Category.findByIdAndUpdate(catId, update)
        if (updatedCategory != null) {
            return res.status(200).json({ status: true, msg: `Category updated .` })
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.searchCategory = async (req, res, next) => {
    try {
        const prodCategory = req.params.category_name
        if (!prodCategory) {
            return res.status(400).json({ status: false, msg: "category_name not found" })
        }
        const matchedCat = await Category.find({ name: { $regex: prodCategory, $options: "i" } }).sort({ name: 1 })
        if (matchedCat.length) {
            return res.status(200).json({ status: true, msg: `Category name with '${prodCategory}' found.`, data: matchedCat })
        }
        else {
            return res.status(400).json({ status: false, msg: `Category name with '${prodCategory}' not found.` })
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.getById = async (req, res, next) => {
    try {
        const prodCategoryId = req.params.id
        if (!prodCategoryId) {
            return res.status(400).json({ status: false, msg: "category_name id not found" })
        }
        const matchedCat = await Category.findById(prodCategoryId)
        if (matchedCat != null) {
            return res.status(200).json({ status: true, msg: `Category found.`, data: matchedCat })
        }
        else {
            return res.status(400).json({ status: false, msg: `Category not found.` })
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.getAllCategory = async (req, res, next) => {
    try {

        const matchedCat = await Category.find()
        if (matchedCat.length) {
            return res.status(200).json({ status: true, msg: `All found Categories`, data: matchedCat })
        }
        else {
            return res.status(400).json({ status: false, msg: `Category not found` })
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.deleteById = async (req, res, next) => {
    try {
        const tagId = req.params.id
        if (!tagId) {
            return res.status(400).json({ status: false, msg: "id not found" })
        }
        const matchedCategory = await Category.findByIdAndDelete(tagId)
        if (matchedCategory != null) {
            return res.status(200).json({ status: true, msg: `Category deleted successfully` })
        }
        else {
            return res.status(400).json({ status: false, msg: `Category not found` })
        }
    }
    catch (er) {
        next(er)
    }
}