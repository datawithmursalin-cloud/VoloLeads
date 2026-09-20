import './globals.css';

export const metadata = {
  title: 'VoloLeads',
  description: 'VoloLeads provides trained acquisition specialists, daily QA, and executive reporting for real estate teams.',
  icons: {
    icon: '/legacy-assets/png/logo.webp',
    apple: '/legacy-assets/png/logo.webp'
  }
};

const themeBootstrap = `
  try {
    var savedTheme = localStorage.getItem('dark-mode');
    if (savedTheme === null && localStorage.getItem('darkMode') === 'true') {
      localStorage.setItem('dark-mode', 'true');
      savedTheme = 'true';
    }
    var isDark = savedTheme === 'true';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
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
