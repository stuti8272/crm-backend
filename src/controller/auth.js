import jwt from "jsonwebtoken";
import { AuthClass } from "../services/Auth/auth.js";
import AuthModel from "../model/Auth/auth.js";
import { sendErrorResponse, sendSuccessResponse } from "../utilis/response.js";
import HttpStatus from "http-status-codes";

const allowedRoles = ["superAdmin", "admin", "teacher", "student", "parent"];

export const register = async (req, res) => {
  try {
    const { fullName, email, password, countryCode, phoneNumber } = req.body;
    const normalizedEmail = email.toLowerCase();
    const normalizedPhone = phoneNumber;

    if (await AuthModel.exists({ email: normalizedEmail, isDeleted: false })) {
      return sendErrorResponse(res, "Email already exists", HttpStatus.CONFLICT);
    }
    if (await AuthModel.exists({ phoneNumber: normalizedPhone, isDeleted: false })) {
      return sendErrorResponse(res, "Phone number already exists", HttpStatus.CONFLICT);
    }

    const hashedPassword = await AuthClass.hashSecret(password);
    const user = await AuthClass.create({
      fullName, email: normalizedEmail, password: hashedPassword,
      countryCode, phoneNumber: normalizedPhone, role: "student",
    });
    return sendSuccessResponse(res, "Registration successful", user, HttpStatus.CREATED);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern ?? {})[0];
      return sendErrorResponse(
        res,
        field === "phoneNumber" ? "Phone number already exists" : "Email already exists",
        HttpStatus.CONFLICT,
      );
    }
    console.error("Registration error:", error);
    return sendErrorResponse(res, "Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

export const login = async (req, res) => {
  try {
    const { email, phoneNumber, countryCode, password } = req.body;
    const user = await AuthClass.findForLogin({ email, phoneNumber, countryCode });
    if (!user || !(await AuthClass.verifySecret(password, user.password))) {
      return sendErrorResponse(res, "Invalid email/phone number or password", HttpStatus.UNAUTHORIZED);
    }
    if (user.isBlocked) {
      return sendErrorResponse(res, "Your account is blocked by Admin", HttpStatus.FORBIDDEN);
    }
    if (!allowedRoles.includes(user.role)) {
      return sendErrorResponse(res, "Invalid user role", HttpStatus.FORBIDDEN);
    }
    if (!process.env.SECRET_KEY) {
      return sendErrorResponse(res, "Authentication is not configured", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const accessToken = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "1d" },
    );
    await AuthClass.updateAccessToken(user._id, accessToken);
    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.accessToken;
    return sendSuccessResponse(res, "Login successful", { user: safeUser, accessToken });
  } catch (error) {
    console.error("Login error:", error);
    return sendErrorResponse(res, "Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await AuthClass.findByPhone(req.body.phoneNumber);
    if (!user) {
      return sendErrorResponse(res, "Phone number not found", HttpStatus.NOT_FOUND);
    }
    if (!process.env.SECRET_KEY) {
      return sendErrorResponse(res, "Authentication is not configured", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const otp = AuthClass.createOtp();
    await AuthClass.storeResetOtp(user._id, await AuthClass.hashSecret(otp));

    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        otp,
        tokenType: "password_reset",
      },
      process.env.SECRET_KEY,
      { expiresIn: "10m" },
    );

    return sendSuccessResponse(res, "Password reset OTP generated", { accessToken });
  } catch (error) {
    console.error("Forgot password error:", error);
    return sendErrorResponse(res, "Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    if (!process.env.SECRET_KEY) {
      return sendErrorResponse(res, "Authentication is not configured", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const resetToken = req.headers.accesstoken || req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const { otp } = req.body;
    if (!resetToken) {
      return sendErrorResponse(res, "Access token is required", HttpStatus.BAD_REQUEST);
    }
    const decoded = jwt.verify(resetToken, process.env.SECRET_KEY);
    if (decoded.tokenType !== "password_reset" || decoded.otp !== otp) {
      return sendErrorResponse(res, "Invalid reset token or OTP", HttpStatus.UNAUTHORIZED);
    }

    const isValid = await AuthClass.verifyResetOtp(decoded.id, decoded.role, otp);
    if (!isValid) {
      return sendErrorResponse(res, "Invalid or expired OTP", HttpStatus.UNAUTHORIZED);
    }

    const accessToken = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
        otp,
        tokenType: "password_reset_verified",
      },
      process.env.SECRET_KEY,
      { expiresIn: "10m" },
    );

    return sendSuccessResponse(res, "OTP verified successfully", {
      id: decoded.id,
      role: decoded.role,
      accessToken,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return sendErrorResponse(res, "Invalid or expired reset token", HttpStatus.UNAUTHORIZED);
    }
    console.error("OTP verification error:", error);
    return sendErrorResponse(res, "Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
  }
};
export const resetPassword = async (req, res) => {
  try {
    if (!process.env.SECRET_KEY) {
      return sendErrorResponse(res, "Authentication is not configured", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const accessToken = req.headers.accesstoken || req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!accessToken) {
      return sendErrorResponse(res, "Access token is required", HttpStatus.BAD_REQUEST);
    }

    const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
    if (decoded.tokenType !== "password_reset_verified" || !decoded.id || !decoded.role || !decoded.otp) {
      return sendErrorResponse(res, "Invalid reset token", HttpStatus.UNAUTHORIZED);
    }

    const passwordHash = await AuthClass.hashSecret(req.body.newPassword);
    const didReset = await AuthClass.completePasswordReset(
      decoded.id,
      decoded.role,
      decoded.otp,
      passwordHash,
    );
    if (!didReset) {
      return sendErrorResponse(res, "OTP must be verified and not expired", HttpStatus.BAD_REQUEST);
    }
    return sendSuccessResponse(res, "Password reset successful", {});
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return sendErrorResponse(res, "Invalid or expired reset token", HttpStatus.UNAUTHORIZED);
    }
    console.error("Reset password error:", error);
    return sendErrorResponse(res, "Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

export const logout = async (req, res) => {
  try {
    await AuthClass.clearAccessToken(req.userData._id);
    return sendSuccessResponse(res, "Logout successful", {});
  } catch (error) {
    console.error("Logout error:", error);
    return sendErrorResponse(res, "Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
  }
};








