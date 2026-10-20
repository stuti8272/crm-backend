import express from "express";
import { createStudent } from "../../controller/students/studentInfoController.js";
import { verifyAuthToken, requireAdmin } from "../../middleware/authMiddleware.js";
import { validateCreateStudent } from "../../validation/student.js";

const router = express.Router();

router.post("/create", verifyAuthToken, requireAdmin, validateCreateStudent, createStudent);

export default router;
