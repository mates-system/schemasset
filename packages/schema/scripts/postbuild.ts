import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { schemaDef } from "@schemasset/schema";

import { zodToJsonSchema } from "zod-to-json-schema";

const __dirname = new URL(".", import.meta.url).pathname;
const out = resolve(__dirname, "../dist/schema.json");

const jsonSchema = zodToJsonSchema(schemaDef, "SchemaDef");
const jsonSchemaFile = JSON.stringify(jsonSchema, null, 2);
writeFileSync(out, jsonSchemaFile);
