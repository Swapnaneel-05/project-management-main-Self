import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import workspaceRouter from "./routes/workspaceRoutes.js";
import { protect } from "./middlewares/authmiddleware.js";


const app = express();

app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

app.get("/",(req,res)=>{
    res.send("server is live");
})

//Routes
app.use("/api/workspaces", protect, workspaceRouter)

const PORT = process.env.PORT || 5000

app.listen(PORT,()=>{
    console.log(`Server is Running on ${PORT}`);
})