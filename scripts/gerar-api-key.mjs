#!/usr/bin/env node
import crypto from "node:crypto";

const chave = crypto.randomBytes(32).toString("hex");
console.log(chave);
console.log("\nAdicione ao seu .env:");
console.log(`HTTP_API_KEY=${chave}`);
