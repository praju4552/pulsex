import prisma from '../db';

/**
 * Generates a formatted ID using an incremental sequence.
 * @param type The prefix type (SO, INV, PID, PCB, 3D)
 * @returns Formatted ID string, e.g., "PWS-SO-00001"
 */
export async function generateId(type: 'SO' | 'INV' | 'PID' | 'PCB' | '3D' | 'LC'): Promise<string> {
    try {
        const sequence = await prisma.sequence.upsert({
            where: { type },
            update: { count: { increment: 1 } },
            create: { type, count: 1 },
        });

        const prefixMap: Record<string, string> = {
            SO: 'PWS-SO-',
            INV: 'PWS-INV-',
            PID: 'PWS-PID-',
            PCB: 'PWS-PCB-',
            '3D': 'PWS-3D-',
            'LC': 'PWS-LC-',
        };

        const prefix = prefixMap[type];
        const paddedCount = sequence.count.toString().padStart(5, '0');
        
        return `${prefix}${paddedCount}`;
    } catch (error) {
        console.error(`[generateId] Error generating ID for ${type}:`, error);
        throw new Error(`Failed to generate ID for ${type}`);
    }
}
