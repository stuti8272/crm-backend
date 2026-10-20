import HttpStatus from "http-status-codes";
import { sendErrorResponse, sendSuccessResponse } from "../../utilis/response.js";
import { StudentInfoService } from "../../services/student/studentInfo.js";

export const createStudent = async (req, res) => {
  try {
    const result = await StudentInfoService.createStudent(req.body);
    return sendSuccessResponse(res, "Student created successfully", result, HttpStatus.CREATED);
  } catch (error) {
    if (error.statusCode === HttpStatus.CONFLICT || error.code === 11000) {
      return sendErrorResponse(res, error.message || "Email or phone number already exists", HttpStatus.CONFLICT);
    }
    console.error("Student creation error:", error);
    return sendErrorResponse(res, "Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
  }
};
