import path from 'path';
import dotenv from 'dotenv';
// Load .env before any other imports that might depend on it
dotenv.config({ path: path.join(__dirname, '../.env') });

import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import adminRoutes from './routes/admin.routes';
import { protect } from './middlewares/auth.middleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Log initialization info
console.log('🔧 Initializing Secure Server...');
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Target Port: ${PORT}`);

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => callback(null, origin || true), // Production & local domains için esnek origin
    credentials: true, // IMPORTANT FOR HTTP-ONLY COOKIES
}));

// Rate limiting against brute-force and DDoS
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Body Parser with strict payload size limit
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser()); // Cookie parser added for token reading

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', message: 'API is running securely' });
});

// Root endpoint for browser confirmation
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('<h1>🚀 ToplAl API is Online</h1><p>The backend is running successfully on port 5555. Please use the <a href="http://localhost:5500">Frontend</a> to interact with the platform.</p>');
});

app.listen(PORT, () => {
    console.log(`🚀 Secure Server is running on http://localhost:${PORT}`);
});
