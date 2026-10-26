import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { ThemeToggle } from "@/components/theme-toggle";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// ... metadata & RootLayout structure ...
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}