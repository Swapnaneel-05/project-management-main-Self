import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/node"
import workspaceRouter from "./routes/workspaceRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import { inngest, functions } from "./inngest/index.js";


const app = express();

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
//   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   if (req.method === "OPTIONS") {
  //     return res.sendStatus(200);
  //   }
  
  //   next();
  // });
  
app.use("/api/inngest", serve({ client: inngest, functions}));

const allowedOrigins = [
  "https://project-management-main-self-3.onrender.com",
  "http://127.0.0.1:5173"
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
app.post("/api/webhooks/clerk", async (req, res) => {
  try {
    const event = req.body;

    await inngest.send({
      name: `clerk/${event.type}`,
      data: event.data,
    });

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});
app.use(clerkMiddleware())

app.get("/",(req,res)=>{
  res.send("server is live");
})

//Routes
app.use("/api/workspaces",protect, workspaceRouter)
app.use("/api/projects",protect, projectRouter)
app.use("/api/tasks",protect, taskRouter)
app.use("/api/comments",protect, commentRouter)

const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server is Running on ${PORT}`);
  });

export default app;