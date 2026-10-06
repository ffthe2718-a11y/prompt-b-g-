import React from "react";
import { MessageCircle } from "lucide-react";
import { SALON_WHATSAPP, WHATSAPP_MESSAGE_TEMPLATE } from "@/constants";

export default function FloatingWhatsAppButton() {
  const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE_TEMPLATE);
  const whatsappUrl = `https://wa.me/${SALON_WHATSAPP.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;

  return (
    <aside aria-label="WhatsApp quick chat" className="fixed bottom-20 left-4 md:bottom-8 md:left-8 z-30 pb-safe">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center h-11 w-11 md:h-12 md:w-12 rounded-full bg-[#25D366] text-white hover:bg-[#128C7E] shadow-2xl shadow-emerald-950/80 border border-emerald-400/30 transition-all duration-300 hover:scale-110 active:scale-95 group"
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-5 w-5 md:h-6 md:w-6 fill-current" />
        <span className="sr-only">Chat on WhatsApp</span>
      </a>
    </aside>
  );
}
