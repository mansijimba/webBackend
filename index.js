const express = require ("express")
const cors = require("cors")
const connectDB = require ("./config/db")

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT
const userRoute = require('./routes/userRoute')
app.use('/api/auth', userRoute);
app.listen(
    5050, //port -> localhost:5050
    () => {
        console.log("Server started")
    }
)
