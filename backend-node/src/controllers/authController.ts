import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, TOKEN_EXPIRY, SALT_ROUNDS } from '../config/auth';
import prisma from '../db';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'auth_debug.log');
const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.prototypingUser.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Always create as USER role — role elevation is admin-only
        const user = await prisma.prototypingUser.create({
            data: {
                email,
                name: name || email.split('@')[0],
                password: hashedPassword,
                role: 'USER',
                credits: 20
            }
        });

        const { password: _, ...userWithoutPassword } = user;

        const token = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword, token });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        log(`Login attempt for: ${email}`);

        const user = await prisma.prototypingUser.findUnique({
            where: { email }
        });

        log(`User found in DB: ${user ? 'Yes' : 'No'}`);

        if (!user || !user.password) {
            log('User not found or has no password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        let isValid = false;
        const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        
        if (isBcryptHash) {
            isValid = await bcrypt.compare(password, user.password);
        }
        
        // Fallback: if password is stored as plain text
        if (!isValid && (password === user.password)) {
            log('Plain-text password match detected! Auto-hashing for future security...');
            isValid = true;
            try {
                const newHash = await bcrypt.hash(password, SALT_ROUNDS);
                await prisma.prototypingUser.update({
                    where: { id: user.id },
                    data: { password: newHash }
                });
            } catch (hashErr) {
                // Ignore hash error
            }
        }
        
        if (!isValid) {
            log('Invalid password provided');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.json({ message: 'Login successful', user: userWithoutPassword, token });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
