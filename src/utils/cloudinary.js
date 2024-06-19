import { v2 as cloudinary } from 'cloudinary';
import { response } from 'express';
import fs from "fs"

//cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uplaodOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file to cloudinary
        const uploadResult = await cloudinary.uploader.upload(localFilePath,
            {
                resource_type: "auto"
            }
        )
        //file has been uplaoded successfully
        console.log("file has been uplaoded successfully on cloudinary",uploadResult.url)
        return response
    } catch (error) {
        fs.unlink(localFilePath)    //remove local temp file since it is corrupted and uplaod is failed
        return null
    }
}


export {uplaodOnCloudinary}

