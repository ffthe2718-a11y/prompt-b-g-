import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { SALON_WHATSAPP, WHATSAPP_MESSAGE_TEMPLATE } from "@/constants";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  text?: string;
}

export default function WhatsAppButton({ 
  className, 
  variant = "default", 
  size = "lg",
  text = "Book via WhatsApp"
}: WhatsAppButtonProps) {
  const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE_TEMPLATE);
  const whatsappUrl = `https://wa.me/${SALON_WHATSAPP.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(
        "flex items-center gap-2 rounded bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors font-bold uppercase tracking-widest text-xs py-6 px-8 cursor-pointer shadow-lg",
        className
      )}
    >
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-5 w-5" />
        <span>{text}</span>
      </a>
    </Button>
  );
}
