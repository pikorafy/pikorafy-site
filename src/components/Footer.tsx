import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 md:flex-row md:justify-between">
        <div className="text-center md:text-left">
          <p className="font-semibold text-text">Pikorafy</p>
          <p className="mt-1 text-sm text-dim">
            Pick smarter. Build faster.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="https://twitter.com/pikorafy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-dim transition-colors hover:text-text"
          >
            Twitter
          </Link>
          <Link
            href="/about"
            className="text-sm text-dim transition-colors hover:text-text"
          >
            About
          </Link>
          <Link
            href="/newsletter"
            className="text-sm text-dim transition-colors hover:text-text"
          >
            Newsletter
          </Link>
        </div>

        <p className="text-xs text-dim">
          &copy; {new Date().getFullYear()} Pikorafy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
