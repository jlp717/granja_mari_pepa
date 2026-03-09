import { MetadataRoute } from 'next'
import { locales } from '../i18n'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.mari-pepa.com'

  // Define core paths with SEO priorities
  const routes = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/productos', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/acerca', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/contacto', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/area-clientes', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/lorca', priority: 0.7, changeFrequency: 'monthly' as const },
  ]

  const sitemap: MetadataRoute.Sitemap = []

  routes.forEach((route) => {
    locales.forEach((locale) => {
      // For default locale (es), we don't add the locale prefix
      const localePrefix = locale === 'es' ? '' : `/${locale}`
      const url = `${baseUrl}${localePrefix}${route.path}`

      // Build alternates with hreflang for all locales
      const languages: Record<string, string> = {}
      locales.forEach((altLocale) => {
        const altPrefix = altLocale === 'es' ? '' : `/${altLocale}`
        languages[altLocale] = `${baseUrl}${altPrefix}${route.path}`
      })

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages,
        },
      })
    })
  })

  return sitemap
}