/**
 * seed_all_robotics.ts
 * Complete reseed of all Robotics projects:
 *   – Arduino Uno   (10 projects → board: 'arduino-uno')
 *   – Arduino Mega  (10 projects → board: 'arduino-mega-2560')
 *   – Arduino Nano  (10 projects → board: 'arduino-nano')
 *   – ESP32         (10 projects → board: 'esp32')
 *   – Raspberry Pi  (10 projects → board: 'raspberry-pi')
 *   – 3D Printing   (10 projects → board: '3d-printing', subcategory: '3d-printing')
 *
 * Run: npx ts-node --transpile-only backend-node/scripts/seed_all_robotics.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface ProjectDef {
    title: string;
    slug: string;
    description: string;
    difficulty: Difficulty;
    estimatedTime: string;
}

async function upsertProject(
    categoryId: string,
    def: ProjectDef,
    board: string,
    subcategory?: string
) {
    // Delete existing (cascade will remove versions)
    const existing = await prisma.project.findUnique({ where: { slug: def.slug } });
    if (existing) {
        await prisma.projectVersion.deleteMany({ where: { projectId: existing.id } });
        await prisma.projectSkill.deleteMany({ where: { projectId: existing.id } });
        await prisma.project.delete({ where: { id: existing.id } });
    }

    await prisma.project.create({
        data: {
            title: def.title,
            slug: def.slug,
            description: def.description,
            categoryId,
            subcategory: subcategory ?? null,
            isPublished: true,
            versions: {
                create: {
                    name: `${def.title} — ${board}`,
                    board,
                    difficulty: def.difficulty,
                    description: def.description,
                    estimatedTime: def.estimatedTime,
                    isPublished: true,
                },
            },
        },
    });

    console.log(`  ✔ [${board}] ${def.difficulty.padEnd(12)} ${def.title}`);
}

// ─── project definitions ─────────────────────────────────────────────────────

// Arduino Uno
const ARDUINO_UNO: ProjectDef[] = [
    { difficulty: 'Beginner', title: 'Blinking LED Light Show', slug: 'uno-blinking-led', description: 'Make LEDs flash in fun patterns or colors like a disco.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Traffic Light Simulator', slug: 'uno-traffic-light', description: 'Red/Yellow/Green LEDs that cycle automatically or with a button.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Electronic Dice', slug: 'uno-electronic-dice', description: 'Press a button and random LEDs light up to show 1–6 like real dice.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Intermediate', title: 'Digital Thermometer with LCD', slug: 'uno-thermometer-lcd', description: 'Shows room temperature on a screen using a sensor and LCD.', estimatedTime: '4-5 Hours' },
    { difficulty: 'Intermediate', title: 'Obstacle-Avoiding Robot', slug: 'uno-obstacle-robot', description: 'Tiny car that turns away from walls using an ultrasonic sensor.', estimatedTime: '5-6 Hours' },
    { difficulty: 'Intermediate', title: 'Soil Moisture Plant Waterer', slug: 'uno-soil-moisture', description: 'Sensor tells when a plant needs water (LED or buzzer alert).', estimatedTime: '4-5 Hours' },
    { difficulty: 'Advanced', title: 'Arduino Radar System', slug: 'uno-radar-system', description: 'Ultrasonic sensor + servo scans and plots objects on screen.', estimatedTime: '8-10 Hours' },
    { difficulty: 'Advanced', title: '6-DOF Robotic Arm', slug: 'uno-6dof-arm', description: 'Full controllable arm with joystick or buttons.', estimatedTime: '10+ Hours' },
    { difficulty: 'Advanced', title: 'Bluetooth Home Automation', slug: 'uno-bt-home-automation', description: 'Control lights/fans via phone app using relays and Bluetooth module.', estimatedTime: '8-10 Hours' },
    { difficulty: 'Advanced', title: 'SD Card Environmental Data Logger', slug: 'uno-sd-data-logger', description: 'Records temperature, humidity, and light over time onto an SD card.', estimatedTime: '8-10 Hours' },
];

// Arduino Mega 2560 — same project types, Mega-specific slugs & descriptions
const ARDUINO_MEGA: ProjectDef[] = [
    { difficulty: 'Beginner', title: 'Blinking LED Light Show', slug: 'mega-blinking-led', description: 'Control multiple LED arrays across 54 pins for a large-scale light show.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Traffic Light Simulator', slug: 'mega-traffic-light', description: 'Red/Yellow/Green LEDs that cycle automatically — Mega handles multiple lanes.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Electronic Dice', slug: 'mega-electronic-dice', description: 'Press a button and random LEDs light up to show 1–6 like real dice.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Intermediate', title: 'Digital Thermometer with LCD', slug: 'mega-thermometer-lcd', description: 'Shows room temperature on a 20×4 LCD with Mega\'s extra UART ports.', estimatedTime: '4-5 Hours' },
    { difficulty: 'Intermediate', title: 'Obstacle-Avoiding Robot', slug: 'mega-obstacle-robot', description: 'Autonomous robot using multiple ultrasonic sensors on Mega\'s extended I/O.', estimatedTime: '5-6 Hours' },
    { difficulty: 'Intermediate', title: 'Soil Moisture Plant Waterer', slug: 'mega-soil-moisture', description: 'Monitor multiple plants simultaneously using Mega\'s analog inputs.', estimatedTime: '4-5 Hours' },
    { difficulty: 'Advanced', title: 'Arduino Radar System', slug: 'mega-radar-system', description: 'Multi-servo radar with Mega driving servo arrays and Processing visualization.', estimatedTime: '8-10 Hours' },
    { difficulty: 'Advanced', title: '6-DOF Robotic Arm', slug: 'mega-6dof-arm', description: 'Full 6-axis arm — Mega 2560 drives all 6 servos simultaneously.', estimatedTime: '10+ Hours' },
    { difficulty: 'Advanced', title: 'Bluetooth Home Automation', slug: 'mega-bt-home-automation', description: 'Control multiple rooms\' lights and fans via phone app using Mega relay shields.', estimatedTime: '8-10 Hours' },
    { difficulty: 'Advanced', title: 'SD Card Environmental Data Logger', slug: 'mega-sd-data-logger', description: 'Log data from many sensors simultaneously using Mega\'s multiple hardware serials.', estimatedTime: '8-10 Hours' },
];

// Arduino Nano
const ARDUINO_NANO: ProjectDef[] = [
    { difficulty: 'Beginner', title: 'Blinking LED Light Show', slug: 'nano-blinking-led', description: 'Compact LED disco pattern on a breadboard — no soldering needed.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Traffic Light Simulator', slug: 'nano-traffic-light', description: 'Pocket-sized traffic light — fits entirely on a mini breadboard.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Electronic Dice', slug: 'nano-electronic-dice', description: 'Tiny electronic dice using 7 LEDs on a compact Nano build.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Intermediate', title: 'Digital Thermometer with LCD', slug: 'nano-thermometer-lcd', description: 'Wearable or portable thermometer with I2C LCD and Nano.', estimatedTime: '4-5 Hours' },
    { difficulty: 'Intermediate', title: 'Obstacle-Avoiding Robot', slug: 'nano-obstacle-robot', description: 'Ultra-compact robot using Nano for minimal footprint.', estimatedTime: '5-6 Hours' },
    { difficulty: 'Intermediate', title: 'Soil Moisture Plant Waterer', slug: 'nano-soil-moisture', description: 'Embed a Nano inside a plant pot for an invisible watering alert system.', estimatedTime: '4-5 Hours' },
    { difficulty: 'Advanced', title: 'Arduino Radar System', slug: 'nano-radar-system', description: 'Compact radar unit using Nano hidden in a 3D-printed housing.', estimatedTime: '8-10 Hours' },
    { difficulty: 'Advanced', title: '6-DOF Robotic Arm', slug: 'nano-6dof-arm', description: 'Miniature Nano-powered robotic arm — lightweight and portable.', estimatedTime: '10+ Hours' },
    { difficulty: 'Advanced', title: 'Bluetooth Home Automation', slug: 'nano-bt-home-automation', description: 'Nano-based relay controller hidden behind a light switch for smart home.', estimatedTime: '8-10 Hours' },
    { difficulty: 'Advanced', title: 'SD Card Environmental Data Logger', slug: 'nano-sd-data-logger', description: 'Nano datalogger in a matchbox-sized enclosure for field sensing.', estimatedTime: '8-10 Hours' },
];

// ESP32
const ESP32_PROJECTS: ProjectDef[] = [
    { difficulty: 'Beginner', title: 'Blinking LED with Wi-Fi Connect', slug: 'esp32-wifi-led-blink', description: 'LED flashes and board connects to home Wi-Fi — your first IoT device.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Simple Buzzer Melody Player', slug: 'esp32-buzzer-melody', description: 'Play short tunes by pressing buttons using the PWM buzzer output.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Button-Controlled Servo "Fan"', slug: 'esp32-servo-fan', description: 'Press a button to make a small servo spin a paper fan blade.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Intermediate', title: 'ESP32 Web Server LED Control', slug: 'esp32-web-server-led', description: 'Turn LED on/off from phone browser using ESP32 as a web server.', estimatedTime: '4-5 Hours' },
    { difficulty: 'Intermediate', title: 'Bluetooth Remote-Controlled Robot', slug: 'esp32-bt-robot', description: 'Drive a small wheeled robot from your phone over Bluetooth.', estimatedTime: '5-6 Hours' },
    { difficulty: 'Intermediate', title: 'Smart Plant Watering with App', slug: 'esp32-smart-plant', description: 'Soil moisture sensor + Blynk/Arduino IoT Cloud app sends watering alerts.', estimatedTime: '5-6 Hours' },
    { difficulty: 'Advanced', title: 'ESP32-CAM Motion-Detect Security Camera', slug: 'esp32-cam-security', description: 'Detects movement and sends photos to your phone automatically.', estimatedTime: '8-10 Hours' },
    { difficulty: 'Advanced', title: 'IoT Weather Station', slug: 'esp32-iot-weather-station', description: 'Sends temperature/humidity readings to an online dashboard (ThingSpeak).', estimatedTime: '8-10 Hours' },
    { difficulty: 'Advanced', title: 'Voice-Controlled Home Automation', slug: 'esp32-voice-home', description: 'Works with Alexa/Google Home to control lights and fans via relays.', estimatedTime: '10+ Hours' },
    { difficulty: 'Advanced', title: 'GPS Tracker with Live Map', slug: 'esp32-gps-live-map', description: 'Tracks GPS location and sends coordinates to Google Maps on your phone.', estimatedTime: '10+ Hours' },
];

// Raspberry Pi
const RASPBERRY_PI_PROJECTS: ProjectDef[] = [
    { difficulty: 'Beginner', title: 'Scratch "Catch the Fruit" Game with LED Flash', slug: 'rpi-scratch-fruit-game', description: 'A Scratch game where catching fruit lights an LED on the GPIO pins.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Traffic Light in Scratch/Python', slug: 'rpi-traffic-light', description: 'LEDs change like real traffic lights programmed in Scratch or Python.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Beginner', title: 'Easy Photo Booth', slug: 'rpi-easy-photo-booth', description: 'Press a button to take silly photos with the Raspberry Pi Camera module.', estimatedTime: '3-4 Hours' },
    { difficulty: 'Intermediate', title: 'Retro Gaming Console (RetroPie)', slug: 'rpi-retro-gaming-console', description: 'Play classic retro games on your TV using RetroPie and USB controllers.', estimatedTime: '4-6 Hours' },
    { difficulty: 'Intermediate', title: 'Pi-Hole Network Ad Blocker', slug: 'rpi-pihole-ad-blocker', description: 'Blocks ads on your entire home Wi-Fi network using Pi-Hole.', estimatedTime: '3-5 Hours' },
    { difficulty: 'Intermediate', title: 'Robot Buggy', slug: 'rpi-robot-buggy', description: 'Motorized robot car controlled via keyboard or Python code.', estimatedTime: '6-8 Hours' },
    { difficulty: 'Advanced', title: 'Magic Mirror', slug: 'rpi-magic-mirror', description: 'Displays weather, calendar, and news behind a two-way mirror.', estimatedTime: '8-12 Hours' },
    { difficulty: 'Advanced', title: 'Home Media Center (Kodi)', slug: 'rpi-kodi-media-center', description: 'Stream movies, music and live TV to your TV using Kodi on Pi.', estimatedTime: '4-6 Hours' },
    { difficulty: 'Advanced', title: 'AI Face-Recognition Door System', slug: 'rpi-ai-face-door', description: 'Camera recognizes registered faces and unlocks a servo-driven door.', estimatedTime: '12+ Hours' },
    { difficulty: 'Advanced', title: 'Raspberry Pi Cluster or Minecraft Server', slug: 'rpi-cluster-minecraft', description: 'Multiple Pis working together for computing or running a Minecraft server.', estimatedTime: '12+ Hours' },
];

// 3D Printing — subcategory '3d-printing'
const PRINTING_3D: ProjectDef[] = [
    { difficulty: 'Beginner', title: 'Custom Name Keychain', slug: '3dp-custom-name-keychain', description: 'Print your name or favorite emoji as a colorful keychain.', estimatedTime: '30 Min' },
    { difficulty: 'Beginner', title: 'Spinning Top', slug: '3dp-spinning-top', description: 'Fun colorful top that spins for minutes on smooth surfaces.', estimatedTime: '20 Min' },
    { difficulty: 'Beginner', title: 'Simple Fidget Toy or Puzzle Piece', slug: '3dp-simple-fidget-toy', description: 'Basic cube or chain link — adult helps with design in Tinkercad.', estimatedTime: '30 Min' },
    { difficulty: 'Intermediate', title: 'Articulated Dragon/Snake Toy', slug: '3dp-articulated-dragon', description: 'Flexible multi-segment body that wiggles — prints fully assembled.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Intermediate', title: 'Custom Phone or Tablet Stand', slug: '3dp-phone-tablet-stand', description: 'Adjustable viewing-angle desk stand for phones and tablets.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Intermediate', title: '3D Puzzle (Cube or Animal)', slug: '3dp-puzzle-cube-animal', description: 'Interlocking pieces that assemble into a cube or animal model.', estimatedTime: '2-3 Hours' },
    { difficulty: 'Advanced', title: 'Planetary Gear Set', slug: '3dp-planetary-gear-set', description: 'Turning the handle makes all gears spin — great for learning mechanics.', estimatedTime: '6-8 Hours' },
    { difficulty: 'Advanced', title: 'RC Car Chassis or Body Parts', slug: '3dp-rc-car-chassis', description: 'Custom frame and wheel components for small DC or servo motors.', estimatedTime: '6-8 Hours' },
    { difficulty: 'Advanced', title: 'Mechanical Automaton', slug: '3dp-mechanical-automaton', description: 'Moving mechanical sculpture — walking figure or clock mechanism.', estimatedTime: '10+ Hours' },
    { difficulty: 'Advanced', title: 'Custom Enclosure for Arduino/Pi Project', slug: '3dp-custom-enclosure', description: 'Box with hinges, wire slots, and a lid to house your electronics project.', estimatedTime: '4-6 Hours' },
];

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🔧  Starting full Robotics reseed...\n');

    // 1. Find or create Robotics category
    let robotics = await prisma.category.findUnique({ where: { slug: 'robotics' } });
    if (!robotics) {
        robotics = await prisma.category.create({
            data: {
                slug: 'robotics',
                name: 'Robotics',
                description: 'Build physical machines, IoT devices and explore hardware engineering.',
            },
        });
        console.log('Created Robotics category.\n');
    }

    const cid = robotics.id;

    // 2. Wipe all existing robotics projects (cascade handles versions)
    console.log('Wiping existing robotics data...');
    const existing = await prisma.project.findMany({ where: { categoryId: cid }, select: { id: true } });
    for (const p of existing) {
        await prisma.projectVersion.deleteMany({ where: { projectId: p.id } });
        await prisma.projectSkill.deleteMany({ where: { projectId: p.id } });
    }
    await prisma.project.deleteMany({ where: { categoryId: cid } });
    console.log(`  Removed ${existing.length} old projects.\n`);

    // 3. Seed each board
    console.log('── Arduino Uno ──────────────────────────────');
    for (const p of ARDUINO_UNO) await upsertProject(cid, p, 'arduino-uno');

    console.log('\n── Arduino Mega 2560 ───────────────────────');
    for (const p of ARDUINO_MEGA) await upsertProject(cid, p, 'arduino-mega-2560');

    console.log('\n── Arduino Nano ─────────────────────────────');
    for (const p of ARDUINO_NANO) await upsertProject(cid, p, 'arduino-nano');

    console.log('\n── ESP32 ────────────────────────────────────');
    for (const p of ESP32_PROJECTS) await upsertProject(cid, p, 'esp32');

    console.log('\n── Raspberry Pi ─────────────────────────────');
    for (const p of RASPBERRY_PI_PROJECTS) await upsertProject(cid, p, 'raspberry-pi');

    console.log('\n── 3D Printing ──────────────────────────────');
    for (const p of PRINTING_3D) await upsertProject(cid, p, '3d-printing', '3d-printing');

    const total =
        ARDUINO_UNO.length + ARDUINO_MEGA.length + ARDUINO_NANO.length +
        ESP32_PROJECTS.length + RASPBERRY_PI_PROJECTS.length + PRINTING_3D.length;

    console.log(`\n✅  Done! Seeded ${total} projects across 6 boards.\n`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
