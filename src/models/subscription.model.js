import mongoose,{Schema, Types} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,   //One who is subscribing
        ref : "User"
    },
    channel:{
        type : Schema.Types.ObjectId,   //One who is owner
        ref : "User"
    }
    
},{timestamps:true})
export const Subscription = mongoose.model('Subscription',subscriptionSchema)