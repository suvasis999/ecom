const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let ChatSchema = new Schema({
    isRead:{
        type:Boolean,
        default:true
    },
    members: [{
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type:{
            type:String,
            enum:["buyer","seller","admin"]
        }
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
        body: String,
        attachment:{
            file:String,
            fileType:String
        }
    }],
    
},
{
    timestamps: true,
})

module.exports = mongoose.model("Chat", ChatSchema);