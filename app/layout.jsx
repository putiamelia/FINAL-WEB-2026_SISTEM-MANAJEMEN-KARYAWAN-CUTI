import './globals.css';

export const metadata = {
  title: 'e-Cuti Karyawan | Bank Nusantara',
  description: 'Sistem Manajemen Cuti Karyawan BNS Bank Nusantara',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/assets/logo-bns.png" />
      </head>
      <body className="min-h-screen bg-[#F1F3F6] text-[#1B2430]">
        {children}
      </body>
    </html>
  );
}
