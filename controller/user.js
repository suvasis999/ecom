const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Validation = require("../config/validation");
const nodemailer = require("nodemailer");
const formData = require("form-data");

module.exports.register = async function (req, res, next) {
  try {
    const { email, password, firstname, lastname, phone, userName } = req.body;
    if (!email || !password || !firstname || !lastname || !userName) {
      return res
        .status(400)
        .json({ status: false, msg: "All fields are required" });
    }
    const existUser = await User.findOne({ email: email });
    //generate new password
    if (existUser != null) {
      return res
        .status(400)
        .json({ msg: "Email already exist", status: false });
    }
    const isExistUserName = await User.findOne({ userName: userName });
    if (isExistUserName !== null) {
      return res.status(400).json({ msg: "User name exist", status: false });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //create new user
    const newUser = new User({
      email: email,
      password: hashedPassword,
      firstname: firstname,
      lastname: lastname,
      phone: phone,
      userName: userName,
    });
    await newUser.save();
    const resData = {
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      _id: newUser._id,
      phone: newUser.phone,
      userName: newUser.userName,
      role: newUser.role,
    };
    //save user and respond
    const token = jwt.sign(
      {
        id: newUser._id,
        email: email,
      },
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_TIME) }
    );
    const messageData = {
      from: "Drala <postmaster@mail.dralapay.com>",
      to: email,
      subject: "Drala Account Activation",
      html: `
        <p>Thank you for choosing us.</p>
        <div
          style="display:flex; justify-content:center; align-items:center"
        >
        <a href='https://www.dralapay.com/api/v1/user/verify-email/${token}' target='_blank'
          style="padding:8px 18px;  text-align:center; color:white;background:#0505fd;
          text-decoration:none;font-size: 15px; border-radius: 8px;"
        >Click here to activate your account </a>
        </div>
      `,
    };

    let transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: "postmaster@mail.dralapay.com",
        pass: "e211436ab43112038dfd73a4be5d816a-77985560-baeda3c4",
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail(messageData);
    console.log("info", info);
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res
      .status(200)
      .json({ data: resData, msg: "New user added", status: true });
  } catch (err) {
    next(err);
  }
};
module.exports.update = async function (req, res, next) {
  try {
    const { email, firstname, lastname, phone, userName } = req.body;
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ status: false, msg: "Id not found" });
    }
    if (!email || !firstname || !lastname || !phone || !userName) {
      return res
        .status(400)
        .json({ status: false, msg: "All fields are required" });
    }
    const existUser = await User.findById(id);
    const isExistUserName = await User.findOne({
      userName: userName,
      _id: { $ne: id },
    });
    if (isExistUserName != null) {
      return res.status(400).json({ msg: "User name exist", status: false });
    }
    const isExistEmail = await User.findOne({ email: email, _id: { $ne: id } });
    if (isExistEmail != null) {
      return res.status(400).json({
        msg: "Email already exist. Please try another email",
        status: false,
      });
    }
    if (existUser == null) {
      return res.status(400).json({ msg: "User not found", status: false });
    }
    await User.findByIdAndUpdate(id, {
      email: email,
      firstname: firstname,
      lastname: lastname,
      phone: phone,
      userName: userName,
    });
    res.status(200).json({ msg: "Profile updated", status: true });
  } catch (err) {
    next(err);
  }
};
module.exports.checkUserName = async (req, res, next) => {
  try {
    const userName = req.params.userName;
    const user_id = req.query.user_id;
    if (!userName) {
      return res.status(400).json({ msg: "UserName required", status: false });
    }
    const isExist = await User.findOne({ userName: userName });
    if (user_id && isExist && isExist._id.equals(user_id)) {
      return res.status(200).json({ msg: "UserName available", status: true });
    } else if (isExist == null) {
      return res.status(200).json({ msg: "UserName available", status: true });
    } else {
      return res.status(200).json({ msg: "UserName exist", status: false });
    }
  } catch (err) {
    next(err);
  }
};
module.exports.changeWallet = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId || !req.body.wallet) {
      return res
        .status(400)
        .json({ msg: "userId & wallet required", status: false });
    }
    await User.findByIdAndUpdate(id, { wallet: req.body.wallet });
    return res.status(200).json({ msg: "Wallet updated", status: true });
  } catch (err) {
    next(err);
  }
};
module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ msg: "Email and Password are required", status: false });
    }
    const existUser = await User.findOne({ email: email });
    if (!existUser) {
      return res
        .status(400)
        .json({ msg: "Email or Password are incorrect ", status: false });
    }
    const checkpassword = bcrypt.compareSync(password, existUser.password);
    if (!checkpassword) {
      return res
        .status(400)
        .json({ msg: " Email or Password are incorrect", status: false });
    }
    if (!existUser.isVerified) {
      return res
        .status(200)
        .json({ msg: "Please verify your email.", status: false });
    }
    const token = jwt.sign(
      {
        id: existUser._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_TIME) }
    );

    User.findByIdAndUpdate(existUser._id, { accessToken: token }).exec(
      (er, doc) => {
        if (!er) {
          res.json({
            data: {
              firstname: existUser.firstname,
              lastname: existUser.lastname,
              _id: existUser._id,
              token,
              address: existUser.address,
              email: existUser.email,
              phone: existUser.phone,
              role: existUser.role,
              wallet: existUser.wallet,
            },
            status: true,
            msg: "Login success",
          });
        } else {
          return res
            .status(400)
            .json({ status: false, msg: "Something went wrong." });
        }
      }
    );
  } catch (error) {
    next(error);
  }
};
module.exports.getUserById = async (req, res, next) => {
  try {
    const user_id = req.params.user_id;
    if (!user_id) {
      return res
        .status(400)
        .json({ msg: "user_id is required", status: false });
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
          wallet: doc.wallet,
          address: doc.address,
          role: doc.role,
          isVerified: doc.isVerified,
          userName: doc.userName || "",
        };
        return res.json({ msg: "User found", status: true, data: resData });
      } else {
        return res.status(200).json({
          msg: "User not found. Something went wrong.",
          status: false,
        });
      }
    });
  } catch (error) {
    next(error);
  }
};
module.exports.forgotpw = async (req, res, next) => {
  try {
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({ msg: "Email is required", status: false });
    }
    const existUser = await User.findOne({ email: email });
    if (!existUser) {
      return res
        .status(400)
        .json({ msg: `No account is found with '${email}'`, status: false });
    }
    //send otp here
    const otp = Math.ceil(Math.random() * 99999 + 100000);
    const messageData = {
      from: "Drala <postmaster@mail.dralapay.com>",
      to: email,
      subject: "Drala OTP",
      html: `
        <h4>Your OTP is :</h4>
        <div
          style="display:flex; justify-content:center; align-items:center"
        >
        <h1>${otp}</h1>
        </div>
      `,
    };

    let transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: "postmaster@mail.dralapay.com",
        pass: "e211436ab43112038dfd73a4be5d816a-77985560-baeda3c4",
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail(messageData);
    // console.log(otp);
    const verify = {
      verification: {
        otp: otp,
        send_by: "email",
        send_at: new Date(),
      },
    };
    const update = await User.findOneAndUpdate({ email: email }, verify);
    if (update != null) {
      //remove otp from below ***
      return res
        .status(200)
        .json({ msg: "Please verify with otp", status: true });
    } else {
      return res
        .status(400)
        .json({ status: false, msg: "Something went wrong." });
    }
  } catch (error) {
    next(error);
  }
};
//verify otp for password change
module.exports.verifyotp = async (req, res, next) => {
  try {
    const email = req.query.email;
    const otp = Number(req.query.otp);
    if (!email) {
      return res.status(400).json({ msg: "Email is required", status: false });
    }
    const existUser = await User.findOne({ email: email });
    if (!existUser) {
      return res
        .status(400)
        .json({ msg: `No account is found with '${email}'`, status: false });
    }
    if (existUser.verification.otp !== otp) {
      return res
        .status(400)
        .json({ msg: `OTP is invalid. Please try again`, status: false });
    }
    const timecheck = new Date() - existUser.verification.send_at;
    if (timecheck > process.env.OTP_TIME * 1000) {
      return res
        .status(400)
        .json({ msg: `OTP is expired. Please try again`, status: false });
    } else {
      const token = jwt.sign(
        {
          id: existUser.id,
        },
        process.env.JWT_SECRET,
        { expiresIn: 60 * 5 }
      );

      const update = await User.findOneAndUpdate(
        { email: email },
        { "verification.verified_token": token }
      );
      if (update != null) {
        return res.status(200).json({
          msg: `OTP is verified.`,
          status: true,
          verified_token: token,
        });
      } else {
        return res
          .status(400)
          .json({ status: false, msg: "Something went wrong." });
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports.changepw = async (req, res, next) => {
  try {
    const { password, verified_token } = req.body;
    if (!password || !verified_token) {
      return res.status(400).json({
        msg: "Please provide token and new password to change password",
        status: false,
      });
    }
    const user_id = jwt.verify(
      verified_token,
      process.env.JWT_SECRET,
      (er, decode) => {
        if (!er) {
          return decode.id;
        } else return null;
      }
    );
    if (user_id) {
      const db_token = await User.findById(user_id).select(
        "verification.verified_token"
      );
      if (db_token.verification.verified_token !== verified_token) {
        return res.status(400).json({
          msg: "Session is time out. Please try again.",
          status: false,
        });
      }
    } else {
      return res
        .status(400)
        .json({ msg: "Session is time out. Please try again.", status: false });
    }
    const hashPassword = bcrypt.hashSync(password, 10);
    const update = await User.findOneAndUpdate(
      { _id: user_id },
      { password: hashPassword, "verification.verified_token": "" }
    );
    if (update != null) {
      res
        .status(200)
        .json({ msg: "Password has been changed successfully", status: true });
    } else {
      return res
        .status(400)
        .json({ status: false, msg: "Something went wrong." });
    }
  } catch (error) {
    next(error);
  }
};

module.exports.auth = async (req, res, next) => {
  try {
    const getToken =
      req.headers.authorization ||
      req.body.token ||
      req.query.token ||
      req.headers["x-access-token"];
    if (!getToken) {
      return res
        .status(401)
        .json({ msg: "Please provide token.", status: false });
    }
    let token = getToken;
    if (getToken && getToken.split(" ")[0] === "Bearer") {
      token = getToken.split(" ")[1];
    }

    const user_id = jwt.verify(token, process.env.JWT_SECRET, (er, decode) => {
      if (!er) {
        return decode.id;
      } else return null;
    });
    let user = null;
    if (user_id) {
      user = await User.findById(user_id);
      // if (user.accessToken !== token) {
      //   return res
      //     .status(401)
      //     .json({ msg: "User is logged out please login.", status: false });
      // }
    } else {
      return res.status(401).json({
        msg: "Session is time out or Token is not valid. authentication failed.",
        status: false,
      });
    }
    const response = {
      _id: user._id,
      email: user.email,
      name: user.name,
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      role: user.role,
      wallet: user.wallet,
    };
    res
      .status(200)
      .json({ msg: "Authorization successful", status: true, data: response });
  } catch (error) {
    next(error);
  }
};
module.exports.logout = async (req, res, next) => {
  try {
    const id = req.params.id;
    const loggedOut = await User.findByIdAndUpdate(id, { accessToken: "" });
    res.status(200).json({ msg: "Logged Out", status: true });
  } catch (error) {
    next(error);
  }
};
module.exports.userCount = async (req, res, next) => {
  try {
    const count = await User.countDocuments({});
    if (count != null) {
      res.json({ msg: "Total user found", status: true, data: count });
    } else {
      res.status(400).json({ msg: "Unable to count user", status: false });
    }
  } catch (error) {
    next(error);
  }
};
module.exports.updateAddress = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.json({ msg: "Id not found", status: false });
    }
    if (req.body.id) {
      await User.findOneAndUpdate(
        { _id: id, "address._id": req.body.id },
        {
          $set: {
            "address.$": {
              name: req.body.name,
              email: req.body.email,
              phone: req.body.phone,
              address_line_1: req.body.address_line_1,
              address_line_2: req.body.address_line_2,
              address_line_3: req.body.address_line_3,
              zip_code: req.body.zip_code,
              landmark: req.body.landmark,
              state: req.body.state,
              country: req.body.country,
            },
          },
        }
      );
    } else {
      await User.findByIdAndUpdate(id, {
        $push: {
          address: {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            address_line_1: req.body.address_line_1,
            address_line_2: req.body.address_line_2,
            address_line_3: req.body.address_line_3,
            zip_code: req.body.zip_code,
            landmark: req.body.landmark,
            state: req.body.state,
            country: req.body.country,
          },
        },
      });
    }
    res.status(200).json({ msg: "Address updated", status: true });
  } catch (error) {
    next(error);
  }
};
module.exports.makeDefaultAddress = async (req, res, next) => {
  try {
    const { address_id, user_id } = req.body;
    if (!user_id || !address_id) {
      return res.json({ msg: "address_id, user_id  not found", status: false });
    }
    await User.findOneAndUpdate({_id:user_id},{
      $set:{"address.$[].isDefault": false}
    })
    await User.findOneAndUpdate(
      { _id: user_id, "address._id": address_id },
      {$set:{ "address.$.isDefault": true }}
    );
   
    res.status(200).json({ msg: "Address updated", status: true, });
  } catch (error) {
    next(error);
  }
};
module.exports.deleteAddress = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.json({ msg: "Id not found", status: false });
    }
    const addressId = req.body.addressId;
    await User.findByIdAndUpdate(id, {
      $pull: {
        address: {
          _id: addressId,
        },
      },
    });
    res.status(200).json({ msg: "Address deleted", status: true });
  } catch (error) {
    next(error);
  }
};
module.exports.changePWWidthPW = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const id = req.params.id;
    if (!id || !newPassword) {
      return res.status(400).json({
        msg: "id or newPassword not founds.",
        status: false,
      });
    }

    const hashPassword = bcrypt.hashSync(newPassword, 10);
    const update = await User.findOneAndUpdate(
      { _id: id },
      { password: hashPassword }
    );
    if (update != null) {
      res
        .status(200)
        .json({ msg: "Password has been changed successfully", status: true });
    } else {
      return res
        .status(400)
        .json({ status: false, msg: "Something went wrong." });
    }
  } catch (error) {
    next(error);
  }
};

module.exports.updateWallet = async (req, res, next) => {
  try {
    const { dralaAddress } = req.body;
    const id = req.params.id;
    if (!id || !dralaAddress) {
      return res.status(400).json({
        msg: "id or dralaAddress not founds.",
        status: false,
      });
    }
    const update = await User.findOneAndUpdate(
      { _id: id },
      { wallet: dralaAddress }
    );
    if (update != null) {
      res.status(200).json({ msg: "Wallet has been updated.", status: true });
    } else {
      return res
        .status(400)
        .json({ status: false, msg: "Something went wrong." });
    }
  } catch (error) {
    next(error);
  }
};
module.exports.deleteWallet = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        msg: "id  not founds.",
        status: false,
      });
    }
    const update = await User.findOneAndUpdate({ _id: id }, { wallet: "" });
    if (update != null) {
      res.status(200).json({ msg: "Wallet has been deleted.", status: true });
    } else {
      return res
        .status(400)
        .json({ status: false, msg: "Something went wrong." });
    }
  } catch (error) {
    next(error);
  }
};
module.exports.verifyEmail = async function (req, res, next) {
  try {
    const token = req.params.token;
    console.log("token=>>>>", token);
    if (!token) {
      return res.redirect(`https://www.dralapay.com`);
    }
    const data = jwt.verify(token, process.env.JWT_SECRET, (er, decode) => {
      if (!er) {
        return decode;
      } else return null;
    });
    console.log("data=>>>>", data);
    if (data) {
      const existUser = await User.findOne({ _id: data.id, email: data.email });
      if (!existUser) {
        return res.redirect(
          `https://www.dralapay.com/user-not-verified/${
            data.email
          }?failed=${true}`
        );
      } else {
        existUser.isVerified = true;
        await existUser.save();
        res.redirect("https://www.dralapay.com/login");
      }
    } else {
      return res.redirect(
        `https://www.dralapay.com/user-not-verified/${
          data.email
        }?failed=${true}`
      );
    }
  } catch (error) {
    next(error);
  }
};
module.exports.resendEmail = async function (req, res, next) {
  try {
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({ msg: "Email not found", status: false });
    }

    const existUser = await User.findOne({ email: email });
    if (!existUser) {
      return res.status(200).json({ msg: "User not found", status: false });
    }

    //save user and respond
    const token = jwt.sign(
      {
        id: existUser._id,
        email: email,
      },
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_TIME) }
    );
    const messageData = {
      from: "Drala <postmaster@mail.dralapay.com>",
      to: email,
      subject: "Drala Account Activation",
      html: `
        <p>Thank you for choosing us.</p>
        <div
          style="display:flex; justify-content:center; align-items:center"
        >
        <a href='http://localhost:5000/api/v1/user/verify-email/${token}' target='_blank'
          style="padding:8px 18px;  text-align:center; color:white;background:#0505fd;
          text-decoration:none;font-size: 15px; border-radius: 8px;"
        >Click here to activate your account </a>
        </div>
      `,
    };

    let transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: "postmaster@mail.dralapay.com",
        pass: "e211436ab43112038dfd73a4be5d816a-77985560-baeda3c4",
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail(messageData);
    console.log("info", info);
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    res.status(200).json({ msg: "Email sent", status: true });
  } catch (error) {
    next(error);
  }
};
module.exports.test = async (req, res, next) => {
  try {
    const API_KEY = "6c7a62bb3077c29f5e9e6fdd412b277d-4f207195-e7f393c3";
    const DOMAIN = "mail.dralapay.com";

    const messageData = {
      from: "Drala <postmaster@mail.dralapay.com>",
      to: "tarik.xomox@gmail.com",
      subject: "Drala Account Activation",
      html: `
        <p>Thank you for choosing us.</p>
        <div
          style="display:flex; justify-content:center; align-items:center"
        >
        <a href='https://www.dralapay.com' target='_blank'
          style="padding:8px 18px;  text-align:center; color:white;background:#0505fd;
          text-decoration:none;font-size: 15px; border-radius: 8px;"
        >Click here to activate your account </a>
        </div>
      `,
    };

    let transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: "postmaster@mail.dralapay.com",
        pass: "e211436ab43112038dfd73a4be5d816a-77985560-baeda3c4",
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail(messageData);
    console.log("info", info);
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    // const formData = require('form-data');
    // const Mailgun = require('mailgun.js');

    // const mailgun = new Mailgun(formData);
    // const client = mailgun.client({ username: 'api', key: API_KEY });

    // client.messages.create(DOMAIN, messageData)
    //   .then((res) => {
    //     console.log(res);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });

    res.send("ok");
  } catch (error) {
    next(error);
  }
};
