import './globals.css';

export const metadata = {
  metadataBase: new URL('https://www.vololeads.com'),
  openGraph: {
    siteName: 'VoloLeads',
    type: 'website',
    images: [{ url: '/legacy-assets/png/logo/og-image.png', width: 1200, height: 630, alt: 'VoloLeads: Fully Managed Seller Acquisition Teams.' }]
  },
  twitter: { card: 'summary_large_image', images: ['/legacy-assets/png/logo/og-image.png'] },
  title: 'VoloLeads',
  description: 'VoloLeads provides trained acquisition specialists, daily QA, and executive reporting for real estate teams.',
  icons: {
    icon: [
      { url: '/legacy-assets/png/logo/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/legacy-assets/png/logo/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/legacy-assets/png/logo/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: { url: '/legacy-assets/png/logo/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
  }
};

const themeBootstrap = `
  try {
    var savedTheme = localStorage.getItem('dark-mode');
    if (savedTheme === null && localStorage.getItem('darkMode') === 'true') {
      localStorage.setItem('dark-mode', 'true');
      savedTheme = 'true';
    }
    if (savedTheme === 'true') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  } catch (error) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f8fafc" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
