import HttpStatus from "http-status-codes";
import AuthModel from "../../model/Auth/auth.js";
import StudentDetailsModel from "../../model/students/studentInfo.js";
import { AuthClass } from "../Auth/auth.js";

export class StudentInfoService {
  static async createStudent(input: Record<string, any>) {
    const email = input.email.trim().toLowerCase();
    const countryCode = input.countryCode.trim();
    const phoneNumber = input.phoneNumber.trim();

    const existingUser = await AuthModel.exists({
      isDeleted: false,
      $or: [{ email }, { countryCode, phoneNumber }],
    });
    if (existingUser) {
      const error = new Error("Email or phone number already exists") as Error & { statusCode?: number };
      error.statusCode = HttpStatus.CONFLICT;
      throw error;
    }

    const auth = await AuthModel.create({
      fullName: input.fullName.trim(),
      email,
      countryCode,
      phoneNumber,
      password: await AuthClass.hashSecret(input.password),
      role: "student",
    });

    try {
      const profile = await StudentDetailsModel.create({
        studentId: auth._id,
        fullName: input.fullName.trim(),
        profileImage: input.profileImage,
        gender: input.gender,
        parentsInfo: input.parentsInfo,
        address: input.address,
        schoolInfo: input.schoolInfo,
        coachingInfo: input.coachingInfo,
      });
      const safeAuth = auth.toObject();
      delete safeAuth.password;
      return { user: safeAuth, student: profile };
    } catch (error) {
      await AuthModel.deleteOne({ _id: auth._id });
      throw error;
    }
  }
}
