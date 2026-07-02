/**
 * ApiResponse — uniform success envelope for all API responses.
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }

  static ok(res, data, message = 'Success', meta = null) {
    return new ApiResponse(200, data, message, meta).send(res);
  }
  static created(res, data, message = 'Created') {
    return new ApiResponse(201, data, message).send(res);
  }
  static noContent(res) {
    return res.status(204).end();
  }
}

export default ApiResponse;
