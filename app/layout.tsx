import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider} from "@clerk/nextjs";


export const metadata: Metadata = {
  title: "My App",
  description: "Created with Next.js",
};

import Providers from "@/components/providers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`antialiased`}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider> );
}
