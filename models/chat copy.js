const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let ChatSchema = new Schema({
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    message: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        time: {
            type: Date,
            default: new Date()
        },
        body: String
    }]
},
{
    timestamps: true,
})

module.exports = mongoose.model("Chat", ChatSchema);