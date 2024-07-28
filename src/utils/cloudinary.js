import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return response;

    // console.log("File uuplaoded ", response);
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.error("inside uploadOnCloudinary ", localFilePath, error);

    return null;
  }
};

const deleteImageFromCloudinary = async (public_id) => {
    try {
        const response = await cloudinary.uploader.destroy(public_id , {
          resource_type : 'image'
        })
        console.log("deleted asset from cloudinary ", response);
        return response
    } catch (error) {
        console.log("something went wrong while deleting from cloudinary ", error);
        return null
    }
}

const deleteVideoFromCloudinary = async (public_id) => {
  try {
      const response = await cloudinary.uploader.destroy(public_id , {
        resource_type : 'video'
      })
      console.log("deleted video from cloudinary ", response);
      return response
  } catch (error) {
      console.log("something went wrong while deleting video from cloudinary ", error);
      return null
  }
}

export { uploadOnCloudinary, deleteImageFromCloudinary, deleteVideoFromCloudinary };
