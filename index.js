const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');
const errorHandler = require("./config/error")
const morgan = require('morgan')
const cors = require('cors')
const connectDB = require('./config/db');
require('dotenv').config();

const User = require("./models/User")
const role = require("./config/role")
const app = express();
//middleware
app.use(cors())
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('tiny'))
}
app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
require('./config/passport')(passport);
//database

connectDB()
//routers
const userRouter = require('./routes/users')
const vendorRouter = require('./routes/vendor')
const catRouter = require('./routes/category')
const productRouter = require('./routes/product')
const wishlistRouter = require('./routes/wishlist')
const cartRouter = require('./routes/cart')
const orderRouter = require('./routes/order')
const reviewRouter = require('./routes/review')
const paymentRouter = require('./routes/payment')




// Passport middleware
app.use('/api/v1/user', userRouter);
app.use('/api/v1/vendor', vendorRouter);
app.use('/api/v1/category', catRouter);
app.use('/api/v1/product', productRouter)
app.use('/api/v1/wishlist', wishlistRouter)
app.use('/api/v1/cart', cartRouter)
app.use('/api/v1/order', orderRouter)
app.use('/api/v1/review', reviewRouter)
app.use('/api/v1/payment', paymentRouter)


//middleware for error handler
app.use(function (req, res, next) {
	let err = new Error('Url Not Found');
	err.status = 404;
	next(err);
});
app.use(errorHandler);
//handle unhandled promise
process.on("unhandledRejection", (err, promise) => {
	console.log(`Unhandled Error: ${err.message}`);
	//close server & exit
	//app.close(() => process.exit(1));
});
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));