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
    logo: "https://www.google.com/s2/favicons?domain=eneba.com&sz=64",
  },
  {
    name: "G2A",
    url: "https://www.g2a.com/",
    description: "The largest peer-to-peer game key marketplace with millions of listings.",
    logo: "https://www.google.com/s2/favicons?domain=g2a.com&sz=64",
  },
  {
    name: "Kinguin",
    url: "https://www.kinguin.net/",
    description: "Global marketplace with 17M+ users and 40,000+ sellers offering instant delivery.",
    logo: "https://www.google.com/s2/favicons?domain=kinguin.net&sz=64",
  },
  {
    name: "Gamivo",
    url: "https://www.gamivo.com/",
    description: "Multi-seller marketplace with SMART subscription for extra discounts.",
    logo: "https://www.google.com/s2/favicons?domain=gamivo.com&sz=64",
  },
  {
    name: "K4G",
    url: "https://k4g.com/",
    description: "Marketplace for game keys across Steam, Origin, Battle.net, PSN and Xbox.",
    logo: "https://www.google.com/s2/favicons?domain=k4g.com&sz=64",
  },
  {
    name: "HRK Game",
    url: "https://www.hrkgame.com/",
    description: "Key marketplace with unique Lottery, Dropkey and Make Bundle features.",
    logo: "https://www.google.com/s2/favicons?domain=hrkgame.com&sz=64",
  },
  {
    name: "Difmark",
    url: "https://difmark.com/",
    description: "Marketplace for game keys, gift cards, software and in-game currency.",
    logo: "https://www.google.com/s2/favicons?domain=difmark.com&sz=64",
  },
  {
    name: "G2Play",
    url: "https://www.g2play.net/",
    description: "Global marketplace for Steam, Origin and other digital game keys.",
    logo: "https://www.google.com/s2/favicons?domain=g2play.net&sz=64",
  },
  {
    name: "Driffle",
    url: "https://driffle.com/",
    description: "Marketplace for games, gift cards and subscriptions with instant delivery.",
    logo: "https://www.google.com/s2/favicons?domain=driffle.com&sz=64",
  },
];

const generalStores: Store[] = [
  {
    name: "Instant Gaming",
    url: "https://www.instant-gaming.com/?igr=pikorafy",
    description: "Activation codes delivered via email for Steam, Xbox, PS, Uplay and Origin.",
    logo: "https://www.google.com/s2/favicons?domain=instant-gaming.com&sz=64",
  },
  {
    name: "Loaded",
    url: "https://www.loaded.com/",
    description: "Formerly CDKeys — trusted key store since 2009, rebranded in 2025. 15,000+ titles.",
    logo: "https://www.google.com/s2/favicons?domain=loaded.com&sz=64",
  },
  {
    name: "MMOGA",
    url: "https://www.mmoga.com/",
    description: "Long-running key store for game keys, in-game currency and gift cards.",
    logo: "https://www.google.com/s2/favicons?domain=mmoga.com&sz=64",
  },
  {
    name: "CJS CD Keys",
    url: "https://www.cjs-cdkeys.com/",
    description: "UK-based key store with instant delivery and full money-back guarantee.",
    logo: "https://www.google.com/s2/favicons?domain=cjs-cdkeys.com&sz=64",
  },
  {
    name: "GAMESEAL",
    url: "https://www.gameseal.com/",
    description: "Direct-deal key store with 4.3/5 Trustpilot rating and 14,000+ reviews.",
    logo: "https://www.google.com/s2/favicons?domain=gameseal.com&sz=64",
  },
  {
    name: "Gamingdragons",
    url: "https://www.gamingdragons.com/",
    description: "Key store since 2011 offering PC, Xbox and PlayStation game keys.",
    logo: "https://www.google.com/s2/favicons?domain=gamingdragons.com&sz=64",
  },
  {
    name: "ElectronicFirst",
    url: "https://www.electronicfirst.com/",
    description: "Key store for game keys, gift cards and software with instant delivery.",
    logo: "https://www.google.com/s2/favicons?domain=electronicfirst.com&sz=64",
  },
  {
    name: "YUPLAY",
    url: "https://www.yuplay.com/",
    description: "Key store specializing in Steam, Origin and Uplay activation codes.",
    logo: "https://www.google.com/s2/favicons?domain=yuplay.com&sz=64",
  },
  {
    name: "Wyrel",
    url: "https://www.wyrel.com/",
    description: "Key store offering game keys at competitive prices with customer support.",
    logo: "https://www.google.com/s2/favicons?domain=wyrel.com&sz=64",
  },
];

const officialStores: Store[] = [
  {
    name: "Steam",
    url: "https://store.steampowered.com/",
    description: "Valve's dominant PC platform with the largest game library and community features.",
    logo: "https://www.google.com/s2/favicons?domain=steampowered.com&sz=64",
  },
  {
    name: "Epic Games Store",
    url: "https://store.epicgames.com/",
    description: "Weekly free games, exclusive titles and a lower 12% revenue cut for developers.",
    logo: "https://www.google.com/s2/favicons?domain=epicgames.com&sz=64",
  },
  {
    name: "GOG",
    url: "https://www.gog.com/",
    description: "CD Projekt's DRM-free digital store for classic and modern PC games.",
    logo: "https://www.google.com/s2/favicons?domain=gog.com&sz=64",
  },
  {
    name: "PlayStation Store",
    url: "https://store.playstation.com/",
    description: "Sony's official storefront for PS4 and PS5 games, DLC and subscriptions.",
    logo: "https://www.google.com/s2/favicons?domain=playstation.com&sz=64",
  },
  {
    name: "Xbox / Microsoft Store",
    url: "https://www.xbox.com/en-us/microsoft-store",
    description: "Microsoft's official storefront integrated with Game Pass and Xbox app.",
    logo: "https://www.google.com/s2/favicons?domain=xbox.com&sz=64",
  },
  {
    name: "Nintendo eShop",
    url: "https://www.nintendo.com/us/store/games/",
    description: "Nintendo's official digital storefront for Switch and Switch 2 games.",
    logo: "https://www.google.com/s2/favicons?domain=nintendo.com&sz=64",
  },
  {
    name: "EA App",
    url: "https://www.ea.com/ea-app",
    description: "Electronic Arts' official PC launcher for EA Sports FC, Battlefield, The Sims and more.",
    logo: "https://icon.horse/icon/ea.com",
  },
  {
    name: "Ubisoft Store",
    url: "https://store.ubisoft.com/",
    description: "Ubisoft's official store for Assassin's Creed, Far Cry, Rainbow Six and more.",
    logo: "https://icon.horse/icon/ubisoft.com",
  },
  {
    name: "Battle.net",
    url: "https://shop.battle.net/",
    description: "Blizzard's platform for World of Warcraft, Overwatch, Diablo and Call of Duty.",
    logo: "https://www.google.com/s2/favicons?domain=blizzard.com&sz=64",
  },
  {
    name: "Rockstar Games Store",
    url: "https://store.rockstargames.com/",
    description: "Rockstar's official store for GTA, Red Dead Redemption and Max Payne.",
    logo: "https://www.google.com/s2/favicons?domain=rockstargames.com&sz=64",
  },
  {
    name: "Square Enix Store",
    url: "https://store.square-enix-games.com/",
    description: "Official store for Final Fantasy, Dragon Quest, Kingdom Hearts and Nier.",
    logo: "https://www.google.com/s2/favicons?domain=square-enix-games.com&sz=64",
  },
  {
    name: "Green Man Gaming",
    url: "https://www.greenmangaming.com/",
    description: "Authorized retailer with direct publisher partnerships and XP loyalty rewards.",
    logo: "https://www.google.com/s2/favicons?domain=greenmangaming.com&sz=64",
  },
  {
    name: "Fanatical",
    url: "https://www.fanatical.com/",
    description: "Authorized retailer known for curated bundles, flash deals and star deals.",
    logo: "https://www.google.com/s2/favicons?domain=fanatical.com&sz=64",
  },
  {
    name: "Humble Bundle",
    url: "https://www.humblebundle.com/",
    description: "Pay-what-you-want bundles and Humble Choice subscription, with charity donations.",
    logo: "https://www.google.com/s2/favicons?domain=humblebundle.com&sz=64",
  },
  {
    name: "Gamesplanet",
    url: "https://www.gamesplanet.com/",
    description: "Authorized retailer with UK, French, German and US storefronts.",
    logo: "https://www.google.com/s2/favicons?domain=gamesplanet.com&sz=64",
  },
  {
    name: "GamersGate",
    url: "https://www.gamersgate.com/",
    description: "One of the longest-running authorized digital game stores with loyalty rewards.",
    logo: "https://www.google.com/s2/favicons?domain=gamersgate.com&sz=64",
  },
  {
    name: "WinGameStore",
    url: "https://www.wingamestore.com/",
    description: "Authorized ad-free retailer for Windows and Linux games.",
    logo: "https://www.google.com/s2/favicons?domain=wingamestore.com&sz=64",
  },
  {
    name: "DLGamer",
    url: "https://www.dlgamer.com/",
    description: "Authorized digital retailer operating since 2004 with publisher partnerships.",
    logo: "https://www.google.com/s2/favicons?domain=dlgamer.com&sz=64",
  },
  {
    name: "Voidu",
    url: "https://www.voidu.com/",
    description: "Authorized retailer with stackable discount codes for extra savings.",
    logo: "https://www.google.com/s2/favicons?domain=voidu.com&sz=64",
  },
  {
    name: "2Game",
    url: "https://www.2game.com/",
    description: "Authorized retailer focused on AAA titles with a price alert system.",
    logo: "https://www.google.com/s2/favicons?domain=2game.com&sz=64",
  },
  {
    name: "Nuuvem",
    url: "https://www.nuuvem.com/",
    description: "Brazil-based authorized retailer with excellent regional pricing.",
    logo: "https://www.google.com/s2/favicons?domain=nuuvem.com&sz=64",
  },
  {
    name: "GameBillet",
    url: "https://www.gamebillet.com/",
    description: "Authorized Steam key retailer with competitive pricing.",
    logo: "https://www.google.com/s2/favicons?domain=gamebillet.com&sz=64",
  },
  {
    name: "IndieGala",
    url: "https://www.indiegala.com/",
    description: "Authorized retailer specializing in indie game bundles with deals up to 98% off.",
    logo: "https://www.google.com/s2/favicons?domain=indiegala.com&sz=64",
  },
  {
    name: "itch.io",
    url: "https://itch.io/",
    description: "Open indie game platform where developers sell directly to players.",
    logo: "https://www.google.com/s2/favicons?domain=itch.io&sz=64",
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
              description="Grey market key stores that sell game keys directly. Not officially publisher-authorized but widely used and generally reputable."
              stores={generalStores}
              colors={categoryColors.general}
              count={generalStores.length}
            />
          </div>

          {/* Official Stores */}
          <div id="official">
            <StoreSection
              title="Official Stores"
              description="First-party storefronts, publisher stores and authorized retailers with direct publisher partnerships."
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
