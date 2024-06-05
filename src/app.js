import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// import dotenv from "dotenv/config"       //it will enable the env variable accessible from this file eg CORS_ORIGIN

const app = express()

//To handle cors(cross origin resource sharing) problem in web browser we configure this 
//cors is a middleware and hence use with app.use 
app.use(cors({
    origin:process.env.CORS_ORIGIN,             //for allowing requests from process.env.cors_orgin or a specific url. these are optional
    credentials: true
}))

//further we configure some express security practices for security purpose like while recieving a request as url or json or form etc as following 

app.use(express.json({limit:"16kb"}))       //for limiting size of json data in request
app.use(express.urlencoded({extended:true,limit:"16kb"}))   //for decoding url
app.use(express.static("public"))   //Express looks up the files relative to the static directory, so the name of the static directory(public) is not part of the URL.


// configuration for cookieParser used to execute CRUD opeartions on cookies
app.use(cookieParser())

export {app} 