import { Router } from "express";
import { loginUser, logOutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields(
        [
            { name: 'avatar', maxCount: 1 },
            { name: 'coverImage', maxCount: 8 }
        ]
    ),
    registerUser)
//http://localhost:3000/api/v1/users/register

router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyJWT,logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

export default router