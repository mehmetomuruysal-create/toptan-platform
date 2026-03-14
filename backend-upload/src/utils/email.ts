import nodemailer from 'nodemailer';

// Dev testler için Ethereal (Geçici) E-posta Kullanımı
// Üretim (Production) aşamasında AWS SES, SendGrid, SMTP sağlayıcıları girilmeli
export const sendEmail = async (options: { email: string; subject: string; message: string; html?: string }) => {
    // Geçici test hesabı (Eğer kendi SMTP'niz varsa .env'den çekebiliriz)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        auth: {
            user: process.env.EMAIL_USERNAME || 'ethereal.user@ethereal.email',
            pass: process.env.EMAIL_PASSWORD || 'ethereal_password'
        }
    });

    const mailOptions = {
        from: 'ToplAl B2B Platformu <noreply@toplal.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✉️ Email başarıyla gönderildi: ${options.email}`);
    } catch (error) {
        console.error("❌ Email Gönderim Hatası:", error);
    }
};
