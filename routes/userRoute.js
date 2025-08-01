const express = require("express")
const router = express.Router ()
const {registerUser, loginUser, getProfile, updateProfile} = require("../controllers/UserController")



router.post(
    "/register",
    registerUser
)

router.post(
    "/login",
    loginUser
)
router.get('/profile', getProfile);

router.patch('/profile',updateProfile )

module.exports = router