/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Gallery from "@/pages/Gallery";
import About from "@/pages/About";
import Book from "@/pages/Book";
import Dashboard from "@/pages/Dashboard";
import AdminMembers from "@/pages/AdminMembers";
import AdminShops from "@/pages/AdminShops";
import PartnerWithUs from "@/pages/PartnerWithUs";
import ShopLanding from "@/pages/ShopLanding";
import ShopEditor from "@/pages/ShopEditor";
import Marketplace from "@/pages/Marketplace";
import ProtectedRoute from "@/components/ProtectedRoute";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route 
            path="/add-customer" 
            element={
              <ProtectedRoute>
                <Book />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminMembers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/shops" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminShops />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/partner" 
            element={
              <ProtectedRoute>
                <PartnerWithUs />
              </ProtectedRoute>
            } 
          />
          <Route path="/shop/:slug" element={<ShopLanding />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route 
            path="/dashboard/shop-editor" 
            element={
              <ProtectedRoute>
                <ShopEditor />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <TooltipProvider>
          <Router>
          <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            <Navbar />
            <main>
              <AnimatedRoutes />
            </main>
            <Footer />
            <Toaster position="top-center" />
          </div>
        </Router>
      </TooltipProvider>
    </I18nProvider>
  </AuthProvider>
  );
}
