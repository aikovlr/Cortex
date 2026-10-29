import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

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
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AccessibilityProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
