import {Router} from "express"
import { registerUser } from "../controllers/user.js"
import {upload} from "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/authorise.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )
router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)

export default router
