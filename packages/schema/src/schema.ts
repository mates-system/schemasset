import { z } from "zod";

export type SchemaDef = z.infer<typeof schemaDef>;

export type SchemaDefFile = z.infer<typeof schemaDefFile>;

const SCHEMA_VERSION = "1.0.0" as const;

z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: `Expected ${issue.expected}, received ${issue.received}` };
    default:
      return { message: ctx.defaultError };
  }
});

export const schemaDefFile: z.ZodObject<{
  pattern: z.ZodString;
  required: z.ZodDefault<z.ZodBoolean>;
}> = z.object({
  /** target files as glob pattern */
  pattern: z.string().min(1, "Pattern must not be empty"),
  /** @default false */
  required: z.boolean().default(false),
}).strict();

export const schemaDef: z.ZodObject<{
  version: z.ZodLiteral<typeof SCHEMA_VERSION>;
  targetDir: z.ZodString;
  files: z.ZodArray<typeof schemaDefFile>;
}> = z.object({
  version: z.literal(SCHEMA_VERSION),
  targetDir: z.string().min(1, "Target directory must not be empty"),
  files: z.array(schemaDefFile).min(1, "At least one file pattern must be specified"),
}).strict();
