class ApiResponse {
    constructor(statusCode, data = null, message = "success") {
        this.statusCode = statusCode;
        this.status = statusCode < 400;
        this.data = data;
        this.message = message;
    }
}

export default ApiResponse;
