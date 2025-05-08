import type { ParserOptions } from "./options";
import type { Schema } from "./schema";
import { readFileSync } from "node:fs";

import { schemaDef } from "@schemasset/schema";
import { load } from "js-yaml";
import { SchemaError } from "./error";
import { findSchemaFile } from "./finder";

export function parse(options?: ParserOptions): Schema {
  const schemaPath = options?.schemaFile ?? findSchemaFile();
  if (!schemaPath) {
    throw new SchemaError("Schema file not found in current directory", {
      code: "FILE_NOT_FOUND",
    });
  }

  let content: string;
  try {
    content = readFileSync(schemaPath, "utf-8");
  }
  catch (e) {
    throw new SchemaError(
      `Failed to read schema file: ${e instanceof Error ? e.message : String(e)}`,
      { code: "FILE_NOT_FOUND", cause: e },
    );
  }

  const filetype = schemaPath.endsWith(".json") ? "json" : "yaml";
  let parsedContent;
  try {
    parsedContent = filetype === "json" ? JSON.parse(content) : load(content);
  }
  catch (e) {
    throw new SchemaError(
      `Failed to parse ${filetype} content: ${e instanceof Error ? e.message : String(e)}`,
      { code: "PARSE_ERROR", cause: e },
    );
  }

  if (typeof parsedContent === "object" && parsedContent && !("version" in parsedContent)) {
    parsedContent = { version: "1.0.0", ...parsedContent };
  }

  const validationResult = schemaDef.safeParse(parsedContent);
  if (!validationResult.success) {
    throw new SchemaError(
      `Invalid schema: ${validationResult.error.message}`,
      { code: "VALIDATION_ERROR", cause: validationResult.error },
    );
  }

  return {
    filename: schemaPath,
    filetype,
    schema: validationResult.data,
  };
}
