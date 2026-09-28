import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, signInWithGoogle, db } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, Lock, User, Scissors } from "lucide-react";

interface AuthModalProps {
  trigger?: React.ReactNode;
  defaultTab?: "login" | "signup";
}

export default function AuthModal({ trigger, defaultTab = "login" }: AuthModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Successfully signed in with Google!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Successfully signed in!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName });
      
      // Explicitly create/update the profile doc to include displayName
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        role: 'User',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success("Account created successfully!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Sign In</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-background border-border p-0 overflow-hidden">
        <div className="relative h-32 bg-primary/10 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20 grayscale pointer-events-none">
             <img 
               src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800" 
               alt="Background" 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-background border border-primary flex items-center justify-center mb-2 shadow-xl">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary">Aurelia Luxe</span>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/30 border-b border-border">
            <TabsTrigger value="login" className="data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all uppercase text-[10px] tracking-widest font-bold">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all uppercase text-[10px] tracking-widest font-bold">Sign Up</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="login" className="m-0 space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 border-border bg-card/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="login-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 border-border bg-card/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs py-6"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                type="button" 
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full border-border hover:bg-card/50 font-bold uppercase tracking-widest text-xs py-6 flex items-center justify-center gap-2"
              >
                <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />
                Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="m-0 space-y-4">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="signup-name" 
                      placeholder="John Doe" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="pl-10 border-border bg-card/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 border-border bg-card/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 border-border bg-card/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs py-6"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
                </div>
              </div>

              <div className="text-center">
                <Button 
                   variant="link" 
                   className="text-[10px] uppercase tracking-widest text-primary font-bold p-0 h-auto"
                   onClick={() => {
                     // Note: Normally we'd use a prop to switch tabs, but for simplicity:
                     const tabs = document.querySelectorAll('[role="tab"]');
                     (tabs[0] as HTMLElement).click();
                   }}
                >
                  Back to Login
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Re-using Scissors icon from elsewhere if possible or defining it here for independence
