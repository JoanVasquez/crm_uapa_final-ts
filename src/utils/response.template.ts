/**
 * 📦 ResponseTemplate
 * A standardized response template for API responses.
 */
export default class ResponseTemplate {
  private readonly _timeStamp: string;
  private readonly _statusCode: number;
  private readonly _status: string;
  private readonly _message: string | undefined;
  private readonly _data?: unknown;

  /**
   * 🎯 Constructor for ResponseTemplate
   * @param statusCode - HTTP status code (e.g., 200, 400, 500)
   * @param status - Status description (e.g., "OK", "BAD_REQUEST")
   * @param message - A message describing the response
   * @param data - Optional data payload
   */
  constructor(
    statusCode: number,
    status: string,
    message: string | undefined,
    data?: unknown,
  ) {
    this._timeStamp = new Date().toISOString(); // ⏳ ISO format for better consistency
    this._statusCode = statusCode;
    this._status = status;
    this._message = message;
    this._data = data;
  }

  /** 🔢 Returns the HTTP status code */
  get statusCode(): number {
    return this._statusCode;
  }

  /** 📜 Returns the response status */
  get status(): string {
    return this._status;
  }

  /** ✉️ Returns the response message */
  get message(): string | undefined {
    return this._message;
  }

  /** 📦 Returns the response data (if any) */
  get data(): unknown {
    return this._data;
  }

  /** ⏳ Returns the response timestamp */
  get timeStamp(): string {
    return this._timeStamp;
  }
}
