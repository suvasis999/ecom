const User = require('../models/User');
const jwt = require("jsonwebtoken");
const Role = require("../config/role")
const bcrypt = require("bcryptjs");

const authorize = (roles = []) => {
    // or an array of roles (e.g. [Role.ADMIN, Role.VENDOR] or ['admin', 'basic'])
    if (typeof roles === 'string') {
        roles = [roles];
    }
    //SUPER ADMIN HAS ALL THE ACCESS
    roles.push(Role.ADMIN)
    // authorize based on user role
    return [
        async (req, res, next) => {
            try {
                req.role = null
                const getToken = req.headers.authorization || req.body.token || req.query.token || req.headers["x-access-token"];;
                if (!getToken) {
                    return res.status(401).json({ msg: "Please provide token.", status: false })
                }
                if (!req.body.password) {
                    return res.status(401).json({ msg: "Please provide password.", status: false })
                }
                let token = getToken
                if (getToken && getToken.split(' ')[0] === 'Bearer') {
                    token = getToken.split(' ')[1];
                }
                const user_id = jwt.verify(token, process.env.JWT_SECRET, (er, decode) => {
                    if (!er) { return decode.id }
                    else return null
                });
                if (user_id) {
                    const existUser = await User.findById(user_id)
                    if (existUser ) {
                    // if (existUser && existUser.accessToken === token) {
                        const checkPassword = bcrypt.compareSync(req.body.password, existUser.password);
                        if (!checkPassword) {
                            return res.status(401).json({ msg: 'Password is incorrect. Authentication failed', status: false })
                        } else{ req.role = existUser.role }
                    }
                    else {
                        return res.status(401).json({ msg: "User is logged out or token is invalid or user not exist. Authentication failed.", status: false })
                    }
                } else {
                    return res.status(401).json({ msg: "Session is time out or Token is invalid. Authentication failed.", status: false })
                }
                next()
            }
            catch (error) {
                next(error)
            }
        },
        (req, res, next) => {
            console.log('req role', req.role);
            console.log("roles", roles)
            if (roles.length && !roles.includes(req.role)) {
                // user's role is not authorized
                return res.status(401).json({ message: 'You have not authorize to access this' });
            }
            else next();
            // authentication and authorization successful
        }
    ]
}
module.exports = authorize 