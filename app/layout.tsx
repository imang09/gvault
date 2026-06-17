import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "EroArchive",
  description: "EROLABS Coupon & Game Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
