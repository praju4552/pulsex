import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding 3D Printing projects...');

    let roboticsCategory = await prisma.category.findUnique({
        where: { slug: 'robotics' },
    });

    if (!roboticsCategory) {
        throw new Error('Robotics category must exist first (run seed_robotics.ts).');
    }

    // 3D PRINTING PROJECTS - BEGINNER
    await createProject(roboticsCategory.id, 'Custom Name Keychain', '3d-custom-name-keychain', 'Print with your name or favorite emoji.', 'Beginner', '3d-printing');
    await createProject(roboticsCategory.id, 'Spinning Top', '3d-spinning-top', 'Fun colorful top that spins for minutes.', 'Beginner', '3d-printing');
    await createProject(roboticsCategory.id, 'Simple Fidget Toy or Puzzle Piece', '3d-simple-fidget-toy', 'Basic cube or chain link (adult helps with design).', 'Beginner', '3d-printing');

    // 3D PRINTING PROJECTS - INTERMEDIATE
    await createProject(roboticsCategory.id, 'Articulated Dragon/Snake Toy', '3d-articulated-dragon', 'Flexible body that wiggles.', 'Intermediate', '3d-printing');
    await createProject(roboticsCategory.id, 'Custom Phone or Tablet Stand', '3d-custom-phone-stand', 'Adjustable for desk use.', 'Intermediate', '3d-printing');
    await createProject(roboticsCategory.id, '3D Puzzle (Cube or Animal)', '3d-puzzle-cube', 'Interlocking pieces that form a model.', 'Intermediate', '3d-printing');

    // 3D PRINTING PROJECTS - ADVANCED
    await createProject(roboticsCategory.id, 'Planetary Gear Set', '3d-planetary-gear-set', 'Turning handle makes all gears spin (great for learning mechanics).', 'Advanced', '3d-printing');
    await createProject(roboticsCategory.id, 'RC Car Chassis or Body Parts', '3d-rc-car-chassis', 'Custom frame/wheels for small motors.', 'Advanced', '3d-printing');
    await createProject(roboticsCategory.id, 'Mechanical Automaton', '3d-mechanical-automaton', 'Moving sculpture. (e.g., walking figure or clock mechanism).', 'Advanced', '3d-printing');
    await createProject(roboticsCategory.id, 'Custom Enclosure for Arduino/Raspberry Pi Project', '3d-custom-enclosure-arduino', 'Box with hinges, slots for wires, and lid.', 'Advanced', '3d-printing');

    console.log('Seeding 3D Printing complete.');
}

async function createProject(categoryId: string, title: string, slug: string, description: string, difficulty: 'Beginner' | 'Intermediate' | 'Advanced', subcategorySelector: string) {
    const createdProject = await prisma.project.create({
        data: {
            title,
            slug,
            description,
            categoryId,
            subcategory: subcategorySelector, // Custom field for grouping
            isPublished: true,
            versions: {
                create: [
                    {
                        name: 'Standard Print',
                        board: 'standard-fdm',
                        difficulty,
                        description: `FDM 3D printing template for ${title}.`,
                        estimatedTime: difficulty === 'Beginner' ? '1-2 Hours' : (difficulty === 'Intermediate' ? '3-5 Hours' : '6+ Hours'),
                    }
                ]
            }
        }
    });
    console.log(`Created 3D Printing Project: ${title} (${difficulty})`);
    return createdProject;
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
