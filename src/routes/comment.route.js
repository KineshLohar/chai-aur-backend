import express from 'express'
import verifyUser from '../middlewares/auth.middleware.js'
import { createComment, deleteComment, getAllComments, updateComment } from '../controllers/comment.controller.js'

const router = express.Router()

router.use(verifyUser)

router.route('/:videoId').get(getAllComments).post(createComment)
router.route('/c/:commentId').delete(deleteComment).patch(updateComment)


export default router