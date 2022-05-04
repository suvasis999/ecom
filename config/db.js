const mongoose = require('mongoose');
const User = require("../models/User")
const bcrypt = require('bcryptjs')
const role = require("../config/role")
const DB_URI = require('./keys').mongoURI;
// const DB_URI = 'mongodb://localhost:27017/drala?readPreference=primary&appname=MongoDB%20C'
const connectDB = async () => {
    await mongoose.connect(DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(() => {
            User.countDocuments({ role: role.ADMIN }, async (err, count) => {
                if (!err && count === 0) {
                    const encryptedPassword = bcrypt.hashSync("123456", 10)
                    await new User({
                        firstname: "Test ",
                        lastname:'Admin',
                        phone:9876543210,
                        password: encryptedPassword,
                        email: "admin@mail.com",
                        role: role.ADMIN
                    }).save(err => {
                        if (err) {
                            console.log("error", err);
                        }
                        console.log(" New  Admin Added");
                    });
                }
            })
            console.log('MongoDB Connected')
        })
        .catch(err => {
            console.error("Connection error", err);
            process.exit();
        });
}

module.exports = connectDB;