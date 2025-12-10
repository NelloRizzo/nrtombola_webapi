import { seedRoles } from "./seedRoles";

console.log("Seeding roles...");
seedRoles().catch(console.error);