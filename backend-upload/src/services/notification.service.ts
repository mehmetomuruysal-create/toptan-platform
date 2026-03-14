export interface NotificationOptions {
    userId: string;
    type: 'WHATSAPP' | 'SMS' | 'EMAIL';
    message: string;
    title?: string;
}

export const sendNotification = async (options: NotificationOptions) => {
    // Bu servis şuan için sadece loglama yapar. 
    // İleride Twilio, MessageBird veya SMTP entegrasyonu buraya yapılacak.
    console.log(`[BİLDİRİM - ${options.type}] Kullanıcı: ${options.userId} | Mesaj: ${options.message}`);

    // Simüle edilmiş gecikme
    return new Promise((resolve) => setTimeout(resolve, 500));
};

export const notifyAuctionStatus = async (userId: string, auctionTitle: string, status: string, prefs: string[]) => {
    const message = `İhaleniz (${auctionTitle}) durumu güncellendi: ${status}`;

    for (const type of prefs) {
        await sendNotification({
            userId,
            type: type as any,
            message,
            title: 'İhale Durum Güncellemesi'
        });
    }
};
