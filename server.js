require ('dotenv').config()
const app = require("./index")
const PORT = process.env.PORT
app.listen(
    5050, //port -> localhost:5050
    () => {
        console.log("Server started")
    }
)