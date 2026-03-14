import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();

// Yardımcı fonksiyon: Çerezleri (Cookie) güvenli bir şekilde ayarlamak
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
    // Access token (15 mins)
    const token = generateToken(user.id, user.role);

    // Güvenlik: XSS önlemi için HttpOnly, CSRF önlemi için SameSite Strict
    const cookieOptions = {
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 dakika
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const
    };

    res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        // 1. Zod ile payload validasyonu
        const validatedData = registerSchema.parse(req.body);

        // 2. Hesabın halihazırda var olup olmadığını denetleme
        const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } });

        // GÜVENLİK: Account Enumeration Koruması. Gerçekten de böyle bir e-posta varsa doğrudan
        // "Bu mail kayıtlı" demeyip süreci sonlandıracak, veya sahadaki ihtiyaca göre aynı dönüş tipini sağlayacağız.
        // Genellikle Kayıt esnasında "Bu mail kayıtlı" dönmek kaçınılmaz zordur ancak Şifre sıfırlama vb kısımlarda generic dönülür.
        if (existingUser) {
            return res.status(400).json({ status: 'fail', message: 'E-posta adresi kullanımda veya geçersiz.' });
        }

        // 3. Parola Hashleme (Cost: 12)
        const saltRounds = 12; // Güvenlik standardına uyumlu
        const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

        // 4. E-posta onay token'ı oluşturma (Crypto)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        // 5. Kullanıcıyı oluştur (isEmailVerified=false olarak)
        const newUser = await prisma.user.create({
            data: {
                ...validatedData,
                password: hashedPassword,
                emailVerifyToken: hashedToken,
                emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Saat geçerli
                isEmailVerified: false
            }
        });

        // 6. E-posta Onay Maili Gönder (Email service async çalışır)
        const verifyURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
        const message = `Hesabınızı doğrulamak için lütfen şu geçerli URL'ye gidin (24 Saat içinde sıfırlanır):\n\n${verifyURL}`;

        await sendEmail({
            email: newUser.email,
            subject: 'Hesap Onayı (Geçerlilik Süresi: 24 Saat)',
            message: message,
            html: `<p>Merhaba ${newUser.name},</p><p>Aramıza hoş geldiniz! Hesabınızı doğrulamak için <a href="${verifyURL}">Buraya Tıklayın</a>, veya aşağıdaki linki tarayıcıya yapıştırın:</p><p>${verifyURL}</p>`
        });

        // 7. SÜREÇ SONU: Kullanıcıya hesabın onay beklediğini dön
        res.status(201).json({
            status: 'success',
            message: 'Kayıt başarılı. Lütfen e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.'
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ status: 'fail', message: 'Geçersiz veri biçimi.', errors: error.errors });
        }
        res.status(500).json({ status: 'error', message: 'Sunucu hatası oluştu.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        // 1. Zod ile gelen isteği doğrula
        const validatedData = loginSchema.parse(req.body);

        // 2. Kullanıcıyı bul
        const user = await prisma.user.findUnique({ where: { email: validatedData.email } });

        // GÜVENLİK: Enumeration Koruması. Hackerin e-postanın kayıtlı olup olmadığını anlamaması için mesaj aynı.
        if (!user || !user.password || !(await bcrypt.compare(validatedData.password, user.password))) {
            return res.status(401).json({ status: 'fail', message: 'Hatalı e-posta veya şifre.' });
        }

        // 3. Hesap Onaylı mı kontrol
        if (!user.isEmailVerified) {
            return res.status(403).json({ status: 'fail', message: 'Lütfen E-posta adresinize gelen doğrulama bağlantısını onaylayın.' });
        }

        // 4. Hesap kilitli mi veya Soft-Deleted mi kontrolü?
        if (!user.isActive) {
            return res.status(403).json({ status: 'fail', message: 'Hesabınız askıya alınmış.' });
        }

        // 5. Güvenli şekilde çerez vererek Session başlat
        sendTokenResponse(user, 200, res);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ status: 'fail', message: 'Lütfen bilgileri geçerli biçimde girin.' });
        }
        res.status(500).json({ status: 'error', message: 'Sunucu hatası oluştu.' });
    }
};

export const logout = (req: Request, res: Response) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

// ----------------- YENİ: E-posta Onay Metodu -----------------
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        // URL ile gelen raw token'ı DB'deki gibi hashle (Güvenlik gereği DB'de Raw Token saklanmaz)
        const hashedToken = crypto.createHash('sha256').update(token as string).digest('hex');

        // Kullanıcıyı veritabanında ara
        const user = await prisma.user.findFirst({
            where: {
                emailVerifyToken: hashedToken,
                emailVerifyExpires: { gt: new Date() } // Süresi "şuan"dan büyük olanlar
            }
        });

        if (!user) {
            return res.status(400).json({ status: 'fail', message: 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.' });
        }

        // Kullanıcı bulundu! Hesap onaylanıyor
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerifyToken: null,
                emailVerifyExpires: null
            }
        });

        // Burada Frontend anasayfasına giriş yapılması için yönlendirilebilir
        res.status(200).json({ status: 'success', message: 'Hesabınız başarıyla doğrulandı. Artık giriş yapabilirsiniz.' });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Doğrulama sırasında bir hata oluştu.' });
    }
};
