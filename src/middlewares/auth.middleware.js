import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomApiError } from "../utils/ApiErrorHandler.js";
import { User } from "../models/user.model.js";


const verifyUser = asyncHandler(async(req, res, next) =>{
    try {
        const token = req?.cookie?.accessToken || req.header('Authorization')?.replace('Bearer ', '')
        // console.log("token ", token);
        if(!token) {
            throw new CustomApiError(401, "Unauthorized to access this route")
        }
        //test sdads
        const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decoded?._id).select("-password -refreshToken")

        // console.log("decoded and user ", decoded , user);

        if(!user){
            throw new CustomApiError(401, "Unauthorized to access this route")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new CustomApiError(401, 'Invalid token')
    }

})

export default verifyUser