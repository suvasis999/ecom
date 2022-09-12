const mongoose = require('mongoose');

const PaymentsSchema = new mongoose.Schema({
    metaData:{
        type: Object,
      },
    amount: {
        type: String,
        required: true
    },
    transferFrom : {
        type: String,
        required: true
    },
    transferTo : {
        type: String,
        required: true
    },
    transactionId: {
        type: String,
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
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Payments', PaymentsSchema);