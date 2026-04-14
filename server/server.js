import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import workspaceRouter from "./routes/workspaceRoutes.js";
import { protect } from "./middlewares/authmiddleware.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";


const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || "https://project-management-main-self-front.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy does not allow access from origin ${origin}`));
  },
  credentials: true
}));

app.use(express.json())
app.use(clerkMiddleware())

app.get("/",(req,res)=>{
    res.send("server is live");
})

//Routes
app.use("/api/workspaces", protect, workspaceRouter)
app.use("/api/projects",protect, projectRouter)
app.use("/api/tasks",protect, taskRouter)
app.use("/api/comments",protect, commentRouter)

const PORT = process.env.PORT || 5000

app.listen(PORT,()=>{
    console.log(`Server is Running on ${PORT}`);
})