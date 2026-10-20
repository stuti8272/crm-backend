import express from "express";
import authRoutes from "./auth/auth.js";
import studentRoutes from "./student/studentInfo.js";

const router = express.Router();

router.use("/auth",authRoutes);
router.use("/student", studentRoutes);

 export default router;
