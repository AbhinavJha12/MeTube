import dotenv from "dotenv"
import { connectDB } from "../db/database.js";
import {app} from "./app.js"

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`server working at ${process.env.PORT}`)
    })
})
.catch()