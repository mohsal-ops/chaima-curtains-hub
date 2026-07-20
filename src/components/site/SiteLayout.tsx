import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { FloatingCall } from "./FloatingCall";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { TickerBar } from "./TickerBar";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TickerBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingCall />
      <FloatingWhatsApp />
    </div>
  );
}
