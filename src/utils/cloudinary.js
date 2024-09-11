import { v2 as cloudinary } from 'cloudinary';
// import { response } from 'express';
import fs from "fs"
// import { ApiError } from './ApiError.js';

// import dotenv from 'dotenv/config.js';      //this code only works when this line is uncommented.(ps: fixed after adding this line in index file instead of "import dotenv from 'dotenv'")

//cloudinary configuration

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

// console.log(process.env.CLOUDINARY_API_KEY);

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
        fs.unlinkSync(localFilePath) 
        
        // console.log(uploadResult);
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath)    //remove local temp file since it is corrupted and uplaod is failed
        return null

        //for debugging used the following turned out to be api call error api key not given actually there were no " " in .env file apikey.
        // console.log("cloudinary error:\n",error);
        // throw new ApiError(500, "Failed to upload file to cloudinary");
    }
}

const deleteFileFromCloudinary = async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      console.log('File deleted:', result)
      return result
    } catch (error) {
      console.error('Error while deleting file on cloudinary:', error);
      return error
    }
  };

export {uplaodOnCloudinary,deleteFileFromCloudinary}

