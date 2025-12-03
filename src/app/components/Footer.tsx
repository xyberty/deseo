import Link from "next/link";
import { APP_NAME, APP_VERSION, GITHUB_URL } from "@/app/lib/constants";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background mt-auto py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>
            {APP_NAME} v{APP_VERSION}
          </span>
          <span className="hidden sm:inline">•</span>
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}

