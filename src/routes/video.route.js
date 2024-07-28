import { Router } from "express";
import verifyUser from './../middlewares/auth.middleware.js';
import { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()


router.route('/publish-video').post(verifyUser, 
    upload.fields([
        {
            name : 'videoFile',
            maxCount : 1
        },
        {
            name : 'thumbnail',
            maxCount : 1
        }
    ])
    , publishVideo)

router.route('/video/:id').get(verifyUser, getVideoById).delete(verifyUser, deleteVideo)
router.route('/get-all-videos').get(verifyUser, getAllVideos)
router.route('/toggle/publish/:id').patch(verifyUser, togglePublishStatus)

export default router