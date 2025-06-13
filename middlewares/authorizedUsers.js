const jwt = require("jsonwebtoken")
const User = require("../models/User")

exports.authenticateUser = async(req, res, next) => {
    try{
        const authHeader = req.headers.authorization // from request header
        if(!authHeader){
            return res.status(403).json(
                {"success": false, "message":"Token required"}
            )
        }
        const token = authHeader.split(" ") [1]; // "Bearer <token>"
        const decoded =jwt.verify(token, process.env.SECRET) //verufy with same secret
        const UserId = decoded._id
        const user = await User.findOne({_id:UserId})
        if(!user){
            return res.status(401).json(
                {"success":false, "message":"User not found"}
            )
        }
        req.user = user // create new object fo rnext function to use 
        next() // continue to next function
    }catch(err){
        console.log(err)
        return res.status(500).json(
            {"success":false, "message": "Authentication error"}
        )
    }
}
