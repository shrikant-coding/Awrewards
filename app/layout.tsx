import '../styles/globals.css';
import NavBar from '../components/NavBar';
import PwaInstaller from '../components/PwaInstaller';
import { ThemeProvider } from '../components/ThemeProvider';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'awrewards',
  description: 'Collect points, complete challenges, and unlock exclusive gift cards. Your journey to rewards starts here!'
};

export default function RootLayout({ children }:{children:React.ReactNode}){
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F172A" />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <div className="container">
            <NavBar />
            <main className="mt-8">{children}</main>
          </div>
          <PwaInstaller />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}