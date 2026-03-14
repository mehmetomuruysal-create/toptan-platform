import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'super-secret-default-key-please-change';
const JWT_EXPIRES_IN = '1d';

export const generateToken = (userId: string, role: string) => {
    return jwt.sign({ id: userId, role }, getJwtSecret(), {
        expiresIn: JWT_EXPIRES_IN,
    });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, getJwtSecret()) as { id: string, role: string };
    } catch (error) {
        return null;
    }
};
