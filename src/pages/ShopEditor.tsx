import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Layout, Save, Eye, Globe, Settings, Image as ImageIcon, List, MoveUp, MoveDown, CheckCircle2, Circle, Play, Info, MapPin, Phone, Mail, Instagram, Facebook, Twitter, CreditCard, Crosshair, Loader2, Users, Plus, Trash2, Scissors, Sparkles, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import ShopLanding from "@/pages/ShopLanding";
import { Navigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/useLocation";
import { StylistMember, StylistPortfolioItem, DEFAULT_STYLISTS } from "@/types/stylist";

interface ShopSection {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

interface ShopData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  upiId?: string;
  instagramHandle?: string;
  facebookHandle?: string;
  twitterHandle?: string;
  templateId: string;
  status: 'draft' | 'published';
  sections: ShopSection[];
  content: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroImage?: string;
    heroVideo?: string;
    aboutText?: string;
    aboutImage?: string;
    services?: { name: string; price: string; description?: string }[];
    stylists?: StylistMember[];
  };
  theme: {
    primaryColor?: string;
  };
}

export default function ShopEditor() {
  const { user, loading } = useAuth();
  const { getLocation, coords, loading: detecting, error: detectError } = useLocation();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc)');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('Logo file size must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && shop) {
        setShop({ ...shop, logo: event.target.result as string });
        toast.success('Logo uploaded and ready to save!');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (coords && shop) {
      setShop({ ...shop, latitude: coords.latitude, longitude: coords.longitude });
      toast.success("Location coordinates updated!");
    }
  }, [coords]);

  useEffect(() => {
    if (detectError) {
      toast.error(detectError);
    }
  }, [detectError]);

  const defaultSections: ShopSection[] = [
    { id: 'hero', title: 'Hero Section', enabled: true, order: 0 },
    { id: 'about', title: 'About Us', enabled: true, order: 1 },
    { id: 'services', title: 'Services', enabled: true, order: 2 },
    { id: 'stylists', title: 'Meet Your Stylist', enabled: true, order: 3 },
    { id: 'reviews', title: 'Client Reviews & Ratings', enabled: true, order: 4 },
    { id: 'instagram', title: 'Instagram Feed', enabled: true, order: 5 },
    { id: 'gallery', title: 'Gallery', enabled: true, order: 6 },
  ];

  useEffect(() => {
    const fetchShop = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "shops"), where("ownerId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0];
          const data = docData.data() as ShopData;
          // Ensure sections exist for older shops
          if (!data.sections) {
            data.sections = defaultSections;
          }
          setShop({ id: docData.id, ...data } as ShopData);
        } else {
          // Default initial shop data
          setShop({
            name: "Luxe Glow Studio",
            slug: user.displayName?.toLowerCase().replace(/\s+/g, "-") || "my-shop",
            description: "Premium grooming and traditional Indian beauty rituals.",
            location: "",
            phone: "",
            email: user.email || "",
            templateId: "modern",
            status: 'draft',
            sections: defaultSections,
            content: {
              heroTitle: "Master Your Style",
              heroSubtitle: "Expert cuts, traditional champi, modern grooming.",
              heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070",
              aboutText: "We are a team of passionate stylists dedicated to making you look and feel your best with a touch of luxury.",
              aboutImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074",
              services: [
                { name: "Signature Haircut", price: "₹1,500", description: "Precision cut tailored to your head shape and style preference." },
                { name: "Traditional Champi", price: "₹800", description: "Relaxing Ayurvedic head massage with herbal oils." }
              ]
            },
            theme: {
              primaryColor: "#EAB308"
            }
          });
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchShop();
  }, [user]);

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!user || !shop) return;
    setIsSaving(true);
    try {
      const shopToSave = {
        ...shop,
        status,
        updatedAt: new Date().toISOString()
      };

      if (shop.id) {
        await updateDoc(doc(db, "shops", shop.id), shopToSave);
        // Also update slug in user profile in case it changed
        await updateDoc(doc(db, "users", user.uid), {
          slug: shop.slug
        });
      } else {
        const newShopRef = doc(collection(db, "shops"));
        await setDoc(newShopRef, {
          ...shopToSave,
          ownerId: user.uid,
          createdAt: new Date().toISOString()
        });
        setShop({ ...shopToSave, id: newShopRef.id });
        
        // Update user role to Owner if not already
        await updateDoc(doc(db, "users", user.uid), {
          role: "Owner",
          shopId: newShopRef.id,
          slug: shop.slug
        });
      }
      setShop(prev => prev ? { ...prev, status } : null);
      toast.success(status === 'published' ? "Shop published successfully!" : "Draft saved successfully!");
    } catch (error) {
      toast.error("Failed to save shop settings.");
      handleFirestoreError(error, OperationType.UPDATE, shop.id ? `shops/${shop.id}` : "shops");
    } finally {
      setIsSaving(false);
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!shop) return;
    const newSections = [...shop.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    
    // Update order values
    const updatedSections = newSections.map((s, i) => ({ ...s, order: i }));
    setShop({ ...shop, sections: updatedSections });
  };

  const toggleSection = (id: string) => {
    if (!shop) return;
    const updatedSections = shop.sections.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setShop({ ...shop, sections: updatedSections });
  };

  if (loading || isInitialLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-primary">Loading Editor...</div>;
  }

  if (!user) return <Navigate to="/" />;

  if (!shop) return null;

  if (isPreviewMode) {
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-[100] flex gap-2">
          <Button 
            onClick={() => setIsPreviewMode(false)}
            className="bg-primary text-black hover:bg-primary/90 shadow-2xl"
          >
            <Settings className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSave('published')}
            className="bg-black/80 backdrop-blur border-zinc-800 text-white hover:bg-zinc-900"
          >
            <Globe className="mr-2 h-4 w-4" />
            Publish Now
          </Button>
        </div>
        <ShopLanding previewData={shop} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black uppercase tracking-tighter italic">Shop Editor</h1>
              <Badge variant="outline" className={cn(
                "uppercase text-[10px] tracking-widest",
                shop.status === 'published' ? "border-green-500/50 text-green-500 bg-green-500/5" : "border-yellow-500/50 text-yellow-500 bg-yellow-500/5"
              )}>
                {shop.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">Customize your mini-website and manage your online presence.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="border-zinc-800 hover:bg-zinc-900"
            >
              <Eye className="mr-2 h-4 w-4" />
              {isPreviewMode ? "Exit Preview" : "Preview"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSave('draft')} 
              disabled={isSaving}
              className="border-zinc-800 hover:bg-zinc-900"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSave('published')} 
              disabled={isSaving} 
              className="bg-primary text-black hover:bg-primary/90"
            >
              <Globe className="mr-2 h-4 w-4" />
              {isSaving ? "Publishing..." : "Publish Live"}
            </Button>
          </div>
        </header>

        <Tabs defaultValue="general" className="space-y-8">
          <TabsList className="bg-zinc-950 border border-zinc-900 p-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Settings className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="sections" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Layout className="mr-2 h-4 w-4" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="hero" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <ImageIcon className="mr-2 h-4 w-4" />
              Hero
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Globe className="mr-2 h-4 w-4" />
              About
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <List className="mr-2 h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="stylists" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Users className="mr-2 h-4 w-4" />
              Stylists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections">
            <Card className="bg-zinc-950 border-zinc-900 text-white">
              <CardHeader>
                <CardTitle className="uppercase tracking-widest text-sm">Manage Sections</CardTitle>
                <CardDescription className="text-zinc-500">Enable, disable, and reorder your website sections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {shop.sections.sort((a, b) => a.order - b.order).map((section, idx) => (
                  <div key={section.id} className="flex items-center justify-between p-4 rounded-lg border border-zinc-900 bg-black/50">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon-xs" 
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="h-6 w-6 hover:text-primary"
                        >
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-xs" 
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === shop.sections.length - 1}
                          className="h-6 w-6 hover:text-primary"
                        >
                          <MoveDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        "gap-2 text-xs uppercase tracking-widest",
                        section.enabled ? "text-primary" : "text-zinc-600"
                      )}
                    >
                      {section.enabled ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      {section.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card className="bg-zinc-950 border-zinc-900 text-white shadow-2xl">
              <CardHeader className="border-b border-zinc-900 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      Major Settings
                    </CardTitle>
                    <CardDescription className="text-zinc-500 mt-1">Configure your shop's core identity and contact details.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[9px] tracking-widest px-3 py-1">
                    General Tab
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-10 pt-8 pb-12">
                <div className="flex flex-col md:flex-row gap-8 items-start pb-10 border-b border-zinc-900">
                  <div className="space-y-4 flex flex-col items-center">
                    <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 w-full text-center md:text-left">Shop Logo</Label>
                    <div className="relative group cursor-pointer">
                      <div className="h-32 w-32 rounded-full border-2 border-dashed border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-primary/5">
                        {shop.logo ? (
                          <img src={shop.logo} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-zinc-700 group-hover:text-primary transition-colors" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {shop.logo && (
                        <div className="absolute -bottom-2 -right-2 bg-black border border-zinc-800 p-1 rounded-full shadow-lg">
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            onClick={() => setShop({ ...shop, logo: undefined })}
                            className="h-6 w-6 text-zinc-500 hover:text-destructive"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 pt-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">Visual Identity</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
                      Your logo will appear on the navigation bar, marketplace cards, and booking forms. 
                      Use a high-quality square image (max 1MB).
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[10px] uppercase tracking-widest border-zinc-800 hover:bg-zinc-900 pointer-events-none opacity-50"
                      >
                        Auto-Resize: Active
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Shop Name</Label>
                    <Input 
                      id="name" 
                      value={shop.name} 
                      onChange={(e) => setShop({ ...shop, name: e.target.value })}
                      className="bg-black border-zinc-800 focus:border-primary h-14 text-lg font-bold"
                      placeholder="e.g. Aurelia Luxe Studio"
                    />
                    <p className="text-[9px] text-zinc-600 italic">This is your brand name displayed everywhere.</p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="slug" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Public Slug (URL)</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 h-14 rounded-md text-zinc-500 text-xs">
                        <Globe className="h-3 w-3" />
                        <span>/shop/</span>
                      </div>
                      <Input 
                        id="slug" 
                        value={shop.slug} 
                        onChange={(e) => setShop({ ...shop, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                        className="bg-black border-zinc-800 focus:border-primary h-14 font-mono text-sm"
                        placeholder="aurelia-luxe"
                      />
                    </div>
                    <p className="text-[9px] text-zinc-600 italic">Unique identifiers for your website address.</p>
                  </div>
                </div>

                <div className="pt-10 border-t border-zinc-900">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-8 flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Contact & Reach
                  </h4>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                        <Input 
                          id="email" 
                          type="email"
                          value={shop.email || ""} 
                          onChange={(e) => setShop({ ...shop, email: e.target.value })}
                          placeholder="hello@yourshop.com"
                          className="bg-black border-zinc-800 focus:border-primary h-14 pl-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                        <Input 
                          id="phone" 
                          value={shop.phone || ""} 
                          onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="bg-black border-zinc-800 focus:border-primary h-14 pl-12"
                          type="tel"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-zinc-900">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-8 flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Physical Location
                  </h4>
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Store Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-5 h-4 w-4 text-zinc-600" />
                      <Textarea 
                        id="location" 
                        value={shop.location || ""} 
                        onChange={(e) => setShop({ ...shop, location: e.target.value })}
                        placeholder="e.g. 123 Grooming St, Style City, India"
                        className="bg-black border-zinc-800 focus:border-primary min-h-[100px] pl-12 pt-4"
                      />
                    </div>
                    
                    <div className="pt-4 grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest text-zinc-500">Latitude</Label>
                        <Input 
                          type="number"
                          step="any"
                          value={shop.latitude || ""} 
                          onChange={(e) => setShop({ ...shop, latitude: parseFloat(e.target.value) })}
                          className="bg-black/50 border-zinc-800 h-10 text-xs"
                          placeholder="e.g. 19.0760"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest text-zinc-500">Longitude</Label>
                        <Input 
                          type="number"
                          step="any"
                          value={shop.longitude || ""} 
                          onChange={(e) => setShop({ ...shop, longitude: parseFloat(e.target.value) })}
                          className="bg-black/50 border-zinc-800 h-10 text-xs"
                          placeholder="e.g. 72.8777"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => getLocation()}
                      disabled={detecting}
                      className="mt-2 border-primary/20 text-primary hover:bg-primary/10 h-10 rounded-none w-full md:w-auto"
                    >
                      {detecting ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Crosshair className="h-3 w-3 mr-2" />}
                      Detect My Current Location
                    </Button>
                    <p className="text-[8px] text-zinc-600 italic mt-2">Required for "Nearby Discovery" feature. Make sure to be at your physical storefront when clicking detect.</p>
                  </div>
                </div>

                <div className="pt-10 border-t border-zinc-900">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-8 flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Payments & Social
                  </h4>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="upiId" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">UPI ID (Direct Payments)</Label>
                      <Input 
                        id="upiId" 
                        value={shop.upiId || ""} 
                        onChange={(e) => setShop({ ...shop, upiId: e.target.value })}
                        placeholder="yourname@upi"
                        className="bg-black border-zinc-800 focus:border-primary h-14"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="instagram" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Instagram</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center bg-zinc-900 border border-zinc-800 h-14 w-12 rounded-md text-zinc-500">@</div>
                          <Input 
                            id="instagram" 
                            value={shop.instagramHandle || ""} 
                            onChange={(e) => setShop({ ...shop, instagramHandle: e.target.value })}
                            placeholder="handle"
                            className="bg-black border-zinc-800 focus:border-primary h-14"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="facebook" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Facebook</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center bg-zinc-900 border border-zinc-800 h-14 w-12 rounded-md text-zinc-500">@</div>
                          <Input 
                            id="facebook" 
                            value={shop.facebookHandle || ""} 
                            onChange={(e) => setShop({ ...shop, facebookHandle: e.target.value })}
                            placeholder="handle"
                            className="bg-black border-zinc-800 focus:border-primary h-14"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="twitter" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Twitter</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center bg-zinc-900 border border-zinc-800 h-14 w-12 rounded-md text-zinc-500">@</div>
                          <Input 
                            id="twitter" 
                            value={shop.twitterHandle || ""} 
                            onChange={(e) => setShop({ ...shop, twitterHandle: e.target.value })}
                            placeholder="handle"
                            className="bg-black border-zinc-800 focus:border-primary h-14"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-zinc-900">
                  <div className="space-y-3">
                    <Label htmlFor="desc" className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Marketplace Description</Label>
                    <Textarea 
                      id="desc" 
                      value={shop.description} 
                      onChange={(e) => setShop({ ...shop, description: e.target.value })}
                      className="bg-black border-zinc-800 focus:border-primary min-h-[140px] pt-4"
                      placeholder="Briefly describe your shop for the marketplace card..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero">
            <Card className="bg-zinc-950 border-zinc-900 text-white">
              <CardHeader>
                <CardTitle className="uppercase tracking-widest text-sm">Hero Section</CardTitle>
                <CardDescription className="text-zinc-500">The first thing visitors see on your page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Main Headline</Label>
                  <Input 
                    id="heroTitle" 
                    value={shop.content.heroTitle} 
                    onChange={(e) => setShop({ ...shop, content: { ...shop.content, heroTitle: e.target.value } })}
                    className="bg-black border-zinc-800 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Sub-headline</Label>
                  <Input 
                    id="heroSubtitle" 
                    value={shop.content.heroSubtitle} 
                    onChange={(e) => setShop({ ...shop, content: { ...shop.content, heroSubtitle: e.target.value } })}
                    className="bg-black border-zinc-800 focus:border-primary"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="heroImage" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Hero Image URL
                    </Label>
                    <Input 
                      id="heroImage" 
                      value={shop.content.heroImage} 
                      onChange={(e) => setShop({ ...shop, content: { ...shop.content, heroImage: e.target.value } })}
                      className="bg-black border-zinc-800 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroVideo" className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Hero Video URL (Optional)
                    </Label>
                    <Input 
                      id="heroVideo" 
                      value={shop.content.heroVideo} 
                      onChange={(e) => setShop({ ...shop, content: { ...shop.content, heroVideo: e.target.value } })}
                      placeholder="Direct link to .mp4 file"
                      className="bg-black border-zinc-800 focus:border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card className="bg-zinc-950 border-zinc-900 text-white">
              <CardHeader>
                <CardTitle className="uppercase tracking-widest text-sm">About Section</CardTitle>
                <CardDescription className="text-zinc-500">Tell your story and connect with customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="aboutText">About Your Shop</Label>
                  <Textarea 
                    id="aboutText" 
                    value={shop.content.aboutText} 
                    onChange={(e) => setShop({ ...shop, content: { ...shop.content, aboutText: e.target.value } })}
                    className="bg-black border-zinc-800 focus:border-primary min-h-[200px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aboutImage" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    About Image URL
                  </Label>
                  <Input 
                    id="aboutImage" 
                    value={shop.content.aboutImage} 
                    onChange={(e) => setShop({ ...shop, content: { ...shop.content, aboutImage: e.target.value } })}
                    className="bg-black border-zinc-800 focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="bg-zinc-950 border-zinc-900 text-white">
              <CardHeader>
                <CardTitle className="uppercase tracking-widest text-sm">Service Menu</CardTitle>
                <CardDescription className="text-zinc-500">List your services and pricing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {shop.content.services?.map((service, idx) => (
                  <div key={idx} className="space-y-4 border-b border-zinc-900 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-7 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Service Name</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help text-zinc-500 hover:text-primary transition-colors">
                                <Info className="h-3.5 w-3.5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-zinc-900 border-zinc-800 text-[11px] p-3 max-w-[250px] shadow-xl">
                              <p className="font-bold mb-1 uppercase tracking-widest text-[9px] text-primary">Service Info</p>
                              <p className="text-zinc-300 leading-relaxed">
                                {service.description || "No description provided yet. Add one below."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input 
                          value={service.name} 
                          onChange={(e) => {
                            const newServices = [...(shop.content.services || [])];
                            newServices[idx].name = e.target.value;
                            setShop({ ...shop, content: { ...shop.content, services: newServices } });
                          }}
                          className="bg-black border-zinc-800 focus:border-primary font-bold"
                          placeholder="e.g. Premium Haircut"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-2">
                        <Label>Price</Label>
                        <Input 
                          value={service.price} 
                          onChange={(e) => {
                            const newServices = [...(shop.content.services || [])];
                            newServices[idx].price = e.target.value;
                            setShop({ ...shop, content: { ...shop.content, services: newServices } });
                          }}
                          className="bg-black border-zinc-800 focus:border-primary"
                          placeholder="e.g. ₹1,500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => {
                            const newServices = shop.content.services?.filter((_, i) => i !== idx);
                            setShop({ ...shop, content: { ...shop.content, services: newServices } });
                          }}
                          className="w-full h-10 uppercase text-[10px] tracking-widest font-bold"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-500 text-[10px] uppercase tracking-widest">Service Description</Label>
                      <Textarea 
                        value={service.description || ""} 
                        onChange={(e) => {
                          const newServices = [...(shop.content.services || [])];
                          newServices[idx].description = e.target.value;
                          setShop({ ...shop, content: { ...shop.content, services: newServices } });
                        }}
                        className="bg-black border-zinc-800 focus:border-primary min-h-[80px] text-sm"
                        placeholder="Briefly describe what this service includes..."
                      />
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const newServices = [...(shop.content.services || []), { name: "", price: "", description: "" }];
                    setShop({ ...shop, content: { ...shop.content, services: newServices } });
                  }}
                  className="w-full border-dashed border-zinc-800 hover:bg-zinc-900 h-12 uppercase text-[10px] tracking-widest font-bold"
                >
                  Add New Service
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stylists">
            <Card className="bg-zinc-950 border-zinc-900 text-white">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="uppercase tracking-widest text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Meet Your Stylist & Staff Team
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Showcase your salon artists with professional bios, experience, specialties, and transformation portfolios.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(!shop.content.stylists || shop.content.stylists.length === 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShop({
                          ...shop,
                          content: {
                            ...shop.content,
                            stylists: DEFAULT_STYLISTS
                          }
                        });
                        toast.success("Loaded Aurelia Luxe master stylist presets!");
                      }}
                      className="border-primary/40 text-primary hover:bg-primary/10 text-xs"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Load Master Team Presets
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      const newStylist: StylistMember = {
                        id: `stylist-${Date.now()}`,
                        name: "",
                        role: "Senior Stylist",
                        experience: "5+ Years Experience",
                        bio: "",
                        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
                        specialties: ["Signature Haircut", "Precision Styling"],
                        rating: 5.0,
                        reviewCount: 1,
                        portfolio: []
                      };
                      const current = shop.content.stylists || [];
                      setShop({
                        ...shop,
                        content: {
                          ...shop.content,
                          stylists: [...current, newStylist]
                        }
                      });
                    }}
                    className="bg-primary text-black hover:bg-primary/90 text-xs uppercase font-bold"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Stylist
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {(!shop.content.stylists || shop.content.stylists.length === 0) ? (
                  <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl p-8 bg-zinc-900/20">
                    <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      No Stylists Configured Yet
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6">
                      By default, the storefront renders curated master stylist profiles. You can add your own salon artists or load preset profiles to customize.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShop({
                            ...shop,
                            content: {
                              ...shop.content,
                              stylists: DEFAULT_STYLISTS
                            }
                          });
                          toast.success("Loaded master stylist team presets!");
                        }}
                        className="border-primary/40 text-primary hover:bg-primary/10 text-xs"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Load Master Team Presets
                      </Button>
                    </div>
                  </div>
                ) : (
                  shop.content.stylists.map((stylist, sIdx) => (
                    <div key={stylist.id || sIdx} className="p-6 rounded-xl border border-zinc-800 bg-black/40 space-y-6">
                      {/* Stylist Card Top */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0">
                            <img 
                              src={stylist.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"} 
                              alt={stylist.name || "Stylist"} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-white tracking-wide">
                              {stylist.name || "Untitled Stylist"}
                            </h4>
                            <p className="text-xs text-primary uppercase font-mono tracking-wider">
                              {stylist.role || "Stylist"} • {stylist.experience || "5+ Years"}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = (shop.content.stylists || []).filter((_, idx) => idx !== sIdx);
                            setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                            toast.success("Stylist removed");
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Remove Stylist
                        </Button>
                      </div>

                      {/* Main Stylist Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Full Name</Label>
                          <Input
                            value={stylist.name}
                            onChange={(e) => {
                              const updated = [...(shop.content.stylists || [])];
                              updated[sIdx].name = e.target.value;
                              setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                            }}
                            placeholder="e.g. Aria Patel"
                            className="bg-black border-zinc-800 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Title / Artistic Role</Label>
                          <Input
                            value={stylist.role}
                            onChange={(e) => {
                              const updated = [...(shop.content.stylists || [])];
                              updated[sIdx].role = e.target.value;
                              setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                            }}
                            placeholder="e.g. Master Colorist & Creative Director"
                            className="bg-black border-zinc-800 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Experience</Label>
                          <Input
                            value={stylist.experience}
                            onChange={(e) => {
                              const updated = [...(shop.content.stylists || [])];
                              updated[sIdx].experience = e.target.value;
                              setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                            }}
                            placeholder="e.g. 10+ Years Experience"
                            className="bg-black border-zinc-800 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Avatar Image URL</Label>
                          <Input
                            value={stylist.avatar}
                            onChange={(e) => {
                              const updated = [...(shop.content.stylists || [])];
                              updated[sIdx].avatar = e.target.value;
                              setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                            }}
                            placeholder="https://images.unsplash.com/..."
                            className="bg-black border-zinc-800 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Instagram Handle (optional)</Label>
                          <Input
                            value={stylist.instagram || ""}
                            onChange={(e) => {
                              const updated = [...(shop.content.stylists || [])];
                              updated[sIdx].instagram = e.target.value.replace(/^@/, '');
                              setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                            }}
                            placeholder="e.g. aria_patel_hair"
                            className="bg-black border-zinc-800 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Specialties (comma-separated)</Label>
                          <Input
                            value={stylist.specialties?.join(", ") || ""}
                            onChange={(e) => {
                              const updated = [...(shop.content.stylists || [])];
                              updated[sIdx].specialties = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                              setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                            }}
                            placeholder="e.g. Dimensional Balayage, Silk Press, Face Framing"
                            className="bg-black border-zinc-800 text-white"
                          />
                        </div>
                      </div>

                      {/* Professional Bio */}
                      <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wider">Professional Bio & Philosophy</Label>
                        <Textarea
                          value={stylist.bio}
                          onChange={(e) => {
                            const updated = [...(shop.content.stylists || [])];
                            updated[sIdx].bio = e.target.value;
                            setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                          }}
                          placeholder="Describe their background, academy training, philosophy, and what clients can expect..."
                          className="bg-black border-zinc-800 text-white min-h-[90px] text-sm"
                        />
                      </div>

                      {/* Portfolio Looks Manager */}
                      <div className="pt-4 border-t border-zinc-900 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs uppercase font-bold tracking-wider text-zinc-300 flex items-center gap-1.5">
                            <Scissors className="h-3.5 w-3.5 text-primary" />
                            Portfolio Looks ({stylist.portfolio?.length || 0})
                          </h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newLook: StylistPortfolioItem = {
                                id: `look-${Date.now()}`,
                                imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800",
                                title: "Signature Transformation",
                                category: "Color & Balayage",
                                description: "Bespoke styling and treatment crafted with premium products."
                              };
                              const updated = [...(shop.content.stylists || [])];
                              updated[sIdx].portfolio = [...(updated[sIdx].portfolio || []), newLook];
                              setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                            }}
                            className="text-[11px] h-8 border-zinc-800 hover:bg-zinc-900 text-primary"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Look
                          </Button>
                        </div>

                        {stylist.portfolio && stylist.portfolio.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {stylist.portfolio.map((look, lIdx) => (
                              <div key={look.id || lIdx} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 space-y-2">
                                <div className="aspect-[4/3] rounded overflow-hidden relative border border-zinc-800 bg-black">
                                  <img 
                                    src={look.imageUrl} 
                                    alt={look.title} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = [...(shop.content.stylists || [])];
                                      updated[sIdx].portfolio = updated[sIdx].portfolio.filter((_, idx) => idx !== lIdx);
                                      setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                                    }}
                                    className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-red-600 text-white rounded p-1 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <Input
                                  value={look.title}
                                  onChange={(e) => {
                                    const updated = [...(shop.content.stylists || [])];
                                    updated[sIdx].portfolio[lIdx].title = e.target.value;
                                    setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                                  }}
                                  placeholder="Look Title"
                                  className="h-7 text-xs bg-black border-zinc-800"
                                />
                                <Input
                                  value={look.imageUrl}
                                  onChange={(e) => {
                                    const updated = [...(shop.content.stylists || [])];
                                    updated[sIdx].portfolio[lIdx].imageUrl = e.target.value;
                                    setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                                  }}
                                  placeholder="Photo URL"
                                  className="h-7 text-[11px] bg-black border-zinc-800"
                                />
                                <select
                                  value={look.category}
                                  onChange={(e) => {
                                    const updated = [...(shop.content.stylists || [])];
                                    updated[sIdx].portfolio[lIdx].category = e.target.value as any;
                                    setShop({ ...shop, content: { ...shop.content, stylists: updated } });
                                  }}
                                  className="w-full h-7 text-xs bg-black border border-zinc-800 rounded px-2 text-zinc-300"
                                >
                                  <option value="Color & Balayage">Color & Balayage</option>
                                  <option value="Cut & Style">Cut & Style</option>
                                  <option value="Men's Grooming">Men's Grooming</option>
                                  <option value="Treatments & Spa">Treatments & Spa</option>
                                  <option value="Bridal">Bridal</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">No portfolio looks added for this stylist yet.</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
