import { Metadata } from 'next'
import { getDb } from '@/app/lib/mongodb'
import { ObjectId } from 'mongodb'
import { getServerBaseUrl } from '@/app/lib/constants'
import type { WishlistItem } from '@/app/types/wishlist'

const baseUrl = getServerBaseUrl()

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  
  try {
    const db = await getDb()
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(id),
    })

    if (!wishlist) {
      return {
        title: 'Wishlist Not Found',
        description: 'The wishlist you are looking for does not exist.',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    // Only generate metadata for public, non-archived wishlists
    if (!wishlist.isPublic || wishlist.isArchived) {
      return {
        title: wishlist.title || 'Wishlist',
        description: wishlist.description || 'A private wishlist',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    const title = wishlist.title || 'Wishlist'
    const description = wishlist.description || `A wishlist with ${wishlist.items?.length || 0} items`
    const url = `${baseUrl}/wishlist/${id}`
    
    // Get first item image if available
    const firstItemImage = wishlist.items?.find((item: WishlistItem) => item.imageUrl)?.imageUrl

    const defaultImage = `${baseUrl}/deseo-512x512.png`
    const ogImage = firstItemImage || defaultImage
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        images: [
          // Rectangular image for Facebook, LinkedIn, etc. (1200x630 recommended)
          ...(firstItemImage ? [{
            url: firstItemImage,
            width: 1200,
            height: 630,
            alt: title,
          }] : []),
          // Square image for WhatsApp (preferred 1:1 ratio, 512x512 or larger)
          {
            url: ogImage,
            width: 512,
            height: 512,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: url,
      },
      robots: {
        index: true,
        follow: true,
      },
      // Platform-specific tags
      // Open Graph works for: Facebook, WhatsApp, VK.com, OK.ru, LinkedIn, Telegram
      // Twitter Cards works for: Twitter/X
      other: {
        // VK.com and OK.ru will use Open Graph, but these provide explicit control
        ...(ogImage && { 'vk:image': ogImage }),
        ...(ogImage && { 'ok:image': ogImage }),
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Wishlist',
      description: 'View this wishlist on Deseo',
    }
  }
}

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

