const mongoose = require('mongoose');

const PaymentsSchema = new mongoose.Schema({
    orders: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        required: true
    }],
    date: {
        type: Date,
        required: true
    },
    total_price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'paid', 'rejected', 'failed','cancelled']
    },
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    vendors: [{
        vendor: {
            type: mongoose.Schema.ObjectId,
            ref: 'Vendor',
            required: true
        },
        amount: Number,
        order: {
            type: mongoose.Schema.ObjectId,
            ref: 'Order'
        }
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('PaymentsOldSchema', PaymentsSchema);