import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Восстановление старых семейных фото",
  description: "Загрузите старую фотографию, улучшите качество и скачайте готовый результат."
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
