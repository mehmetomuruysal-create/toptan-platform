import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedProduct {
    title: string;
    priceTiers: { minQuantity: number; maxQuantity?: number; price: number }[];
    imageUrl: string;
    description: string;
    source: string;
}

export const scrapeAlibaba = async (url: string): Promise<ScrapedProduct> => {
    try {
        // Alibaba bot koruması için gerçekçi headerlar
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000 // 10 saniye timeout
        });

        const $ = cheerio.load(data);

        // Ürün Başlığı (Alibaba seçicileri sık değişebilir, alternatifler eklendi)
        const title = $('h1.module-pdp-title').text().trim() ||
            $('.product-title').text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            'Ürün Başlığı Bulunamadı';

        // Görsel
        const imageUrl = $('.main-image-thumb-item img').attr('src') ||
            $('.main-layout img').attr('src') ||
            $('meta[property="og:image"]').attr('content') ||
            '';

        // Fiyat Kademeleri
        const priceTiers: any[] = [];
        $('.price-list .price-item, .price-rank .price-item').each((_: number, el: any) => {
            const qtyText = $(el).find('.quantity, .count').text().trim();
            const priceText = $(el).find('.price, .value').text().replace(/[^0-9,.]/g, '').replace(',', '.').trim();

            const qtyMatch = qtyText.match(/(\d+)/g);
            if (qtyMatch && priceText) {
                priceTiers.push({
                    minQuantity: parseInt(qtyMatch[0]),
                    maxQuantity: qtyMatch[1] ? parseInt(qtyMatch[1]) : undefined,
                    price: parseFloat(priceText)
                });
            }
        });

        // Eğer kademeler bulunamadıysa tek fiyat kontrolü
        if (priceTiers.length === 0) {
            const singlePrice = $('.pre-inquiry-price, .price-formatter').first().text().replace(/[^0-9,.]/g, '').replace(',', '.').trim();
            if (singlePrice) {
                priceTiers.push({ minQuantity: 1, price: parseFloat(singlePrice) });
            }
        }

        const description = $('.product-property .property-item').map((_: number, el: any) => $(el).text().trim()).get().join(' | ') || 'Açıklama çekilemedi.';

        return {
            title,
            priceTiers,
            imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
            description,
            source: 'Alibaba'
        };
    } catch (error: any) {
        console.error('Scraping error:', error.message);
        if (error.response && error.response.status === 403) {
            throw new Error('Alibaba erişimi engelledi (Bot tespiti). Lütfen profesyonel bir Scraper servisi kullanın.');
        }
        throw new Error('Ürün bilgileri çekilirken bir hata oluştu: ' + error.message);
    }
};
