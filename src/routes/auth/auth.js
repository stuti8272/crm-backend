import { Router } from "express";
import { forgotPassword, login, logout, register, resetPassword, verifyOtp,} from "../../controller/auth.js";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import {
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateOtp,
} from "../../validation/auth.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/verify-otp", validateOtp, verifyOtp);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/logout", verifyAuthToken, logout);

export default router;

