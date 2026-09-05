import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "CryptoTrace | Real-Time Forensics & VASP Identification",
  description: "Automated cryptocurrency forensic intelligence platform for fraud-linked VASP identification & ISO/IEC 27037 compliance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#030705] text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-black">
        <Navbar />
        <main className="flex-1 w-full">
          {children}
        </main>
        <footer className="border-t border-emerald-950/60 bg-[#020503] py-6 px-6 text-center text-xs text-slate-500 font-mono">
          CryptoTrace Forensic Intelligence &bull; ISO/IEC 27037:2012 Certified Digital Evidence &bull; FATF Travel Rule Compliant
        </footer>
      </body>
    </html>
  );
}
