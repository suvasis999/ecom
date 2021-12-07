var mongoose = require('mongoose');
const Schema = mongoose.Schema;


// define the schema for our user model
var userSchema = new Schema({
    username: String, // _username_
    password: String, // 123rikwdjbfp2ioeurroasodfj[OJ[Ojsjdfag*wef
    firstname: String, // firstName
    lastname: String, // lastName
    email: String,     // xyz@gmail.com
    phone: String,  //9999265656
     
});


module.exports = User = mongoose.model('users', userSchema);

module.exports.getUserByUsername = function (username, callback) {
    var query = { username: username };
    User.findOne(query, callback);
}

module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
}