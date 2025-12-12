import { importCards } from "./importCards";
import { seedRoles } from "./seedRoles";

console.log("Seeding roles...");
seedRoles().catch(console.error);

console.log("Seeding cards...");
importCards().catch(console.error);