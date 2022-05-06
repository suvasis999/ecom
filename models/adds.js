const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const addSchema = new Schema({
    heading: {
        type: String,
        required: [true, 'heading is required'],
    },
    heading2: {
        type: String,
    },
    title: {
        type: String,
    },
    title2: {
        type: String,
    },
    picture:{
        type:String,
        required:true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'product id is required'],
        ref: "Product",
    },
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Vendor",
    },
    add_type:{
        type:String,
        required: [true, 'add type is required'],
        enum:["top",'mid','lower']
    }
}, {
    timestamps: true,
});

const Adds = mongoose.model('Adds', addSchema);

module.exports = Adds;