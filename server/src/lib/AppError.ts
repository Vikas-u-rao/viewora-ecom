export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: object[];

  constructor(code: string, statusCode: number, message: string, details: object[] = []) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
