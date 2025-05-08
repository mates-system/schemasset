import { z } from 'zod';

export const schemaDefFile: z.ZodObject<{
  pattern: z.ZodString;
  required: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny> = z.object({
  /**
   * target files as glob pattern
   */
  pattern: z.string(),
  /**
   * @default: false
   */
  required: z.boolean().default(false).optional(),
}).catchall(z.unknown());

export const schemaDef: z.ZodObject<{
  targetDir: z.ZodString;
  files: z.ZodArray<typeof schemaDefFile>;
}, "strip", z.ZodTypeAny> = z.object({
  targetDir: z.string(),
  files: z.array(schemaDefFile),
}).catchall(z.unknown());

export type SchemaDef = z.infer<typeof schemaDef>;
export type SchemaDefFile = z.infer<typeof schemaDefFile>;
