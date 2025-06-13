const User = require ("../models/User")
const bcrypt = require ("bcrypt")
const jwt = require ("jsonwebtoken")
const { get } = require("mongoose")

exports.registerUser = async (req, res) => {
    const {username, fullName, number, email, password, role} = req.body
    //validation
    if (!username || !email || !password || !role){
         return res.status(400).json(
            {"success":false, "message": "Missing fields"}
         )
    }
    //db logic try/catch
    try{
        const exitingUser = await User.findOne(
            {
                $or: [{"username": username},
                    {"email": email}
                ],
            }
        )
        if(exitingUser){
           return res.status(400).json(
                {
                    "success": false,
                    "message": "User exists"
                }
            )
        }
        //hash password
        const hashedPas = await bcrypt.hash(
            password, 10
        )// 10 is complexity
        const newUser = new User ({
            username,
            fullName,
            number,
            email,
            password: hashedPas,
            role
        })
        await newUser.save()
        return res.status(201).json(
            {
                "success": true,
                "message": "User Registered"
            }
        )
   } catch (err) {
    return res.status(500).json(
        {"success": false, "message": "Server error"}
    )
   }
}

exports.loginUser = async (req, res) => {
    const {email, password} = req.body
    //validation
    if (!email || !password){
        return res.status(400).json(
            {"success": false, "message": "Missing Field"}
        )
    }
    try{
        const getUser = await User.findOne(
            {email:email}
        )
        if(!getUser){
            return res.status(403).json(
                {"success":false, "message":"User not found"}
            )
        }
        const passwordCheck = await bcrypt.compare(password, getUser.password)//pass, hashed paasword
        if (!passwordCheck){
            return res.status(403).json(
                {"success":false, "message":"Invalid credentials"}
            )
        }
        //
        const payload ={
            "_id": getUser._id,
            "email":getUser.email,
            "username":getUser.username
        }
        const token =jwt.sign(payload, process.env.SECRET,
            {expiresIn:"7d"}
        )
        return res.status(200).json(
            {"success":true, "message":"Login Successful","data": getUser,
                "token": token // return token in login
            }
        )
    }catch(err){
        return res.status(500).json(
            {"success":false, "message":"Server error"}
        )
    }
}