import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Game Stores Directory - Pikorafy",
  description:
    "Browse all digital game stores: marketplaces, authorized retailers, and official stores. Find the best place to buy game keys.",
};

interface Store {
  name: string;
  url: string;
  description: string;
  logo: string;
}

const marketplaces: Store[] = [
  {
    name: "Eneba",
    url: "https://www.eneba.com/",
    description: "Global marketplace with low seller fees and competitive prices on PC & console keys.",
    logo: "https://logo.clearbit.com/eneba.com",
  },
  {
    name: "G2A",
    url: "https://www.g2a.com/",
    description: "The largest peer-to-peer game key marketplace with millions of listings.",
    logo: "https://logo.clearbit.com/g2a.com",
  },
  {
    name: "Kinguin",
    url: "https://www.kinguin.net/",
    description: "Global marketplace with 17M+ users and 40,000+ sellers offering instant delivery.",
    logo: "https://logo.clearbit.com/kinguin.net",
  },
  {
    name: "Gamivo",
    url: "https://www.gamivo.com/",
    description: "Multi-seller marketplace with SMART subscription for extra discounts.",
    logo: "https://logo.clearbit.com/gamivo.com",
  },
  {
    name: "K4G",
    url: "https://k4g.com/",
    description: "Marketplace for game keys across Steam, Origin, Battle.net, PSN and Xbox.",
    logo: "https://logo.clearbit.com/k4g.com",
  },
  {
    name: "HRK Game",
    url: "https://www.hrkgame.com/",
    description: "Key marketplace with unique Lottery, Dropkey and Make Bundle features.",
    logo: "https://logo.clearbit.com/hrkgame.com",
  },
  {
    name: "Difmark",
    url: "https://difmark.com/",
    description: "Marketplace for game keys, gift cards, software and in-game currency.",
    logo: "https://logo.clearbit.com/difmark.com",
  },
  {
    name: "G2Play",
    url: "https://www.g2play.net/",
    description: "Global marketplace for Steam, Origin and other digital game keys.",
    logo: "https://logo.clearbit.com/g2play.net",
  },
  {
    name: "MMOGA",
    url: "https://www.mmoga.com/",
    description: "Long-running marketplace for game keys, in-game currency and gift cards.",
    logo: "https://logo.clearbit.com/mmoga.com",
  },
  {
    name: "Driffle",
    url: "https://driffle.com/",
    description: "Marketplace for games, gift cards and subscriptions with instant delivery.",
    logo: "https://logo.clearbit.com/driffle.com",
  },
];

const generalStores: Store[] = [
  {
    name: "Instant Gaming",
    url: "https://www.instant-gaming.com/?igr=pikorafy",
    description: "Official activation codes delivered via email for Steam, Xbox, PS, Uplay and Origin.",
    logo: "https://logo.clearbit.com/instant-gaming.com",
  },
  {
    name: "CDKeys",
    url: "https://www.cdkeys.com/",
    description: "Trusted single-seller store since 2009 with a 4.8/5 Trustpilot rating.",
    logo: "https://logo.clearbit.com/cdkeys.com",
  },
  {
    name: "Green Man Gaming",
    url: "https://www.greenmangaming.com/",
    description: "Authorized retailer with direct publisher partnerships and XP loyalty rewards.",
    logo: "https://logo.clearbit.com/greenmangaming.com",
  },
  {
    name: "Fanatical",
    url: "https://www.fanatical.com/",
    description: "Authorized retailer known for curated bundles, flash deals and star deals.",
    logo: "https://logo.clearbit.com/fanatical.com",
  },
  {
    name: "Humble Bundle",
    url: "https://www.humblebundle.com/",
    description: "Pay-what-you-want bundles and Humble Choice subscription, with charity donations.",
    logo: "https://logo.clearbit.com/humblebundle.com",
  },
  {
    name: "Gamesplanet",
    url: "https://www.gamesplanet.com/",
    description: "Authorized retailer with UK, French, German and US storefronts.",
    logo: "https://logo.clearbit.com/gamesplanet.com",
  },
  {
    name: "GamersGate",
    url: "https://www.gamersgate.com/",
    description: "One of the longest-running digital game stores with loyalty rewards.",
    logo: "https://logo.clearbit.com/gamersgate.com",
  },
  {
    name: "WinGameStore",
    url: "https://www.wingamestore.com/",
    description: "Ad-free authorized retailer for Windows and Linux games.",
    logo: "https://logo.clearbit.com/wingamestore.com",
  },
  {
    name: "DLGamer",
    url: "https://www.dlgamer.com/",
    description: "Authorized digital retailer operating since 2004 with publisher partnerships.",
    logo: "https://logo.clearbit.com/dlgamer.com",
  },
  {
    name: "Voidu",
    url: "https://www.voidu.com/",
    description: "Authorized retailer with stackable discount codes for extra savings.",
    logo: "https://logo.clearbit.com/voidu.com",
  },
  {
    name: "2Game",
    url: "https://www.2game.com/",
    description: "Authorized retailer focused on AAA titles with price alert system.",
    logo: "https://logo.clearbit.com/2game.com",
  },
  {
    name: "Nuuvem",
    url: "https://www.nuuvem.com/",
    description: "Brazil-based authorized retailer with excellent regional pricing.",
    logo: "https://logo.clearbit.com/nuuvem.com",
  },
  {
    name: "GameBillet",
    url: "https://www.gamebillet.com/",
    description: "Authorized Steam key retailer with competitive pricing.",
    logo: "https://logo.clearbit.com/gamebillet.com",
  },
  {
    name: "IndieGala",
    url: "https://www.indiegala.com/",
    description: "Specializing in indie game bundles with deals up to 98% off.",
    logo: "https://logo.clearbit.com/indiegala.com",
  },
  {
    name: "itch.io",
    url: "https://itch.io/",
    description: "Open indie game platform where developers sell directly to players.",
    logo: "https://logo.clearbit.com/itch.io",
  },
];

const officialStores: Store[] = [
  {
    name: "Steam",
    url: "https://store.steampowered.com/",
    description: "Valve's dominant PC platform with the largest game library and community features.",
    logo: "https://logo.clearbit.com/steampowered.com",
  },
  {
    name: "Epic Games Store",
    url: "https://store.epicgames.com/",
    description: "Weekly free games, exclusive titles and a lower 12% revenue cut for developers.",
    logo: "https://logo.clearbit.com/epicgames.com",
  },
  {
    name: "GOG",
    url: "https://www.gog.com/",
    description: "CD Projekt's DRM-free digital store for classic and modern PC games.",
    logo: "https://logo.clearbit.com/gog.com",
  },
  {
    name: "PlayStation Store",
    url: "https://store.playstation.com/",
    description: "Sony's official storefront for PS4 and PS5 games, DLC and subscriptions.",
    logo: "https://logo.clearbit.com/playstation.com",
  },
  {
    name: "Xbox / Microsoft Store",
    url: "https://www.xbox.com/en-us/microsoft-store",
    description: "Microsoft's official storefront integrated with Game Pass and Xbox app.",
    logo: "https://logo.clearbit.com/xbox.com",
  },
  {
    name: "Nintendo eShop",
    url: "https://www.nintendo.com/us/store/games/",
    description: "Nintendo's official digital storefront for Switch and Switch 2 games.",
    logo: "https://logo.clearbit.com/nintendo.com",
  },
  {
    name: "EA App",
    url: "https://www.ea.com/ea-app",
    description: "Electronic Arts' official PC launcher for EA Sports FC, Battlefield, The Sims and more.",
    logo: "https://logo.clearbit.com/ea.com",
  },
  {
    name: "Ubisoft Store",
    url: "https://store.ubisoft.com/",
    description: "Ubisoft's official store for Assassin's Creed, Far Cry, Rainbow Six and more.",
    logo: "https://logo.clearbit.com/ubisoft.com",
  },
  {
    name: "Battle.net",
    url: "https://shop.battle.net/",
    description: "Blizzard's platform for World of Warcraft, Overwatch, Diablo and Call of Duty.",
    logo: "https://logo.clearbit.com/blizzard.com",
  },
  {
    name: "Rockstar Games Store",
    url: "https://store.rockstargames.com/",
    description: "Rockstar's official store for GTA, Red Dead Redemption and Max Payne.",
    logo: "https://logo.clearbit.com/rockstargames.com",
  },
  {
    name: "Square Enix Store",
    url: "https://store.square-enix-games.com/",
    description: "Official store for Final Fantasy, Dragon Quest, Kingdom Hearts and Nier.",
    logo: "https://logo.clearbit.com/square-enix-games.com",
  },
];

const categoryColors = {
  marketplaces: {
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    glow: "from-purple-500/10",
    icon: "text-purple-400",
  },
  general: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    glow: "from-emerald-500/10",
    icon: "text-emerald-400",
  },
  official: {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    glow: "from-blue-500/10",
    icon: "text-blue-400",
  },
};

function StoreCard({ store }: { store: Store }) {
  return (
    <a
      href={store.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-4 transition-all hover:border-emerald-500/30 hover:bg-[#1e2231] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#2a2e3a] bg-[#0f1117] overflow-hidden">
        <Image
          src={store.logo}
          alt={store.name}
          width={32}
          height={32}
          unoptimized
          className="rounded"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
          {store.name}
        </h3>
        <p className="mt-0.5 text-xs text-[#8b8fa3] leading-relaxed line-clamp-2">
          {store.description}
        </p>
      </div>
      <svg
        className="h-4 w-4 shrink-0 mt-1 text-[#8b8fa3] transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  );
}

function StoreSection({
  title,
  description,
  stores,
  colors,
  count,
}: {
  title: string;
  description: string;
  stores: Store[];
  colors: (typeof categoryColors)["marketplaces"];
  count: number;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${colors.badge}`}>
          {count} stores
        </span>
      </div>
      <p className="text-sm text-[#8b8fa3] mb-6">{description}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <StoreCard key={store.name} store={store} />
        ))}
      </div>
    </section>
  );
}

export default function StoresPage() {
  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Game Stores Directory
          </h1>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            Browse all digital game stores — from key marketplaces to authorized retailers and official storefronts. Find the best place to buy your next game.
          </p>
        </div>

        {/* Quick nav pills */}
        <div className="flex flex-wrap gap-2 mb-12">
          <a href="#marketplaces" className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/20">
            Marketplaces
          </a>
          <a href="#general" className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20">
            General Stores
          </a>
          <a href="#official" className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20">
            Official Stores
          </a>
        </div>

        <div className="space-y-16">
          {/* Marketplaces */}
          <div id="marketplaces">
            <StoreSection
              title="Marketplaces"
              description="Multi-seller platforms where different vendors list game keys. Prices vary by seller — check ratings before buying."
              stores={marketplaces}
              colors={categoryColors.marketplaces}
              count={marketplaces.length}
            />
          </div>

          {/* General Stores */}
          <div id="general">
            <StoreSection
              title="General Stores"
              description="Single-seller stores and authorized retailers that sell game keys directly. Many have direct publisher partnerships."
              stores={generalStores}
              colors={categoryColors.general}
              count={generalStores.length}
            />
          </div>

          {/* Official Stores */}
          <div id="official">
            <StoreSection
              title="Official Stores"
              description="First-party and publisher storefronts. Buy directly from the platform holders and game publishers."
              stores={officialStores}
              colors={categoryColors.official}
              count={officialStores.length}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-16 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 text-center">
          <p className="text-sm text-[#8b8fa3]">
            Pikorafy is not affiliated with all stores listed above. Some links may be affiliate links.
            Always verify store legitimacy and check reviews before purchasing.
          </p>
        </div>
      </div>
    </div>
  );
}
