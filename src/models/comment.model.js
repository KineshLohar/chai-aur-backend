import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({

    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },

    video : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Video'
    },
    content : {
        type : String,
        required : true
    }


}, {
    timestamps : true
});

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model('Comment', commentSchema)