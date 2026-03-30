import Link from "next/link";

const gamingLinks = [
  { name: "Game Deals", href: "/gaming/deals" },
  { name: "Gaming Hub", href: "/gaming" },
  { name: "Xbox Game Pass vs PS Plus", href: "/vs/xbox-game-pass-vs-ps-plus" },
  { name: "Eneba vs G2A vs Kinguin", href: "/vs/eneba-vs-g2a-vs-kinguin" },
  { name: "DLSS vs FSR", href: "/vs/dlss-4-vs-fsr-4" },
];

const resourceLinks = [
  { name: "All Comparisons", href: "/vs" },
  { name: "Alternatives", href: "/alternatives" },
  { name: "Free Tools", href: "/tools" },
  { name: "Blog", href: "/blog" },
  { name: "AI Quiz", href: "/quiz" },
];

const toolLinks = [
  { name: "JSON Formatter", href: "/tools/json-formatter" },
  { name: "Password Generator", href: "/tools/password-generator" },
  { name: "QR Code Generator", href: "/tools/qr-code-generator" },
  { name: "Base64 Encoder", href: "/tools/base64" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#2a2e3a] bg-[#0a0c10]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
              </svg>
              <span className="text-base font-bold text-white">Pikorafy</span>
            </Link>
            <p className="mt-3 text-sm text-[#8b8fa3] leading-relaxed">
              Game deals, comparisons & free tools. Save up to 90% on digital game keys.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="https://twitter.com/pikorafy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2e3a] bg-[#1a1d27] text-[#8b8fa3] transition-colors hover:border-[#3a3e4a] hover:text-white"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </Link>
            </div>
          </div>

          {/* Gaming */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8b8fa3]">Gaming</h3>
            <ul className="mt-3 space-y-2">
              {gamingLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-[#b0b3c0] transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8b8fa3]">Resources</h3>
            <ul className="mt-3 space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-[#b0b3c0] transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Free Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8b8fa3]">Free Tools</h3>
            <ul className="mt-3 space-y-2">
              {toolLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-[#b0b3c0] transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/tools" className="text-sm text-emerald-400 transition-colors hover:text-emerald-300">
                  View all 22 tools &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#2a2e3a] pt-6 sm:flex-row">
          <p className="text-xs text-[#8b8fa3]">
            &copy; {new Date().getFullYear()} Pikorafy. All rights reserved.
          </p>
          <p className="text-xs text-[#8b8fa3]">
            Prices are provided by stores and may vary. Some links are affiliate links.
          </p>
        </div>
      </div>
    </footer>
  );
}
