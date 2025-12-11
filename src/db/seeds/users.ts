import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

async function main() {
    const hashedPassword = bcrypt.hashSync('1234', 10);
    
    const adminUser = [
        {
            email: 'admin@admin.com',
            password: hashedPassword,
            name: 'Administrador',
            role: 'admin',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(users).values(adminUser);
    
    console.log('✅ Admin user seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
