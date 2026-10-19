import { Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/platform/Brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <BrandMark />
      <div className="mt-12 flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary/5">
        <Compass className="h-7 w-7 text-primary" />
      </div>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">404</p>
      <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">This page has moved on.</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        The salon or page you are looking for does not exist, or its owner has not published it yet.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-11 rounded-full bg-primary px-7 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
          <Link to="/">
            Back home <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-full border-border px-6 text-[10px] font-bold uppercase tracking-[0.2em]">
          <Link to="/marketplace">Explore salons</Link>
        </Button>
      </div>
    </div>
  );
}
