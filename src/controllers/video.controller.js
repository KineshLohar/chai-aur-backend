import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomApiError } from "../utils/ApiErrorHandler.js";
import { deleteImageFromCloudinary, deleteVideoFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { CustomApiResponse } from "../utils/ApiResponseHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "./../models/video.model.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 2, query = "", sortBy = "createdAt", sortType = 1, userId = "" } = req.query

//   if (!isValidObjectId(userId)) {
//     throw new CustomApiError(400, "User id is not valid");
//   }

  // let pipeline =

  let aggregate = Video.aggregate([
    {
      $match: {
            title: {
              $regex: query,
              $options: "i",
            },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
        $addFields : {
            owner : {
                $arrayElemAt : ['$owner', 0]
            },
        }
    },
    {
        $sort : {
            [sortBy || 'createdAt'] : sortType || 1
        }
    }
  ])

  const options = {
    page,
    limit : parseInt(limit),
    sort : {
        [sortBy] : sortType
    },
    skip : (page - 1) * limit,
    customLabels : {
        totalDocs : 'totalVideos',
        docs : 'videos'
    },
    // countQuery : aggregate
  }
  
  await Video.aggregatePaginate(aggregate, options)
  .then(result => {
    const allVideos = result

    return res.status(200).json(
        new CustomApiResponse(200, allVideos, "all videos fetched ")
    )

  })
  .catch(err => {
    console.log(err);
     throw new CustomApiError(400, 'Unable to get all videos', err)
  })
});

const getVideoById = asyncHandler(async (req, res) => {
    const { id } = req.params

    const video = await Video.aggregate([
        {
            $match : {
                // _id : new mongoose.Types.ObjectId(id)
                _id : id
            }
        },
        {
            $lookup : {
                from : 'users',
                localField : 'owner',
                foreignField : '_id',
                as : 'owner',
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            fullName : 1,
                            avatar : {
                                url : 1
                            }
                        }
                    }
                    
                ]
            }
           
        },
        {
            $addFields : {
                owner : {
                    $arrayElemAt : ['$owner', 0]
                }
            }
        }
    ])

    console.log("id ", id, video);

    if(!video){
        throw new CustomApiError(400, "Unable to find the video")
    }

    return res.status(200).json(
        new CustomApiResponse(200, video[0], "Video fetched successfully!")
    )
});

const publishVideo = asyncHandler(async (req, res) => {

    //get video details from user
    //validate details
    //upload video on cloudinary upload thumnail
    // store urls and save 

    const { title, description , isPublished } = req.body

    console.log("publish data ", title, description, isPublished);

    if(!title || !description){
        throw new CustomApiError(400, "All details are required!")
    }

    const thumbnailPath = req.files?.thumbnail[0]?.path

    if(!thumbnailPath){
        throw new CustomApiError(400, "thumbnail is required")
    }

    const videoPath = req.files?.videoFile[0]?.path

    if(!videoPath){
        throw new CustomApiError(400, "video is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailPath)
    if(!thumbnail){
        throw new CustomApiError(400, "Something went wrong while uploading the thumbnail!")
    }

    const videoFile = await uploadOnCloudinary(videoPath)
    if(!videoFile){
        throw new CustomApiError(400, "Something went wrong while uploading the thumbnail!")
    }

    const video = await Video.create({
        title,
        description,
        thumbnail : {
            url : thumbnail?.url,
            public_id : thumbnail?.public_id
        },
        videoFile : {
            url : videoFile?.url,
            public_id : videoFile?.public_id
        },
        duration : videoFile?.duration,
        owner : req.user?._id
    })

    if(!video){
        throw new CustomApiError(400, "Unable to publish video")
    }

    res.status(201).json(
        new CustomApiResponse(201, video, 'Video published successfully')
    )

});

const updateVideoDetails = asyncHandler(async (req, res) => {});

const deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await Video.findById(id);

    if(!video) {
        throw new CustomApiError(400, 'Video not found');
    }

    const deletedVideo = await Video.findByIdAndDelete(id);
    if(!deletedVideo) {
        throw new CustomApiError(400, 'Unable to delete video');
    }
    console.log("video deleted successfully", deletedVideo , video);

    const deletedVideoFromCloudinary = await deleteVideoFromCloudinary(deletedVideo?.videoFile?.public_id)
    if(!deletedVideoFromCloudinary){
        throw new CustomApiError(400, 'Unable to delete video from cloudinary');
    }

    console.log("video deleted from cloud", deletedVideoFromCloudinary);

    const deletedThumbnailFromCloudinary = await deleteImageFromCloudinary(deletedVideo?.thumbnail?.public_id)
    if(!deletedThumbnailFromCloudinary){
        throw new CustomApiError(400, 'Unable to delete thumbnail from cloudinary');
    }  

    console.log("thumbnail deleted from cloud", deletedThumbnailFromCloudinary);

    return res.status(200).json(
        new CustomApiResponse(200, {}, 'Video deleted successfully')
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
        throw new CustomApiError(400, 'Unable to update video publish status');
    }

    video.isPublished = !video.isPublished;

    await video.save();

    const updatedVideo = await Video.findById(id);

    res.status(200).json(
        new CustomApiResponse(200, updatedVideo, 'Video publish status updated successfully')
    );
});

export {
  getAllVideos,
  getVideoById,
  publishVideo,
  updateVideoDetails,
  deleteVideo,
  togglePublishStatus,
};
