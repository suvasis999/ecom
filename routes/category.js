const Category = require("../controller/category")
const Router = require("express").Router()
const upload = require("../config/image-upload")
const authorization = require("../middleware/authorization")
const role = require("../config/role")

Router.post('/add-category',authorization(role.ADMIN),upload.single("prodCategory"),Category.addCategory)
Router.post('/edit-category/:id',authorization(role.ADMIN),upload.single("prodCategory"), Category.editCategory)
Router.post('/category-delete-byId/:id',authorization(role.ADMIN),Category.deleteById)
Router.get('/search-category/:category_name',Category.searchCategory)
Router.get('/category-get-byId/:id',Category.getById)
Router.get('/get-all-category',Category.getAllCategory)

module.exports = Router
