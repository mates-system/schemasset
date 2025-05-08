import type { SchemaDef } from "@schemasset/schema";

export interface Schema {
  filename: string;
  filetype: "json" | "yaml";
  schema: SchemaDef | SchemaDef[];
}
