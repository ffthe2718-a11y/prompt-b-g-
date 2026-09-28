import React, { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Store, Check, ArrowRight, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function BecomePartner() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    phone: "",
    description: "",
    location: "",
    logo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }

    if (!formData.name || !formData.slug) {
      toast.error("Shop name and link slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the shop request
      const shopRef = await addDoc(collection(db, "shops"), {
        ...formData,
        ownerId: user.uid,
        ownerEmail: user.email,
        status: "pending",
        isActive: false,
        isVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Update user profile with pending shop info
      await updateDoc(doc(db, "users", user.uid), {
        shopId: shopRef.id,
        shopSlug: formData.slug,
        // We don't change role yet, only after approval
      });

      toast.success("Application submitted! Our team will review your shop shortly.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error submitting shop request:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setFormData({ ...formData, slug: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
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

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-4 block">
            Partner Program
          </span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            Empower Your <span className="italic text-primary font-serif">Craft</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join the Aurelia Luxe network. Get a dedicated storefront, professional booking tools, and grow your clientele.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1 uppercase tracking-wider">Dedicated Storefront</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Your own branded page with your services, gallery, and availability.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1 uppercase tracking-wider">Trusted Ecosystem</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Benefit from our platform's reputation and premium marketing reach.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1 uppercase tracking-wider">Instant Onboarding</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Simple setup process with easy-to-use barber-centric management tools.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-xs italic text-primary/80 leading-relaxed">
                "Since joining Aurelia, my boutique shop's bookings increased by 40%. The platform handles the tech so I can focus on my clients."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">— Arjun M., Signature Grooming</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-light">Shop Registration</CardTitle>
                <CardDescription>Tell us about your business to get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Shop Name</Label>
                    <Input 
                      placeholder="e.g. Royal Cuts Studio"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Store ID / URL Slug</Label>
                    <div className="flex items-center">
                      <span className="bg-zinc-900 border border-r-0 border-border rounded-l-md px-3 h-10 flex items-center text-[10px] text-muted-foreground tracking-tighter">
                        aurelialuxe.com/shop/
                      </span>
                      <Input 
                        placeholder="royal-cuts"
                        value={formData.slug}
                        onChange={handleSlugChange}
                        className="bg-background border-border rounded-l-none"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">This will be your permanent shop link.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">Location</Label>
                      <Input 
                        placeholder="e.g. HSR Layout, Bangalore"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                      <Input 
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-background border-border"
                        type="tel"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Shop Description</Label>
                    <Textarea 
                      placeholder="Tell potential clients what makes your shop unique..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-background border-border min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Shop Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-zinc-900 border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {formData.logo ? (
                          <img src={formData.logo} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-6 w-6 text-zinc-700" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoChange}
                          className="hidden" 
                          id="become-logo-upload"
                        />
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm"
                          className="border-border hover:bg-zinc-900 h-9"
                        >
                          <label htmlFor="become-logo-upload" className="cursor-pointer flex items-center gap-2">
                            <Upload className="h-3 w-3" />
                            {formData.logo ? "Change" : "Upload"}
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-[0.2em] py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
