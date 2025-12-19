# Deseo

**Deseo** is a modern, elegant wishlist management application that makes it easy to create, share, and manage gift lists with friends and family. Built with Next.js and designed for simplicity and user experience.

## Features

- **Create Wishlists** - Build personalized wishlists with items, descriptions, and prices
- **Easy Sharing** - Share wishlists via short links or direct sharing
- **Item Reservations** - Reserve items from shared wishlists to avoid duplicates
- **Passwordless Auth** - Secure magic link authentication via email
- **Multi-Currency Support** - Support for multiple currencies
- **Collaborative Lists** - Share wishlists with others and allow collaborative editing
- **Privacy Controls** - Create public or private wishlists
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI** - Beautiful interface built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 15.2.8 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript
- **Database**: MongoDB
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui (Radix UI)
- **Authentication**: JWT-based magic links
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun
- MongoDB database (local or cloud instance like MongoDB Atlas)
- SMTP server for sending emails (e.g., SendGrid, Mailgun, or your own SMTP server)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/xyberty/deseo.git
cd deseo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory copying from `.env.example` and setting proper values.

Consider removing Google Analytics calls if analytics is not required.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB` | No | Database name (defaults to 'deseo') |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP server port (typically 587 or 465) |
| `SMTP_SECURE` | Yes | Use TLS/SSL ('true' for port 465, 'false' for port 587) |
| `SMTP_USER` | Yes | SMTP authentication username |
| `SMTP_PASS` | Yes | SMTP authentication password |
| `EMAIL_FROM_NAME` | Yes | Display name for sent emails |
| `EMAIL_FROM_ADDRESS` | Yes | Email address for sent emails |
| `NEXT_PUBLIC_BASE_URL` | No | Base URL for the application (auto-detected in dev) |

### Generating JWT Secret

You can generate a secure JWT secret using:
```bash
openssl rand -base64 32
```

## Deployment

### Vercel (Recommended)

Deseo is **Vercel-ready** and can be deployed with minimal configuration:

1. Push your code to GitHub, GitLab, or Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy!

Vercel will automatically:
- Detect Next.js
- Run the build command
- Optimize the application
- Provide HTTPS and CDN

### Other Platforms

Deseo can be deployed to any platform that supports Next.js:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Make sure to set all required environment variables in your hosting platform's configuration.

### Environment Variables for Production

When deploying, ensure all environment variables are set in your hosting platform. For Vercel:
- Go to your project settings
- Navigate to "Environment Variables"
- Add all variables from your env file

**Important**: Never commit `.env.local` or `.env` to version control. It's already included in `.gitignore`.



## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/xyberty/deseo/issues).

---

Made for sharing wishes and making gift-giving easier.
