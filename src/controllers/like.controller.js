import { Like } from '../models/like.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CustomApiError } from "../utils/ApiErrorHandler.js";
import { CustomApiResponse } from '../utils/ApiResponseHandler.js';

const toggleVideoLike = asyncHandler(async(req, res) => {

    //get the video to like or remove
    //check if the video is already like
    //if like delete the document
    //if not like add document
    
    const { videoId } = req.params;

    const like = await Like.findOne({ video: videoId,  });

    if(like){
        await like.deleteOne();
        return res.status(200).json(
            new CustomApiResponse(200, {}, 'Video unliked successfully')
        );
    }

    const newLike = await Like.create({ video: videoId, likedBy : req.user?._id });

    if(!newLike){
        throw new CustomApiError(400, 'Unable to like video');
    }

    return res.status(201).json(
            new CustomApiResponse(201, newLike, 'Video liked successfully')
        );

})

const toggleCommentLike = asyncHandler(async(req, res) => {
    
    const { commentId } = req.params;

    const like = await Like.findOne({
        comment : commentId,
        likedBy : req.user?._id
    })

    if(like){
        await like.deleteOne();
        return res.status(200).json(
            new CustomApiResponse(200, {}, 'Comment unliked successfully')
        );
    }

    const newLike = await Like.create({
        comment : commentId,
        likedBy : req.user?._id
    })

    if(!newLike){
        throw new CustomApiError(400, 'Unable to like comment');
    }

    return res.status(201).json(
            new CustomApiResponse(201, newLike, 'Comment liked successfully')
        );

})

const toggleTweetLike = asyncHandler(async(req, res) => {
    
    const { tweetId } = req.params;

    const like = await Like.findOne({
        tweet : tweetId,
        likedBy : req.user?._id
    })

    if(like){
        await like.deleteOne();
        return res.status(200).json(
            new CustomApiResponse(200, {}, 'Tweet unliked successfully')
        );
    }

    const newLike = await Like.create({
        tweet : tweetId,
        likedBy : req.user?._id
    })

    if(!newLike){
        throw new CustomApiError(400, 'Unable to like tweet');
    }

    return res.status(201).json(
        new CustomApiResponse(201, newLike, 'Tweet liked successfully')
    );

})

export { toggleVideoLike, toggleCommentLike, toggleTweetLike }