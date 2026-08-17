import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h1 className="text-4xl font-display font-bold text-ink mb-2">Page Not Found</h1>
      <p className="text-ink-muted mb-8 max-w-md">
        The documentation page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="bg-accent-bright text-ink hover:bg-accent-bright/90 font-bold uppercase tracking-widest text-[11px] h-12 px-6">
        <Link href="/docs">
          Back to Docs <ArrowRightIcon className="ml-2 size-4" />
        </Link>
      </Button>
    </div>
  );
}
