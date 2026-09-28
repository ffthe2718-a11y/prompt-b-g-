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
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE_TEMPLATE);
    const whatsappUrl = `https://wa.me/${SALON_WHATSAPP.replace(/\+/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={cn(
        "flex items-center gap-2 rounded bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors font-bold uppercase tracking-widest text-xs py-6 px-8",
        className
      )}
    >
      <MessageCircle className="h-5 w-5" />
      {text}
    </Button>
  );
}
