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
  // Original site icon (png/logo.webp), as before the rebrand.
  icons: {
    icon: '/legacy-assets/png/logo.webp',
    apple: '/legacy-assets/png/logo.webp'
  }
};

const themeBootstrap = `
  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem('dark-mode');
    if (savedTheme === null && localStorage.getItem('darkMode') === 'true') {
      savedTheme = 'true';
    }
  } catch (error) {}
  // Apply the override or device theme before first paint, even when storage is unavailable.
  var useDark = savedTheme === 'true' || (savedTheme !== 'false' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (useDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }
  try {
    // Hide a dismissed announcement bar before first paint (no flash, no layout jump).
    if (localStorage.getItem('vl-announcement-dismissed') === '1') {
      document.documentElement.classList.add('announcement-dismissed');
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
