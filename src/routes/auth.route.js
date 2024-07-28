import express from 'express'
import { changeCurrentPasswod, getChannelDetails, getCurrentUser, getWatchHistory, login, logout, refreshAccessToken, register, updateAccountDetails, updateAvatarImage, updateCoverImage } from '../controllers/user.controller.js'
import { upload } from './../middlewares/multer.middleware.js';
import verifyUser from '../middlewares/auth.middleware.js';

const router = express.Router()

router.route('/register').post( 
    upload.fields([
        {
            name : 'avatar',
            maxCount : 1
        },
        {   
            name : "coverImage",
            maxCount : 1
        }
    ]),
    register
    )

router.route('/login').post(login)

router.route('/logout').post(verifyUser, logout)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').patch(verifyUser, changeCurrentPasswod)
router.route('/update-account').patch(verifyUser, updateAccountDetails)
router.route('/update-avatar').patch(verifyUser, upload.single("avatar"), updateAvatarImage)
router.route('/update-cover-image').patch(verifyUser, upload.single('coverImage'),updateCoverImage)
router.route('/get-current-user').get(verifyUser, getCurrentUser)
router.route('/c/:username').get(verifyUser, getChannelDetails)
router.route('/watch-history').get(verifyUser, getWatchHistory)
export default router