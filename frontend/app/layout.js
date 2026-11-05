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
  description: 'VoloLeads provides managed real estate cold callers, acquisition VAs, seller lead generation and workflow automation for wholesalers, investors and agents.',
  keywords: ['real estate cold callers', 'cold calling VA', 'real estate virtual assistant', 'acquisition VA', 'real estate wholesaling', 'wholesaling cold calling', 'real estate acquisitions', 'motivated seller leads', 'real estate lead generation', 'skip tracing', 'real estate automation', 'real estate workflows', 'AI workflows for real estate', 'GoHighLevel CRM setup', 'off-market deals', 'real estate investors', 'real estate agents'],
  applicationName: 'VoloLeads',
  category: 'Real estate services',
  // Original site icon (png/logo.webp), as before the rebrand.
  icons: {
    icon: '/legacy-assets/png/logo.webp',
    apple: '/legacy-assets/png/logo.webp'
  }
};

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.vololeads.com/#organization',
  name: 'VoloLeads',
  url: 'https://www.vololeads.com',
  logo: 'https://www.vololeads.com/legacy-assets/png/logo.webp',
  description: 'VoloLeads builds managed seller acquisition teams for real estate wholesalers, investors and agents: trained cold callers and acquisition VAs, skip-traced seller lead generation, CRM setup, comps and AI workflow automation.',
  email: 'syed@vololeads.com',
  areaServed: { '@type': 'Country', name: 'United States' },
  knowsAbout: ['Real estate cold calling', 'Real estate wholesaling', 'Real estate acquisitions', 'Motivated seller lead generation', 'Skip tracing', 'Virtual assistants for real estate', 'Real estate CRM setup', 'Real estate workflow automation', 'TCPA and Do Not Call compliance', 'Listing appointment setting'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: 'syed@vololeads.com', areaServed: 'US', availableLanguage: ['English'] },
  sameAs: [
    'https://www.trustpilot.com/review/vololeads.com',
    'https://www.linkedin.com/company/vololeads',
    'https://www.facebook.com/vololeads',
    'https://www.instagram.com/vololeads',
    'https://x.com/vololeads'
  ]
};

const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.vololeads.com/#website',
  name: 'VoloLeads',
  url: 'https://www.vololeads.com',
  description: 'Real estate cold callers, acquisition VAs and workflow automation for wholesalers, investors and agents.',
  publisher: { '@id': 'https://www.vololeads.com/#organization' },
  inLanguage: 'en-US'
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, '\\u003c') }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
