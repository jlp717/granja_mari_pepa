import { MetadataRoute } from 'next'
import { locales } from '../i18n'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.mari-pepa.com'

  // Define core paths
  const routes = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/productos', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/acerca', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/contacto', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/area-clientes', priority: 0.7, changeFrequency: 'weekly' as const },
  ]

  const sitemap: MetadataRoute.Sitemap = []

  routes.forEach((route) => {
    locales.forEach((locale) => {
      // For default locale (es), we don't add the locale prefix
      // For other locales, we prepend the locale
      const localePrefix = locale === 'es' ? '' : `/${locale}`
      const url = `${baseUrl}${localePrefix}${route.path}`

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      })
    })
  })

  return sitemap
}