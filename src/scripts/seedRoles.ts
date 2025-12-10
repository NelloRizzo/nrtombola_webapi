// src/scripts/seedRoles.ts
import { AppDataSource } from '../config/database';
import { Role } from '../entities/Role';

export async function seedRoles() {
    await AppDataSource.initialize();
    
    const roleRepository = AppDataSource.getRepository(Role);
    
    const defaultRoles = [
        { name: 'admin', isDefault: false },
        { name: 'caller', isDefault: true },
        { name: 'player', isDefault: true }
    ];
    
    for (const roleData of defaultRoles) {
        const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
        if (!existingRole) {
            const role = roleRepository.create(roleData);
            await roleRepository.save(role);
        }
    }
    
    process.exit(0);
}

