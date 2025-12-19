import { MetadataRoute } from 'next'
import { getServerBaseUrl } from './lib/constants'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerBaseUrl()
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/s/', // Short links are redirects, no need to index
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

