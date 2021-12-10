const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');

const cors = require('cors')

const app = express();
app.use(cors())


app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const db = require('./config/keys').mongoURI;

const router = require('./routes/api/users')
const prouter = require('./routes/api/product')
const pcart  = require('./routes/api/cart')
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB Connected'))


  .catch(err => console.log(err));



// Passport middleware
app.use(passport.initialize());
app.use('/', router);
app.use('/product', prouter)
app.use('/cart',pcart)

// Passport Config
require('./config/passport')(passport);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));