import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { ToastProvider } from '@/components/shared/ToastContext';

export const metadata: Metadata = {
  title: 'CBT Psikometri SMK & Analisis Hasil AI',
  description: 'Sistem CBT Tes Psikometri SMK lengkap dengan anti-curang, token berputar, manajemen soal & siswa, serta analisis hasil otomatis bertenaga AI Gemini.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
