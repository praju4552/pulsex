import { ingestProjectTemplate } from '../src/services/ingestionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockData = {
    category: {
        name: "Robotics",
        slug: "robotics",
        description: "Build autonomous machines"
    },
    project: {
        title: "Bluetooth RC Car",
        slug: "rc-car",
        description: "Smartphone controlled car",
        isPublished: true,
        versions: [
            {
                name: "Arduino Version",
                difficulty: "Beginner",
                modules: [
                    {
                        title: "Chassis Assembly",
                        order: 1,
                        steps: [
                            {
                                title: "Mount Motors",
                                explanation: "Fix DC motors to chassis.",
                                whyItMatters: "Provides drive.",
                                order: 1
                            }
                        ]
                    }
                ],
                components: [
                    { name: "Arduino Uno", quantity: 1 }
                ],
                commonIssues: [],
                skills: [
                    { name: "Soldering", category: "Hardware", level: "Beginner" }
                ]
            }
        ]
    }
};

async function main() {
    console.log('Seeding...');
    // @ts-ignore
    await ingestProjectTemplate(mockData);
    console.log('Seeding complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
