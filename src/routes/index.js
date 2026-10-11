import { Router } from "express";
import authRoutes from "./auth/auth.js"

const router = Router();

router.use("/auth",authRoutes)

 export default router;