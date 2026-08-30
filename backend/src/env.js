import dotenv from "dotenv";

// This module's ONLY job is to run dotenv.config() as its own top-level
// side effect. Importing THIS file first (see server.js) guarantees the
// env vars are populated before any other module evaluates, sidestepping
// the ESM import-hoisting issue where `import X; doSomething(); import Y;`
// still evaluates Y before doSomething() runs.
dotenv.config();
