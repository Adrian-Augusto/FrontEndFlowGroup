import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

if (existsSync(envPath)) {
  console.log("✓ .env já existe em:", envPath);
  console.log("  Edite VITE_GOOGLE_CLIENT_ID e GOOGLE_CLIENT_ID com o mesmo Client ID do Google.");
} else {
  copyFileSync(examplePath, envPath);
  console.log("✓ Criado:", envPath);
  console.log("  Abra o arquivo e preencha VITE_GOOGLE_CLIENT_ID e GOOGLE_CLIENT_ID.");
}

console.log("\nDepois: pare o Vite (Ctrl+C) e rode novamente: npm run dev");
