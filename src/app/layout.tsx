import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Snake Game | Play With Authentication",
  description: "A modern Snake game with user authentication. Sign in to play and track your high scores!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex justify-between items-center p-4 h-16 border-b bg-white shadow-sm">
            <div className="text-xl font-bold text-emerald-600">🐍 Snake Game</div>
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton>
                  <button className="px-4 py-2 rounded-md border border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="px-4 py-2 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-10 h-10"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </header>
          {children}
          <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t mt-auto">
            &copy; {new Date().getFullYear()} Snake Game | A game that requires authentication to play
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
