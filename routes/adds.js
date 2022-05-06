const Add = require("../controller/adds")
const Router = require("express").Router()
const upload = require("../config/image-upload")
const authorization = require("../middleware/authorization")
const role = require("../config/role")

Router.post('/create',authorization(role.ADMIN),upload.single("adds"),Add.create)
Router.post('/update/:id',authorization(role.ADMIN),upload.single("adds"),Add.update)
Router.post('/delete/:id',Add.delete)
Router.get('/all',Add.all)
Router.get('/by-id/:id',Add.byId)

module.exports = Router
