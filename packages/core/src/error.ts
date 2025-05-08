export type SchemaErrorCode = "FILE_NOT_FOUND" | "PARSE_ERROR" | "VALIDATION_ERROR";

export interface SchemaErrorInit {
  code: SchemaErrorCode;
  cause?: unknown;
}

export class SchemaError extends Error {
  readonly code: SchemaErrorCode;
  readonly cause?: unknown;

  constructor(message: string, init: SchemaErrorInit) {
    super(message);
    this.name = "SchemaError";
    this.code = init.code;
    this.cause = init.cause;
  }
}
