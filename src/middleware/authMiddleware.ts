
import jwt from "jsonwebtoken";
import AuthModel from "../model/Auth/auth.js";

export const verifyAuthToken = async (req, res, next) => {
  try {
    const accessToken = req.headers.accesstoken || req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!accessToken) {
      return res.status(401).json({
        auth: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify( accessToken, process.env.SECRET_KEY );

    const allowedRoles = [ "superAdmin", "admin", "teacher", "student", "parent" ];

    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({
        auth: false,
        message: "Invalid user role",
      });
    }

    const user = await AuthModel.findOne({ accessToken, role: decoded.role, isDeleted: false}).lean();

    if (!user) {
      return res.status(401).json({
        auth: false,
        message: "Invalid token or user has been logged out",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        auth: false,
        message: "Your account is blocked by Admin",
      });
    }

    req.tokenData = decoded;
    req.userData = user;
    req.role = decoded.role;

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" || error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return res.status(401).json({
        auth: false,
        message:
        error.name === "TokenExpiredError" ? "Token has expired": "Invalid token",
      });
    }

    console.error(error);

    return res.status(500).json({
      auth: false,
      message: "Internal server error",
    });
  }
};




export const requireSuperAdmin = (req, res, next) => {
  if (req.role !== "superAdmin") {
    return res.status(403).json({ auth: false, message: "Super-admin access required" });
  }
  return next();
};