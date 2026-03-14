import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Extend Express Request object to include user data
declare global {
    namespace Express {
        interface Request {
            user?: { id: string; role: string };
            cookies?: { [key: string]: string | undefined }; // Add cookies property
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token;

        // Use JWT from cookies or Authorization header
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'Lütfen giriş yapın (Yetkilendirme hatası).' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ status: 'fail', message: 'Oturum geçersiz veya süresi dolmuş.' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(500).json({ status: 'error', message: 'Oturum doğrulanırken hata oluştu.' });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'fail', message: 'Bu işlemi yapmak için yetkiniz yok.' });
        }
        next();
    };
};
