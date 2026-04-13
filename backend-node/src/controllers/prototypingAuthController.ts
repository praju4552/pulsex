import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET, TOKEN_EXPIRY, SALT_ROUNDS } from '../config/auth';
import prisma from '../db';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// In production, move to .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const signup = async (req: Request, res: Response) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!name || !phone || !email || !password) {
            return res.status(400).json({ error: 'All fields (name, phone, email, password) are required' });
        }

        // Validate password containing numeric and special char
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one number and one special character (!@#$%^&* etc.)' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
             return res.status(400).json({ error: 'Invalid email format' });
        }

        const existingUser = await prisma.prototypingUser.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await prisma.prototypingUser.create({
            data: {
                name,
                phone,
                email,
                password: hashedPassword,
                role: 'USER'
            }
        });

        const { password: _, ...userWithoutPassword } = user;

        const token = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        res.status(201).json({ message: 'Prototyping user registered successfully', user: userWithoutPassword, token });
    } catch (error) {
        console.error('Prototyping Signup Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, phone, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and Password are required' });
        }

        const protoUser = await prisma.prototypingUser.findUnique({
            where: { email }
        });

        if (!protoUser || !protoUser.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (protoUser.lockedUntil && protoUser.lockedUntil > new Date()) {
            const mins = Math.ceil((protoUser.lockedUntil.getTime() - Date.now()) / 60000);
            return res.status(423).json({ error: `Account locked. Try again in ${mins} minute(s)` });
        }

        const isValid = await bcrypt.compare(password, protoUser.password);

        if (!isValid) {
            const attempts = protoUser.failedLoginAttempts + 1;
            const locked = attempts >= 5;
            await prisma.prototypingUser.update({
                where: { id: protoUser.id },
                data: { failedLoginAttempts: attempts, lockedUntil: locked ? new Date(Date.now() + 15 * 60 * 1000) : null }
            });
            return res.status(401).json({ error: locked ? 'Account locked due to 5 consecutive failed logins' : 'Invalid credentials' });
        }

        await prisma.prototypingUser.update({
            where: { id: protoUser.id },
            data: { failedLoginAttempts: 0, lockedUntil: null }
        });

        const token = jwt.sign(
            { userId: protoUser.id, role: protoUser.role, email: protoUser.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        const refreshToken = jwt.sign(
            { userId: protoUser.id },
            process.env.REFRESH_SECRET || 'fallback-refresh-secret',
            { expiresIn: '7d' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // set to true in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const { password: _, ...userWithoutPassword } = protoUser;

        res.json({ message: 'Login successful', user: userWithoutPassword, token });
    } catch (error) {
        console.error('Prototyping Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * Handle Google Login via UserInfo Payload
 */
export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token is required' });

        // ✅ Verify server-side with Google to prevent user-faked profiles
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const googlePayload = await googleRes.json();

        if (!googlePayload || !googlePayload.email) {
             return res.status(401).json({ error: 'Invalid or expired Google token' });
        }

        const { email, name, sub: googleId } = googlePayload;

        let user = await prisma.prototypingUser.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.prototypingUser.create({
                data: {
                    email,
                    name: name || 'Google User',
                    googleId,
                    role: 'USER'
                }
            });
        } else if (!user.googleId) {
            // Link existing account
            user = await prisma.prototypingUser.update({
                where: { id: user.id },
                data: { googleId }
            });
        }

        const jwtToken = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'Google login successful', user: userWithoutPassword, token: jwtToken });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
};

/**
 * Update User Profile
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { 
            name, phone, 
            streetAddress, apartment, city, state, zip, country,
            secondaryLabel, secondaryStreetAddress, secondaryApartment, 
            secondaryCity, secondaryState, secondaryZip, secondaryCountry 
        } = req.body;

        const userId = (req.user as any)?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await prisma.prototypingUser.update({
            where: { id: userId },
            data: {
                name,
                phone,
                streetAddress,
                apartment,
                city,
                state,
                zip,
                country,
                secondaryLabel,
                secondaryStreetAddress,
                secondaryApartment,
                secondaryCity,
                secondaryState,
                secondaryZip,
                secondaryCountry
            }
        });

        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'Profile updated successfully', user: userWithoutPassword });
    } catch (error) {
        console.error('Prototyping Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

/**
 * WhatsApp OTP Request
 */
export const whatsappRequestOtp = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number required' });

        const otp = (crypto.randomBytes(3).readUIntBE(0, 3) % 900000 + 100000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await prisma.verificationCode.create({
            data: {
                phone,
                otp: hashedOtp,
                expiresAt
            }
        });

        // [DEV MODE] Log OTP and return in response
        console.log(`[WHATSAPP-DEV] OTP for ${phone}: ${otp}`);

        res.json({ 
            message: 'OTP generated and sent',
            devModeOtp: otp 
        });
    } catch (error) {
        console.error('WhatsApp request error:', error);
        res.status(500).json({ error: 'Failed to process WhatsApp request' });
    }
};

/**
 * WhatsApp OTP Verification
 */
export const whatsappVerifyOtp = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

        const record = await prisma.verificationCode.findFirst({
            where: { phone, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' }
        });

        if (!record) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        const isValidOtp = await bcrypt.compare(otp, record.otp);
        if (!isValidOtp) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        await prisma.verificationCode.deleteMany({ where: { phone } });

        let user = await prisma.prototypingUser.findUnique({ where: { phone } });
        if (!user) {
            user = await prisma.prototypingUser.create({
                data: {
                    email: `${phone}@whatsapp-user.local`,
                    name: 'WhatsApp User',
                    phone,
                    whatsappId: phone,
                    role: 'USER'
                }
            });
        } else if (!user.whatsappId) {
            user = await prisma.prototypingUser.update({
                where: { id: user.id },
                data: { whatsappId: phone }
            });
        }

        const jwtToken = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'WhatsApp login successful', user: userWithoutPassword, token: jwtToken });
    } catch (error) {
        console.error('WhatsApp Verify Error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};
