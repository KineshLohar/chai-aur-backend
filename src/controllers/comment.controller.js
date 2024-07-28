import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { CustomApiError } from "../utils/ApiErrorHandler.js";
import { CustomApiResponse } from "../utils/ApiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = 1 } = req.query;

    // Validate inputs
    if (!videoId) {
        throw new CustomApiError(400 ,"Video id is required");
    }

    // console.log("video id ", videoId);
    // console.log( mongoose.Types.ObjectId(videoId));
    const aggregate = Comment.aggregate([
            {
                $match : {
                    video :new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $sort : {
                    [sortBy] : sortType
                }
            }
        ])

    // const pipeline = [
    //     {
    //         $match : {
    //             video :new mongoose.Types.ObjectId(videoId)
    //         }
    //     },
    //     {
    //         $sort : {
    //             [sortBy] : sortType
    //         }
    //     }
    // ]

    const options = {
        page, 
        limit
    }

    await Comment.aggregatePaginate(aggregate, options)
    // await Comment.aggregate(pipeline)
    .then(result => {
        console.log("result: " , result);
        return res.status(200).json(
            new CustomApiResponse(200, result, "All comments fetched!")
        )
    })
    .catch(error => {
        console.log('error fetching comments', error);
        throw new CustomApiError(400, "An error occurred while fetching comments")
    })

    

})

const createComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params

    // Validate inputs
    if (!content) {
        throw new CustomApiError(400, "Content is required");
    }

    if(!videoId){
        throw new CustomApiError(400, "Video id is required")
    }

    const comment = await Comment.create({
        owner : req.user?._id,
        content : content,
        video : videoId
    })

    if(!comment){
        throw new CustomApiError(400, "Unable to create comment")
    }

    return res
       .status(201)
       .json(
        new CustomApiResponse(201, comment , "Comment created!")
       )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findByIdAndDelete(commentId)

    if(!comment){
        throw new CustomApiError(400, "Comment not found")
    }

    return res
       .status(200)
       .json(
        new CustomApiResponse(200, {}, "Comment deleted!")
       )

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const { content } = req.body;

    const comment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true })

    if(!comment){
        throw new CustomApiError(400, "Unable to update comment")
    }

    return res
       .status(200)
       .json(
        new CustomApiResponse(200, comment, "Comment updated!")
       )
 
})

export {
    createComment,
    deleteComment,
    updateComment,
    getAllComments
}