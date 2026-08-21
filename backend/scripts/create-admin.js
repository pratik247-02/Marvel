/**
 * Create a user, normally the first admin.
 *
 *   node scripts/create-admin.js --email you@example.com --password "..." --name "You"
 *   node scripts/create-admin.js --email someone@example.com --password "..." --role user
 *
 * There is no public registration endpoint, so the first admin has to come
 * from somewhere outside the API. A CLI is the right place: it requires
 * database access, which is a reasonable proxy for "is allowed to create an
 * admin", and it leaves no HTTP surface to attack.
 *
 * The password is passed as an argument rather than prompted, which means it
 * lands in shell history. That is an accepted tradeoff for a bootstrap script
 * run once; rotate the password afterwards if the machine is shared.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { authService } from "../src/modules/auth/auth.service.js";
import { passwordSchema } from "../src/validators/index.js";

dotenv.config();

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
};

const email = flag("email");
const password = flag("password");
const name = flag("name");
const role = flag("role") ?? "admin";

const MONGO_URI =
  flag("uri") || process.env.MONGO_URI || "mongodb://localhost:27017/marvel";

const safeUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

async function main() {
  if (!email || !password) {
    console.error(
      "\nUsage: node scripts/create-admin.js --email <email> --password <password> [--name <name>] [--role admin|user]\n"
    );
    process.exit(1);
  }

  if (!["admin", "user"].includes(role)) {
    console.error(`\nInvalid role "${role}". Use "admin" or "user".\n`);
    process.exit(1);
  }

  // Enforce the same complexity policy the API would, so a weak bootstrap
  // password cannot slip in through the side door.
  const check = passwordSchema.safeParse(password);
  if (!check.success) {
    console.error("\nPassword does not meet requirements:");
    for (const issue of check.error.issues) {
      console.error(`  - ${issue.message}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(`\nConnecting to ${safeUri(MONGO_URI)}`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected. Database: ${mongoose.connection.name}`);

  const user = await authService.createUser({ email, password, name, role });

  console.log("\nUser created:");
  console.log(`  id    ${user.id}`);
  console.log(`  email ${user.email}`);
  console.log(`  role  ${user.role}`);
  console.log("");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`\nFailed: ${err.message}\n`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
