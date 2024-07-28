import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))
app.use(express.json())
app.use(express.urlencoded({extended : true, limit : '16kb'}));
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import authRoutes from './routes/auth.route.js'
import videoRoutes from './routes/video.route.js'
import likeRoutes from './routes/like.route.js'
import commentRoutes from './routes/comment.route.js'

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/video', videoRoutes)
app.use('/api/v1/like', likeRoutes)
app.use('/api/v1/comments', commentRoutes)


export { app }