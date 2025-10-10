const { PrismaClient } = require('@prisma/client');

async function findUser() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@cosigein.com' }
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('User details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUser(); 