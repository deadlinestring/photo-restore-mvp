import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Реставрация старых фото онлайн",
  description: "Простой MVP сайта для AI-реставрации старых фотографий."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
