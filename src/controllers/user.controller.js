import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { deleteFileFromCloudinary, uplaodOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async function(userId){
   try {
      const user = await User.findById(userId)

      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave:false })
      
      return {accessToken,refreshToken}

   } catch (error) {
      throw new ApiError(500,"Something went wrong while generating refresh and access tokens")
   }
}

const registerUser = asyncHandler( async (req,res) => {
   //   res.status(200).json({
   //      Message : "ok"
   //   })
   //get user details from frontend (from postman)
   //validate the non emptiness of details
   //check if user exists using email or username
   //check for images 
   //upload them to cloudinary
   //check if cloudinary upload successful
   //create user object - entry in db
   //remove password and refresh token from the response from db
   //check for user created or not
   //return res



   const {fullName, email, username, password} = req.body      //got details and images
   // console.log("email: ",email);
   // console.log(req.body);
   console.log(req.files);
   // console.log("password: ",password);

   // if(fullName===""){
   // throw(new ApiError('Full Name is required'))
   // }

   if (
      [fullName,email,username,password].some((field) => field?.trim() ==="")
   ) {
      throw new ApiError(400,"all fields are required")
   }

   const existedUser = await User.findOne({
      $or: [{username},{email}]        //db or operation
   })

   if (existedUser) {
      throw new ApiError(409,"user with email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path

   console.log(coverImageLocalPath);
   
   if (!avatarLocalPath) {
      throw new ApiError(400,"avatar is required")
   }

   const avatar = await uplaodOnCloudinary(avatarLocalPath)

   // let coverImage;
   // if (coverImageLocalPath) {
   //    coverImage = await uplaodOnCloudinary(coverImageLocalPath)
   // }

   const coverImage = coverImageLocalPath ? await uplaodOnCloudinary(coverImageLocalPath) : null;
   

   if(!avatar){
      throw new ApiError(400,"avatar upload failed.")
   }

   //create database entry for user details and images
   const user = await User.create({
      fullName,
      avatar:avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username:username.toLowerCase()
   })

   //check if user created and remove password and refreshToken from User.findById() API call
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )              //somewhat weird syntax

   // console.log(createdUser);
   
   if (!createdUser) {
      throw new ApiError(500,"Something went wrong while registering the user.")
   }

   return res.status(201).json(
      new ApiResponse(200,createdUser,"user registered successfully")
   )

})

const loginUser = asyncHandler(async (req,res) =>{
   //steps
   //get username or email and password from frontend req.body
   //check if the username exists in database
   //check if password matches 
   //if matches generate accessToken and refreshtoken 
   //and send it as response as secure cookies

   const {username,email,password} = req.body

   if(!username && !email){
      throw new ApiError(400,"username or email is required")
   }

   const user = await User.findOne({
      $or:[{username},{email}]
   })

   if(!user){
      throw new ApiError(404,"User does not exist ")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
      throw new ApiError(401,"Invalid user credentials") 
   }

   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).
   select("-password -refreshToken")

   console.log(loggedInUser);
   

   const options ={
      httpOnly:true,
      secure: true
   }
   
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(
         200,
         {  
            user:loggedInUser,
            accessToken,
            refreshToken
         },
         "User logged in successfully"
      )
   )

})

const logOutUser = asyncHandler(async (req,res)=>{
   //find the user if logged in 
   // clear the cookies and access token from client 
   // clear refresh on server end 
   // NOTE: here directly we didn't have access to the token,so we inject an user object to the req body by auth middleware so that req.user is accessible and inside it we have the user details and that details are filled and pre verified by jwt and we have the accessToken 

   
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken : undefined
         }
      },
      {
         new: true 
      }
   )

   const options ={
      httpOnly:true,
      secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged out"))
})

const refreshAccessToken = asyncHandler(async (req,res,next)=>{
   const incomingRefreshToken=req.cookies?.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
      throw new ApiError(401,"Unauthorized access")
   }

   try {
      const incomingDecodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   
      const user = await User.findById(incomingDecodedToken?._id)
      if(!user){
         throw new ApiError(401,"Invalid refreshToken")
      }
   
      if (incomingDecodedToken !== user?.refreshToken) {
         throw new ApiError(401,"refreshToken is expired or used")      
      }
   
      const options ={
         httpOnly:true,
         secure: true
      }
   
      const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
   
      return res
      .status(200)
      .cookies("accessToken",accessToken,options)
      .cookies("refreshToken",refreshToken,options)
      .json(
         new ApiResponse(
            200,
            {
               accessToken,
               newRefreshToken:refreshToken
            },
            "accessToken refreshed"
         )
      )
   } catch (error) {
      throw new ApiError(401,error?.message || "Invalid refresh token or it could not be decoded")      
   }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user?._id)  //REVIEW: check if id or _id.ps: Yeah it is _id
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
      throw new ApiError(400,"Invalid old password")
   }

   user.password = newPassword
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(new ApiResponse(200,{}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=>{
   res
   .status(200)
   .json(new ApiResponse(200, req.user , "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
   const {fullName, email} = req.body

   if(!fullName && !email){
      throw new ApiError(400,"All fields are required")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            fullName,
            email: email
         }
      },
      {
         new:true
      }
   ).select("-password -refreshToken")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "Account details updated successfully"))

})

//Handle both profile image and cover images update
/*// const updateProfileImages = asyncHandler(async(req,res)=>{
//    const avatarLocalPath = req.files?.avatar[0]?.path
//    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

//    if (!avatarLocalPath) {
//       throw new ApiError(400,"avatar is required")
//    }

//    const avatar = await uplaodOnCloudinary(avatarLocalPath)

//    let coverImage;
//    if (coverImageLocalPath) {
//       coverImage = await uplaodOnCloudinary(coverImageLocalPath)
//    }

//    const user = await User.findByIdAndUpdate(
//       req.user?._id,
//       {
//          $set:{
//             avatar: avatar.url,
//             coverImage: coverImage?.url || ""
//          }
//       },
//       {
//          new:true
//       }
//    ).select("-password -refreshToken")

//    return res
//    .status(200)
//    .json(new ApiResponse(200,user,"Profile images updated successfully"))
// })
*/

const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.files?.path

   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar is required")
   }

   // TODO: delete old image from cloudinary

   const userOldAvatarUrl = await User.findById(req.user?._id)?.avatar

   // Extract public ID from the current avatar URL
   // const currentAvatarUrl = user?.avatar;
   let publicId      //store the public id to use in future while deleting from cloudinary
   if (userOldAvatarUrl) {
      //in the url of cloudinary the last part is cloudinary.com/..../image.jpg
      //here 'image' is the public id 
      publicId = userOldAvatarUrl.split('/').pop().split('.')[0];
   }

   const avatar = await uplaodOnCloudinary(avatarLocalPath)
   if(!avatar.url){
      throw new ApiError(400,"Avatar upload failed")
   }
   
   const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar: avatar.url
         }
      },
      {
         new:true
      }
   ).select("-password -refreshToken")

   // Delete the old avatar from cloudinary
   // Check if the avatar was successfully updated in the database
   if(updatedUser && updatedUser.avatar === avatar.url){
      if (publicId) {
         await deleteFileFromCloudinary(publicId);  // Delete the old image
      }
   }else {
      throw new ApiError(500, "Avatar update failed in database");
   }
   
   return res
   .status(200)
   .json(new ApiResponse(200,updatedUser,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
   const coverLocalPath = req.files?.path

   if(!coverLocalPath){
      throw new ApiError(400,"Cover image is required")
   }

   // TODO: delete old image from cloudinary

   const userOldCoverUrl = await User.findById(req.user?._id)?.coverImage

   // Extract public ID from the current avatar URL
   // const currentAvatarUrl = user?.avatar;
   let publicId      //store the public id to use in future while deleting from cloudinary
   if (userOldCoverUrl) {
      publicId = userOldCoverUrl.split('/').pop().split('.')[0];
   }

   const coverImage = await uplaodOnCloudinary(avatarLocalPath)
   if(!coverImage.url){
      throw new ApiError(400,"Cover image upload failed")
   }
   
   const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage: coverImage.url
         }
      },
      {
         new:true
      }
   ).select("-password -refreshToken")

   // Delete the old coverImage from cloudinary
   // Check if the cover was successfully updated in the database
   if(updatedUser && updatedUser.coverImage === coverImage.url){
      if (publicId) {
         await deleteFileFromCloudinary(publicId);  // Delete the old image
      }
   }else {
      throw new ApiError(500, "Avatar update failed in database");
   }

   return res
   .status(200)
   .json(new ApiResponse(200,updatedUser,"Cover image updated successfully"))
})

export {registerUser,loginUser,logOutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}