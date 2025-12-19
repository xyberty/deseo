import { MetadataRoute } from 'next'
import { getDb } from '@/app/lib/mongodb'
import { getServerBaseUrl } from '@/app/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getServerBaseUrl()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Dynamic pages - public wishlists
  let dynamicPages: MetadataRoute.Sitemap = []
  
  try {
    // Only try to fetch from database if MongoDB URI is available
    // This prevents build-time errors if DB is not accessible
    if (process.env.MONGODB_URI) {
      const db = await getDb()
      // Get public wishlists that are not archived
      const publicWishlists = await db.collection('wishlists')
        .find(
          { 
            isPublic: true,
            isArchived: { $ne: true }
          },
          { 
            projection: { _id: 1, updatedAt: 1 }
          }
        )
        .limit(1000) // Limit to prevent too large sitemap
        .toArray()

      dynamicPages = publicWishlists.map((wishlist) => ({
        url: `${baseUrl}/wishlist/${wishlist._id.toString()}`,
        lastModified: wishlist.updatedAt ? new Date(wishlist.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Continue with static pages only if database fails
    // This is expected during build time if DB is not accessible
  }

  return [...staticPages, ...dynamicPages]
}

