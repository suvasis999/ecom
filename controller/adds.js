const Adds = require("../models/adds")
const Product = require("../models/Product")

const server_url = process.env.SERVER_URL

module.exports.create = async (req, res, next) => {
    try {
        const picture = req.file
        console.log(req.body)
        if (!picture) {
            return res.status(400).json({ status: false, msg: "Please provide picture" })
        }
        const {
            heading, heading2, title, title2, product_id, vendor_id, add_type
        } = req.body
        const existProduct = await Product.findById(product_id)
        console.log(product_id)
        console.log(existProduct)
        if (existProduct == null) {
            return res.status(400).json({ status: false, msg: `Product Not Found`, })
        }
        const newAdd = await Adds.create(
            {
                heading, heading2, title, title2, product_id, vendor_id, add_type,
                picture: server_url + picture.path
            }
        )

        if (newAdd != null) {
            return res.status(200).json({ status: true, msg: `New add added.`, data: newAdd })
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
        }
    }
    catch (er) {
        next(er)
    }
}


module.exports.update = async (req, res, next) => {
    try {
        const id = req.params.id

        if (!id) {
            return res.status(400).json({ status: false, msg: "Please provide id" })
        }
        const {
            heading, heading2, title, title2, product_id, vendor_id, add_type
        } = req.body
        const picture = req.file
        let update = {
            heading, heading2, title, title2, product_id, vendor_id, add_type
        }
        if (picture) {
            update.picture =  server_url + picture.path
        }
        const updateData = await Adds.findByIdAndUpdate(id,update)

        if (updateData != null) {
            return res.status(200).json({ status: true, msg: `Adds updated`, data: updateData })
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
        }
    }
    catch (er) {
        next(er)
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json({ status: false, msg: "Please provide id" })
        }
        const updateData = await Adds.findByIdAndDelete(id)
        if (updateData != null) {
            return res.status(200).json({ status: true, msg: `Adds deleted` })
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
        }
    }
    catch (er) {
        next(er)
    }
}

module.exports.all = async (req, res, next) => {
    try {
        const allData = await Adds.find({})
        if (allData != null) {
            return res.status(200).json({ status: true, msg: `All adds`, data:allData})
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.byId = async (req, res, next) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json({ status: false, msg: "Please provide id" })
        } 
        const allData = await Adds.findById(id)
        if (allData != null) {
            return res.status(200).json({ status: true, msg: `Adds by id`, data:allData})
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
        }
    }
    catch (er) {
        next(er)
    }
}