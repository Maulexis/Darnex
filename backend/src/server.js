import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mapRoutes from "./routes/map.js"; // or whatever your routes file is

const app = express();
app.use(cors()); // ✅ Allow all frontend requests

dotenv.config();


// ✅ Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:3000",  // allow your React app
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Parse JSON
app.use(express.json());

// Routes
app.use("/api", mapRoutes);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
