import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/private/', '/admin/', '/api/', '/checkout/'],
        },
        sitemap: 'https://www.mari-pepa.com/sitemap.xml',
    };
}
