import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial project templates as requested...');

    // Ensure the Robotics category exists
    let roboticsCategory = await prisma.category.findUnique({
        where: { slug: 'robotics' },
    });

    if (!roboticsCategory) {
        roboticsCategory = await prisma.category.create({
            data: {
                name: 'Robotics',
                slug: 'robotics',
                description: 'Build autonomous machines and learn control systems.',
            },
        });
    }

    // WIPE EVERYTHING in Robotics so that we don't have stray data
    console.log('Wiping old robotics projects to ensure clean state...');

    // Must delete related records first if onDelete: Cascade is not enabled
    await prisma.projectVersion.deleteMany({
        where: { project: { categoryId: roboticsCategory.id } }
    });

    await prisma.projectSkill.deleteMany({
        where: { project: { categoryId: roboticsCategory.id } }
    });

    await prisma.project.deleteMany({
        where: { categoryId: roboticsCategory.id }
    });

    // --- ARDUINO PROJECTS ---
    // Beginner
    await createProject(roboticsCategory.id, 'Blinking LED Light Show', 'arduino-blinking-led', 'Make LEDs flash in fun patterns or colors like a disco.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Beginner' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Beginner' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Beginner' }
    ]);
    await createProject(roboticsCategory.id, 'Traffic Light Simulator', 'arduino-traffic-light', 'Red/Yellow/Green LEDs that cycle automatically or with a button.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Beginner' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Beginner' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Beginner' }
    ]);
    await createProject(roboticsCategory.id, 'Electronic Dice', 'arduino-electronic-dice', 'Press a button and random LEDs light up to show 1–6 like real dice.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Beginner' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Beginner' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Beginner' }
    ]);

    // Intermediate
    await createProject(roboticsCategory.id, 'Digital Thermometer with LCD', 'arduino-thermometer-lcd', 'Shows room temperature on a screen.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Intermediate' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Intermediate' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Intermediate' }
    ]);
    await createProject(roboticsCategory.id, 'Obstacle-Avoiding Robot', 'arduino-obstacle-robot', 'Tiny car that turns away from walls using ultrasonic sensor.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Intermediate' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Intermediate' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Intermediate' }
    ]);
    await createProject(roboticsCategory.id, 'Soil Moisture Plant Waterer', 'arduino-soil-moisture', 'Sensor tells when a plant needs water (LED or buzzer alert).', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Intermediate' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Intermediate' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Intermediate' }
    ]);

    // Advanced
    await createProject(roboticsCategory.id, 'Arduino Radar System', 'arduino-radar-system', 'Ultrasonic sensor + servo scans and plots objects on screen.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Advanced' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Advanced' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, '6-DOF Robotic Arm', 'arduino-6dof-arm', 'Full controllable arm with joystick or buttons.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Advanced' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Advanced' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, 'Bluetooth Home Automation', 'arduino-bt-home', 'Control lights/fans via phone app using relays.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Advanced' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Advanced' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, 'SD Card Environmental Data Logger', 'arduino-sd-datalogger', 'Records temperature, humidity, light over time.', [
        { name: 'Arduino Mega 2560 Version', board: 'arduino-mega-2560', difficulty: 'Advanced' },
        { name: 'Arduino Uno Version', board: 'arduino-uno', difficulty: 'Advanced' },
        { name: 'Arduino Nano Version', board: 'arduino-nano', difficulty: 'Advanced' }
    ]);

    // --- ESP32 PROJECTS ---
    // Beginner
    await createProject(roboticsCategory.id, 'Blinking LED with Wi-Fi Connect', 'esp32-wifi-led', 'LED flashes and board connects to home Wi-Fi.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Beginner' }
    ]);
    await createProject(roboticsCategory.id, 'Simple Buzzer Melody Player', 'esp32-buzzer-melody', 'Play short tunes by pressing buttons.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Beginner' }
    ]);
    await createProject(roboticsCategory.id, 'Button-Controlled Servo "Fan"', 'esp32-servo-fan', 'Press button to make a small servo spin a paper fan.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Beginner' }
    ]);

    // Intermediate
    await createProject(roboticsCategory.id, 'ESP32 Web Server LED Control', 'esp32-web-led', 'Turn LED on/off from phone browser.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Intermediate' }
    ]);
    await createProject(roboticsCategory.id, 'Bluetooth Remote-Controlled Robot', 'esp32-bt-robot', 'Drive a small car from phone.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Intermediate' }
    ]);
    await createProject(roboticsCategory.id, 'Smart Plant Watering with App', 'esp32-smart-plant', 'Soil sensor + Blynk/Arduino IoT Cloud app alerts.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Intermediate' }
    ]);

    // Advanced
    await createProject(roboticsCategory.id, 'ESP32-CAM Motion-Detect Security Camera', 'esp32-cam-security', 'Sends photos to phone on movement.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, 'IoT Weather Station', 'esp32-iot-weather', 'Sends temperature/humidity to online dashboard (ThingSpeak).', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, 'Voice-Controlled Home Automation', 'esp32-voice-home', 'Works with Alexa/Google Home for lights/fans.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, 'GPS Tracker with Live Map', 'esp32-gps-tracker', 'Tracks location and sends to phone/Google Maps.', [
        { name: 'ESP32 Version', board: 'esp32', difficulty: 'Advanced' }
    ]);

    // --- RASPBERRY PI PROJECTS ---
    // Beginner
    await createProject(roboticsCategory.id, 'Scratch "Catch the Fruit" Game with LED Flash', 'rpi-scratch-fruit', 'Game where catching fruit lights an LED.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Beginner' }
    ]);
    await createProject(roboticsCategory.id, 'Traffic Light in Scratch/Python', 'rpi-traffic-light', 'LEDs change like real traffic lights.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Beginner' }
    ]);
    await createProject(roboticsCategory.id, 'Easy Photo Booth', 'rpi-photo-booth', 'Press button to take silly photos with Pi Camera.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Beginner' }
    ]);

    // Intermediate
    await createProject(roboticsCategory.id, 'Retro Gaming Console (RetroPie)', 'rpi-retro-console', 'Play old games with controllers.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Intermediate' }
    ]);
    await createProject(roboticsCategory.id, 'Pi-Hole Network Ad Blocker', 'rpi-pihole', 'Blocks ads on whole home Wi-Fi.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Intermediate' }
    ]);
    await createProject(roboticsCategory.id, 'Robot Buggy', 'rpi-robot-buggy', 'Motorized car controlled by code or keyboard.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Intermediate' }
    ]);

    // Advanced
    await createProject(roboticsCategory.id, 'Magic Mirror', 'rpi-magic-mirror', 'Displays weather/calendar/news on a two-way mirror.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, 'Home Media Center (Kodi)', 'rpi-media-center', 'Stream movies/music to TV.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, 'AI Face-Recognition Door System', 'rpi-ai-door', 'Camera recognizes faces and unlocks (with servo).', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Advanced' }
    ]);
    await createProject(roboticsCategory.id, 'Raspberry Pi Cluster or Minecraft Server', 'rpi-cluster', 'Multiple Pis working together for games/computing.', [
        { name: 'Raspberry Pi Version', board: 'raspberry-pi', difficulty: 'Advanced' }
    ]);

    console.log('Robotics Seeding complete.');
}

async function createProject(categoryId: string, title: string, slug: string, description: string, versions: any[]) {
    const createdProject = await prisma.project.create({
        data: {
            title,
            slug,
            description,
            categoryId,
            isPublished: true,
            versions: {
                create: versions.map(v => ({
                    name: v.name,
                    board: v.board,
                    difficulty: v.difficulty,
                    description: `${title} tailored for the ${v.board} board.`,
                    estimatedTime: v.difficulty === 'Beginner' ? '2-3 Hours' : (v.difficulty === 'Intermediate' ? '4-6 Hours' : '8+ Hours'),
                }))
            }
        }
    });
    console.log(`Created Project: ${title}`);
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
