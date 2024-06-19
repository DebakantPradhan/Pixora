// require('dotenv').config()       //this one is for commonjs synatx 
// console.log(process.env)

// import dotenv from "dotenv/config"
import dotenv from "dotenv"
import connectDB from "./db/db_connect.js"
import {app} from "./app.js"

dotenv.config()
// console.log(process.env)

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running at port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("mongoDB connection failed !!!",err);
})














/*
import mongoose from "mongoose"
import { DB_NAME } from "./constants"

import express from "express"
const app = express()

(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

        // now use express app for listening 

        app.on("errror",(error)=>{
            console.log("errror: ",error);
            throw error
        })

        app.listen(process.env.PORT , ()=>{
            console.log(`app is listening on ${porcess.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR:", error)
    }
})()

*/