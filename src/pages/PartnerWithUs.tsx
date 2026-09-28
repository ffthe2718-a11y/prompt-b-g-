import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, ChevronLeft, Store, MapPin, List, Globe, User, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 'personal', title: 'Personal Details', icon: User },
  { id: 'shop', title: 'Shop Info', icon: Store },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'services', title: 'Services', icon: List },
];

export default function PartnerWithUs() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    ownerName: user?.displayName || "",
    phone: "",
    shopName: "",
    slug: "",
    description: "",
    location: "",
    logo: "",
    upiId: "",
    services: [
      { name: "Mens Haircut", price: "₹500", description: "Standard professional haircut" },
      { name: "Beard Styling", price: "₹200", description: "Beard trim and shape" }
    ]
  });

  if (authLoading) return null;
  if (!user) return <Navigate to="/" />;

  // If user already has a shop, redirect to dashboard
  if (profile?.shopId) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Store className="h-16 w-16 text-primary mb-6" />
        <h2 className="text-3xl font-light mb-4 text-white">Already Partnered!</h2>
        <p className="text-zinc-500 mb-8 max-w-md italic">You have already registered your shop. Head to your dashboard to manage it.</p>
        <Button asChild className="bg-primary text-black hover:bg-primary/90">
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    );
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleShopNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, shopName: name, slug });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        toast.error("Logo size should be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create the shop document
      const shopId = `shop-${Date.now()}`;
      const shopData = {
        ownerId: user.uid,
        name: formData.shopName,
        phone: formData.phone,
        slug: formData.slug || formData.shopName.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        location: formData.location,
        logo: formData.logo,
        upiId: formData.upiId,
        templateId: "modern",
        status: "draft",
        isActive: false, // Pending master admin approval
        isVerified: false,
        sections: [
          { id: 'hero', title: 'Hero Section', enabled: true, order: 0 },
          { id: 'about', title: 'About Us', enabled: true, order: 1 },
          { id: 'services', title: 'Services', enabled: true, order: 2 },
          { id: 'gallery', title: 'Gallery', enabled: true, order: 3 },
        ],
        content: {
          heroTitle: `Welcome to ${formData.shopName}`,
          heroSubtitle: formData.description || "Premium styling and grooming services.",
          heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070",
          aboutText: formData.description || "We provide top-notch styling services for the modern gentleman.",
          aboutImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074",
          services: formData.services
        },
        theme: {
          primaryColor: "#EAB308"
        },
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "shops", shopId), shopData);

      // 2. Update user profile
      await updateDoc(doc(db, "users", user.uid), {
        role: "Owner",
        shopId: shopId,
        slug: shopData.slug
      });

      toast.success("Registration Successful! Your shop is created and pending approval.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error registering shop:", error);
      toast.error("Failed to register shop. Please try again.");
      handleFirestoreError(error, OperationType.CREATE, "shops");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ActiveIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary text-black uppercase tracking-widest text-[10px] py-1 px-3">Partner With Us</Badge>
          <h1 className="text-5xl font-light tracking-tighter sm:text-6xl mb-4">
            GROW YOUR <span className="italic text-primary">BUSINESS</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light italic">Join Aurelia Luxe's network of premium salons and barbers.</p>
        </div>

        {/* Horizontal Progress */}
        <div className="flex justify-between items-center mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-800 -translate-y-1/2 z-0" />
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            
            return (
              <div key={idx} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isActive ? "bg-primary border-primary text-black scale-110 shadow-[0_0_20px_rgba(234,179,8,0.3)]" : 
                  isCompleted ? "bg-black border-primary text-primary" : "bg-black border-zinc-800 text-zinc-600"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  "mt-3 text-[10px] uppercase tracking-widest font-bold",
                  isActive ? "text-primary" : isCompleted ? "text-zinc-400" : "text-zinc-700"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
          <CardHeader className="border-b border-zinc-900 bg-black/50 py-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                <ActiveIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-light">{STEPS[currentStep].title}</CardTitle>
                <CardDescription className="text-zinc-500 italic">Please fill in the details correctly.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {currentStep === 0 && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-zinc-500 uppercase tracking-widest text-[10px]">Owner Name</Label>
                      <Input 
                        value={formData.ownerName} 
                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                        placeholder="John Doe"
                        className="bg-black border-zinc-900 focus:border-primary py-6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-500 uppercase tracking-widest text-[10px]">Primary Phone Number</Label>
                      <Input 
                        value={formData.phone} 
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="bg-black border-zinc-900 focus:border-primary py-6"
                        type="tel"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-zinc-500 uppercase tracking-widest text-[10px]">UPI ID (for Direct Payments)</Label>
                      <Input 
                        value={formData.upiId} 
                        onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                        placeholder="yourname@upi"
                        className="bg-black border-zinc-900 focus:border-primary py-6"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-zinc-500 uppercase tracking-widest text-[10px]">Shop Name</Label>
                        <Input 
                          value={formData.shopName} 
                          onChange={e => handleShopNameChange(e.target.value)}
                          placeholder="Royal Barber Studio"
                          className="bg-black border-zinc-900 focus:border-primary py-6"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-500 uppercase tracking-widest text-[10px]">Public URL Slug</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-700 text-sm">/shop/</span>
                          <Input 
                            value={formData.slug} 
                            readOnly
                            className="bg-black border-zinc-900 opacity-50 cursor-not-allowed py-6"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-500 uppercase tracking-widest text-[10px]">Short Description</Label>
                      <Textarea 
                        value={formData.description} 
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Premium grooming for the modern gentleman..."
                        className="bg-black border-zinc-900 focus:border-primary min-h-[120px]"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-zinc-500 uppercase tracking-widest text-[10px]">Shop Logo (Optional)</Label>
                      <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-lg bg-zinc-900 border border-zinc-900 border-dashed flex items-center justify-center overflow-hidden shrink-0">
                          {formData.logo ? (
                            <img src={formData.logo} alt="Logo Preview" className="h-full w-full object-cover" />
                          ) : (
                            <Store className="h-8 w-8 text-zinc-700" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoChange}
                            className="hidden" 
                            id="logo-upload"
                          />
                          <Button 
                            asChild 
                            variant="outline" 
                            className="border-zinc-800 hover:bg-zinc-900 text-xs uppercase tracking-widest"
                          >
                            <label htmlFor="logo-upload" className="cursor-pointer flex items-center gap-2">
                              <Upload className="h-3 w-3" />
                              {formData.logo ? "Change Logo" : "Upload Logo"}
                            </label>
                          </Button>
                          <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-wide">Recommended: Square PNG/JPG, Max 1MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <Label className="text-zinc-500 uppercase tracking-widest text-[10px]">Shop Location (Full Address)</Label>
                      <Input 
                        value={formData.location} 
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Bandra West, Mumbai, Maharashtra"
                        className="bg-black border-zinc-900 focus:border-primary py-6"
                      />
                    </div>
                    <div className="bg-zinc-900/30 p-8 rounded-lg border border-zinc-900 border-dashed text-center">
                      <Globe className="h-8 w-8 text-zinc-700 mx-auto mb-4" />
                      <p className="text-sm text-zinc-500 italic max-w-sm mx-auto">This address will be displayed on your mini-website to help customers find you.</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      {formData.services.map((service, idx) => (
                        <div key={idx} className="flex flex-wrap items-center justify-between p-4 rounded bg-black border border-zinc-900">
                          <div>
                            <p className="font-bold">{service.name}</p>
                            <p className="text-xs text-zinc-500 italic">{service.description}</p>
                          </div>
                          <Badge variant="outline" className="border-primary/50 text-primary">{service.price}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                      <p className="text-xs text-primary uppercase tracking-[0.2em] font-bold mb-2">Final Step</p>
                      <p className="text-sm text-zinc-400 leading-relaxed italic">By clicking "Register Shop", you agree to our partner terms. Your shop will be created instantly as a draft and sent for verification.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <div className="p-8 border-t border-zinc-900 bg-black/50 flex justify-between">
            <Button 
              variant="ghost" 
              onClick={prevStep} 
              disabled={currentStep === 0 || isSubmitting}
              className="text-zinc-500 hover:text-white"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {currentStep === STEPS.length - 1 ? (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !formData.shopName || !formData.location}
                className="bg-primary text-black hover:bg-primary/90 min-w-[150px]"
              >
                {isSubmitting ? "Registering..." : "Register Shop"}
                {!isSubmitting && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </Button>
            ) : (
              <Button 
                onClick={nextStep} 
                disabled={currentStep === 1 && !formData.shopName}
                className="bg-primary text-black hover:bg-primary/90"
              >
                Next Step
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
