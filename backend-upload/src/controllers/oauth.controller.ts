import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleOAuth = async (req: Request, res: Response) => {
    try {
        const { idToken, role = 'BIREYSEL' } = req.body; // Default role if new user

        if (!idToken) {
            return res.status(400).json({ status: 'fail', message: 'Token eksik.' });
        }

        // Verify Google ID Token
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.email_verified) {
            return res.status(400).json({ status: 'fail', message: 'Geçersiz token veya e-posta.' });
        }

        const email = payload.email.toLowerCase();
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    email,
                    name: payload.name || 'Yeni Kullanıcı',
                    role: role,
                    oauthProvider: 'google',
                    oauthProviderId: payload.sub,
                    isEmailVerified: true, // Google verifies email
                }
            });
        }

        // Generate JWT
        const token = generateToken(user.id, user.role);

        // Security: Set HttpOnly Cookie
        res.cookie('jwt', token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 gün
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({
            status: 'success',
            message: 'Giriş başarılı.',
            token,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            }
        });

    } catch (error) {
        console.error('Google OAuth Hatası:', error);
        return res.status(500).json({ status: 'error', message: 'Google doğrulama hatası.' });
    }
};

export const appleOAuth = async (req: Request, res: Response) => {
    // Apple entegrasyonu altyapısı hazırlandı, client tarafı hazır olana dek mock yanıt.
    try {
        const { idToken, role = 'BIREYSEL', name } = req.body;

        if (!idToken) {
            return res.status(400).json({ status: 'fail', message: 'Token eksik.' });
        }

        const payload = await appleSignin.verifyIdToken(idToken, {
            audience: process.env.APPLE_CLIENT_ID,
            ignoreExpiration: false,
        });

        if (!payload || !payload.email) {
            return res.status(400).json({ status: 'fail', message: 'Geçersiz token.' });
        }

        const email = payload.email.toLowerCase();
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || 'Apple Kullanıcısı',
                    role: role,
                    oauthProvider: 'apple',
                    oauthProviderId: payload.sub,
                    isEmailVerified: true,
                }
            });
        }

        const token = generateToken(user.id, user.role);

        res.cookie('jwt', token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({
            status: 'success',
            message: 'Giriş başarılı.',
            token,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            }
        });
    } catch (error) {
        console.error('Apple OAuth Hatası:', error);
        return res.status(500).json({ status: 'error', message: 'Apple doğrulama hatası.' });
    }
};
