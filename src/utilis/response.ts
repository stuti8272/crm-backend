import HttpStatus from 'http-status-codes';
export const sendSuccessResponse = (res, messageType, data, statusCode = HttpStatus.OK) => {
    const message = messageType;
    res.status(statusCode).json({
        success: true,
        message: message,
        data,
    });
};

export const sendErrorResponse = (res, messageType, statusCode = HttpStatus.UNAUTHORIZED, data = [],) => {
    const message = messageType
    res.status(statusCode).json({
        success: false,
        message: message,
        data
    });
};
