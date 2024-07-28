import express from 'express'
import verifyUser from './../middlewares/auth.middleware.js';
import { toggleCommentLike, toggleTweetLike, toggleVideoLike } from '../controllers/like.controller.js';

const router = express.Router()

router.use(verifyUser)

router.route('/toggle/v/:videoId').post(toggleVideoLike)
router.route('/toggle/c/:commentId').post(toggleCommentLike)
router.route('/toggle/t/:tweetId').post(toggleTweetLike)


export default router
