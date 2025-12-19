import { Metadata } from 'next'
import { getServerBaseUrl } from '@/app/lib/constants'

const baseUrl = getServerBaseUrl()

export const metadata: Metadata = {
  title: 'Create Wishlist',
  description: 'Create a new wishlist to share with friends and family. Add items, set prices, and share your list easily.',
  openGraph: {
    title: 'Create Wishlist at Deseo',
    description: 'Create a new wishlist to share with friends and familyAdd items, set prices, and share your list easily.',
    url: `${baseUrl}/create`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/deseo-512x512.png`,
        width: 512,
        height: 512,
        alt: 'Deseo Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Wishlist at Deseo',
    description: 'Create a new wishlist to share with friends and family. Add items, set prices, and share your list easily.',
    images: [`${baseUrl}/deseo-512x512.png`],
  },
  alternates: {
    canonical: `${baseUrl}/create`,
  },
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

