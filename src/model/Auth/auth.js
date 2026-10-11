import mongoose from "mongoose";

const authSchema = new mongoose.Schema({
  full_Name: { type: String, default: null },
  profileImage: { type: String, default: "" },
  email: { type: String, default: null },
  password: { type: String, default: null },
  countryCode: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  workPlace: { type: String, enum: ["college", "school", "coaching"], default: null },
  address: { type: String, default: null },
  moduleAccess: [],
  otpHash: { type: String, default: null, select: false },
  otpExpiresAt: { type: Date, default: null, select: false },
  otpVerifiedAt: { type: Date, default: null, select: false },
  role: { type: String, enum: ["superAdmin", "admin", "teacher", "student", "parent"], default: null },
  deviceToken: { type: String, default: null },
  accessToken: { type: String, default: null },
  isDeleted: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  lastLogin: { type: Number, default: () => Date.now() },
}, {
  strict: true,
  collection: "Auth",
  versionKey: false,
  timestamps: true,
});

const AuthModel = mongoose.model("Auth", authSchema);
export default AuthModel;

