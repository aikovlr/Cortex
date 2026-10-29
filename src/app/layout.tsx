import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cortex — Gerenciador de Tarefas e Equipes',
  description: 'Sistema transacional moderno para gerenciamento de tarefas pessoais, administrativas e colaborativas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={poppins.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var size = localStorage.getItem('cortex_font_size');
                  if (size) {
                    document.documentElement.setAttribute('data-font-size', size);
                    document.documentElement.style.fontSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px';
                  }
                  var hc = localStorage.getItem('cortex_high_contrast');
                  if (hc === 'true') {
                    document.documentElement.classList.add('high-contrast');
                    document.documentElement.setAttribute('data-high-contrast', 'true');
                  }
                  var theme = localStorage.getItem('cortex_theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AccessibilityProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>{children}</ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
