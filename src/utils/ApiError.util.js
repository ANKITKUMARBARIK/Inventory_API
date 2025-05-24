class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        data = null,
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.status = false;
        this.message = message;
        this.errors = errors;
        this.data = data;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
