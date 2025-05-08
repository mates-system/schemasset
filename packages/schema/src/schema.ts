import { z } from "zod";

export type SchemaDef = z.infer<typeof schemaDef>;

export type SchemaDefFile = z.infer<typeof schemaDefFile>;

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
  optional: z.ZodDefault<z.ZodBoolean>;
}> = z.object({
  /** target files as glob pattern */
  pattern: z.string().min(1, "Pattern must not be empty"),
  /** @default false */
  optional: z.boolean().default(false),
}).strict();

export const schemaDef: z.ZodObject<{
  targetDir: z.ZodString;
  files: z.ZodArray<typeof schemaDefFile>;
}> = z.object({
  '$schema': z.string().optional(),
  targetDir: z.string().min(1, "Target directory must not be empty"),
  files: z.array(schemaDefFile).min(1, "At least one file pattern must be specified"),
}).strict();
