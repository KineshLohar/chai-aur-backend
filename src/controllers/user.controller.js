import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomApiError } from "../utils/ApiErrorHandler.js";
import { User } from "../models/user.model.js";
import { deleteImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { CustomApiResponse } from "../utils/ApiResponseHandler.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new CustomApiError(500, "internal server error");
  }
};

const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  if (
    [username, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new CustomApiError(400, "All fields are required!");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new CustomApiError(409, "username or email already exist!");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new CustomApiError(400, "Avatar file is required!");
  }

  // console.log("file paths ", avatarLocalPath, coverImageLocalPath);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  if (!avatar) {
    throw new CustomApiError(400, "avatar is required!");
  }

  const user = await User.create({
    fullName,
    avatar: {
      url : avatar?.url,
      public_id : avatar?.public_id
    },
    coverImage: {
      url : coverImage?.url || "",
      public_id : coverImage?.public_id || ""
    },
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new CustomApiError(
      500,
      "Something went wrong while registering user"
    );
  }

  return res
    .status(201)
    .json(
      new CustomApiResponse(200, createdUser, "User registered successfully!")
    );
});

const login = asyncHandler(async (req, res) => {
  //get creds from user
  // check if user exist
  //if exist check password;
  //if user exist and cred are ok
  //generate tokens and send to user and update in database

  const { username, email, password } = req.body;

  if (!(email || username)) {
    throw new CustomApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new CustomApiError(404, "User does not exist!");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new CustomApiError(401, "Invalid credentials!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    " -password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new CustomApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in successfully!"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  await User.findOneAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new CustomApiResponse(200, {}, "User logged out successfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //take refresh token
  //decode and find user
  //compare token
  //if good then generate new token and send

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new CustomApiError(401, "Unauthorized");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new CustomApiError(401, "Invalid token");
  }
  // console.log("tokens ", incomingRefreshToken, user.refreshToken);

  if (incomingRefreshToken !== user.refreshToken) {
    throw new CustomApiError(401, "Refresh token is expired or invalid");
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user?._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new CustomApiResponse(
        200,
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        "Access token refreshed"
      )
    );
});

const changeCurrentPasswod = asyncHandler(async (req, res) => {
  // get data from fe
  // check if old pass is same as in db
  // if yes then save new pass else throw error

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isOldPassSame = await user.isPasswordCorrect(oldPassword);

  if (!isOldPassSame) {
    throw new CustomApiError(400, "Incorrect Old Password");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new CustomApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // console.log("req user ",req.user._id);
  const user = await User.findById(req.user?._id).select("-password");

  if (!user) {
    throw new CustomApiError(400, " Cannot find the user!");
  }

  return res
    .status(200)
    .json(new CustomApiResponse(200, user, "User fetched successfully!"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  //get data
  // find user and update the value
  // return updated user

  const { email, fullName } = req.body;

  if (!email || !fullName) {
    throw new CustomApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  if (!user) {
    throw new CustomApiError(400, "Unable to update user details");
  }

  return res
    .status(200)
    .json(new CustomApiResponse(200, user, "User updated successfully!"));
});

const updateAvatarImage = asyncHandler(async (req, res) => {
  //get image from multer
  // get user if user exist then upload on cloudinary
  //update url in db

  const avatarLocalPath = req.file?.path;
  const avatarPublicId = req.body.public_id;

  if (!avatarLocalPath) {
    throw new CustomApiError(500, "Unable to access the local file path");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("cloudinary res avatar", avatar);

  if (!avatar?.url) {
    throw new CustomApiError(400, "Error while uploading file");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        avatar : {
          url : avatar?.url,
          public_id : avatar?.public_id
        }
      }
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if(!user){
    const deleteAvatar = await deleteImageFromCloudinary(avatar?.public_id)
    console.log("deleted new image because something went wrong", deleteAvatar);
    throw new CustomApiError(400, 'Something went wrong while updating cover image')
  }

  const deleteOldAvatar = await deleteImageFromCloudinary(avatarPublicId)
  if(!deleteOldAvatar){
    console.log("something went wrong while deleting old cover image");
  }

  return res
    .status(200)
    .json(
      new CustomApiResponse(200, user, "Avatar image updated successfully!")
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  const coverImagePublicId = req.body.public_id;

  if (!coverImageLocalPath) {
    throw new CustomApiError(500, "Unable to access the local file path");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new CustomApiError(400, "Error while uploading file");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        coverImage : {
          url : coverImage?.url,
          public_id : coverImage?.public_id
        }
      }
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if(!user){
    const deleteCoverImage = await deleteImageFromCloudinary(coverImage?.public_id)
    console.log("deleted new image because something went wrong", deleteCoverImage);
    throw new CustomApiError(400, 'Something went wrong while updating cover image')
  }

  const deleteOldCoverImage = await deleteImageFromCloudinary(coverImagePublicId)
  if(!deleteOldCoverImage){
    console.log("something went wrong while deleting old cover image");
  }
  return res
    .status(200)
    .json(
      new CustomApiResponse(200, user, "Cover image updated successfully!")
    );
});

const getChannelDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new CustomApiError(400, "Username is required");
  }

  let pipeline = [
    {
      $match: {
        username: username?.toLowerCase().trim(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "mySubscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "mySubscriptions",
      },
    },
    {
      $addFields: {
        subscribers: {
          $size: "$mySubscribers",
        },
        subscriptions: {
          $size: "$mySubscriptions",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$mySubscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        username: 1,
        subscribers: 1,
        subscriptions: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ];

  const channel = await User.aggregate(pipeline);
  console.log("channel details after aggregations ", channel);

  if (!channel?.length) {
    throw new CustomApiError(400, "Channel not found!");
  }

  return res
    .status(200)
    .json(
      new CustomApiResponse(
        200,
        channel[0],
        "Channel detail fetched successfully!"
      )
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
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
                {
                  $addFields: {
                    owner: {
                      $arrayElemAt: ["$owner", 0],
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ];

  const user = await User.aggregate(pipeline);

  if (!user) {
    throw new CustomApiError(400, "Unable to give channel info ");
  }

  return res
    .status(200)
    .json(
      new CustomApiResponse(
        200,
        user[0],
        "Watch history fetched successfully!"
      )
    );
});

export {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarImage,
  updateCoverImage,
  changeCurrentPasswod,
  getWatchHistory,
  getChannelDetails,
};
