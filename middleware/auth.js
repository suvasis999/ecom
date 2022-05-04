const jwt = require('jsonwebtoken')
const User = require('../model/user')
const auth = async (req, res, next) => {
    try {

        const getToken = req.headers.authorization || req.body.token || req.query.token || req.headers["x-access-token"];;
        if (!getToken) {
            return res.status(400).json({ msg: "Please provide token.", status: false })
        }
        let token = getToken
        if (getToken && getToken.split(' ')[0] === 'Bearer') {
            token = getToken.split(' ')[1];
        }
        const user_id = jwt.verify(token, process.env.JWT_SECRET, (er, decode) => {
            if (!er) { return decode.id }
            else return null
        });
        console.log(user_id)
        let _user = null
        if (user_id) {
            _user = await User.findById(user_id)
            if (_user.accessToken !== token) {
                return res.status(400).json({ msg: "User is logged out please login.", status: false })
            }
        } else {
            return res.status(400).json({ msg: "Session is time out or Token is not valid. authentication failed.", status: false })
        }
        req.user = _user._id
        next()
    }
    catch (error) {
        next(error)
    }
}
module.exports = auth