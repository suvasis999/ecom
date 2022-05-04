const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports.register = async function (req, res, next) {
    try {
        const {
            email, password, firstname, lastname, phone
        } = req.body
        if (!email || !password || !firstname || !lastname || !phone) {
            return res.status(400).json({ status: false, msg: 'All fields are required' })
        }
        const existUser = await User.findOne({ $or: [{ phone }, { email }] })
        //generate new password
        if (existUser != null) {
            return res.status(400).json({ msg: 'Email or phone already exist', status: false })
        }
        console.log("prev")

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("hashedPassword", hashedPassword)
        //create new user
        const newUser = new User({
            email: email,
            password: hashedPassword,
            firstname: firstname,
            lastname: lastname,
            phone: phone,
        });
        await newUser.save();
        const resData = {
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            _id: newUser._id,
            phone: newUser.phone,
            role: newUser.role,
        }
        //save user and respond
        res.status(200).json({ data: resData, msg: 'New user added', status: true });
    } catch (err) {
        next(err)
    }
};


module.exports.login = async (req, res, next) => {
    try {
        const {
            email,
            password,
        } = req.body
        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and Password required', status: false })
        }
        const existUser = await User.findOne({ email: email })
        if (!existUser) {
            return res.status(400).json({ msg: 'Email or Password is incorrect ', status: false })
        }
        const checkpassword = bcrypt.compareSync(password, existUser.password);
        if (!checkpassword) {
            return res.status(400).json({ msg: ' Email or Password is incorrect', status: false })
        }
        const token = jwt.sign({
            id: existUser._id
        }, process.env.JWT_SECRET, { expiresIn: Number(process.env.JWT_TIME) })

        User.findByIdAndUpdate(existUser._id, { accessToken: token }).exec((er, doc) => {
            if (!er) {
                res.json(
                    {
                        data: {
                            firstname: existUser.firstname,
                            lastname: existUser.lastname,
                            _id: existUser._id,
                            token,
                            address: existUser.address,
                            email: existUser.email,
                            phone: existUser.phone,
                            role: existUser.role,
                        },
                        status: true,
                        msg: "Login success"
                    }
                )
            }
            else {
                return res.status(400).json({ status: false, msg: "Something went wrong." })
            }
        })
    }
    catch (error) {
        next(error)
    }
}
module.exports.getUserById = async (req, res, next) => {
    try {
        const user_id = req.params.user_id
        if (!user_id) {
            return res.status(400).json({ msg: 'user_id is required', status: false })
        }
        User.findById(user_id, (er, doc) => {
            if (!er && doc) {
                const resData = {
                    firstname: doc.firstname,
                    lastname: doc.lastname,
                    _id: doc._id,
                    token: doc.token,
                    email: doc.email,
                    phone: doc.phone,
                    address: doc.address,
                    role: doc.role,
                    isVerified: doc.isVerified
                }
                return res.json({ msg: 'User found', status: true, data: resData })
            }
            else {
                return res.status(400).json({ msg: 'User not found. Something went wrong.', status: false })
            }
        })
    }
    catch (error) {
        next(error)
    }
}
module.exports.forgotpw = async (req, res, next) => {
    try {
        const email = req.params.email
        if (!email) {
            return res.status(400).json({ msg: 'Email is required', status: false })
        }
        const existUser = await User.findOne({ email: email })
        if (!existUser) {
            return res.status(400).json({ msg: `No account is found with '${email}'`, status: false })
        }
        //send otp here
        const otp = Math.ceil(Math.random() * 99999 + 100000)
        // console.log(otp);
        const verify = {
            verification: {
                otp: otp,
                send_by: "email",
                send_at: new Date()
            }
        }
        const update = await User.findOneAndUpdate({ email: email }, verify)
        if (update != null) {
            //remove otp from below ***
            return res.status(200).json({ msg: 'Please verify with otp', status: true, otp })
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong." })
        }
    }
    catch (error) {
        next(error)
    }
}
//verify otp for password change
module.exports.verifyotp = async (req, res, next) => {
    try {
        const email = req.query.email
        const otp = Number(req.query.otp)
        if (!email) {
            return res.status(400).json({ msg: 'Email is required', status: false })
        }
        const existUser = await User.findOne({ email: email })
        if (!existUser) {
            return res.status(400).json({ msg: `No account is found with '${email}'`, status: false })
        }
        if (existUser.verification.otp !== otp) {
            return res.status(400).json({ msg: `OTP is invalid. Please try again`, status: false })
        }
        const timecheck = new Date() - existUser.verification.send_at
        if (timecheck > process.env.OTP_TIME * 1000) {
            return res.status(400).json({ msg: `OTP is expired. Please try again`, status: false })
        }
        else {
            const token = jwt.sign({
                id: existUser.id,
            }, process.env.JWT_SECRET, { expiresIn: 60 * 5 })

            const update = await User.findOneAndUpdate({ email: email }, { 'verification.verified_token': token })
            if (update != null) {
                return res.status(200).json({ msg: `OTP is verified.`, status: true, verified_token: token })
            }
            else {
                return res.status(400).json({ status: false, msg: "Something went wrong." })
            }
        }
    }
    catch (error) {
        next(error)
    }
}

module.exports.changepw = async (req, res, next) => {
    try {
        const {
            password,
            verified_token
        } = req.body
        if (!password || !verified_token) {
            return res.status(400).json({ msg: "Please provide token and new password to change password", status: false })
        }
        const user_id = jwt.verify(verified_token, process.env.JWT_SECRET, (er, decode) => {
            if (!er) { return decode.id }
            else return null
        });
        if (user_id) {
            const db_token = await User.findById(user_id).select('verification.verified_token')
            if (db_token.verification.verified_token !== verified_token) {
                return res.status(400).json({ msg: "Session is time out. Please try again.", status: false })
            }
        } else {
            return res.status(400).json({ msg: "Session is time out. Please try again.", status: false })
        }
        const hashPassword = bcrypt.hashSync(password, 10);
        const update = await User.findOneAndUpdate({ _id: user_id }, { password: hashPassword })
        if (update != null) {
            res.status(200).json({ msg: "Password has been changed successfully", status: true })
        }
        else {
            return res.status(400).json({ status: false, msg: "Something went wrong." })
        }
    }
    catch (error) {
        next(error)
    }
}

module.exports.auth = async (req, res, next) => {
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
        let user = null
        if (user_id) {
            user = await User.findById(user_id)
            if (user.accessToken !== token) {
                return res.status(400).json({ msg: "User is logged out please login.", status: false })
            }
        } else {
            return res.status(400).json({ msg: "Session is time out or Token is not valid. authentication failed.", status: false })
        }
        const response = {
            _id: user._id,
            email: user.email,
            name: user.name,
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phone,
            role:user.role
        }
        res.status(200).json({ msg: "Authorization successful", status: true, data: response })
    }
    catch (error) {
        next(error)
    }
}
module.exports.logout = async (req, res, next) => {
    try {
        const id = req.params.id
        const loggedOut = await User.findByIdAndUpdate(id, { accessToken: '' })
        res.status(200).json({ msg: "Logged Out", status: true })
    }
    catch (error) {
        next(error)
    }
} 
module.exports.userCount = async (req, res, next) => {
    try {
        const count = await User.countDocuments({})
        if (count != null) {
            res.json({ msg: 'Total user found', status: true, data: count })
        }
        else {
            res.status(400).json({ msg: 'Unable to count user', status: false })
        }
    }
    catch (error) {
        next(error)
    }
} 