"use client";

import { Menu, GitCompare, Layers, Gamepad2, Tag, MonitorPlay, Store } from "lucide-react";
import SearchDialog from "@/components/SearchDialog";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

const menu: MenuItem[] = [
  {
    title: "Deals",
    url: "#",
    items: [
      {
        title: "Game Deals",
        description: "Up to 90% off on PC, Xbox, PS & Nintendo keys",
        icon: <Tag className="size-5 shrink-0 text-emerald-400" />,
        url: "/gaming/deals",
      },
      {
        title: "Gaming Hub",
        description: "Your one-stop gaming resource center",
        icon: <Gamepad2 className="size-5 shrink-0 text-blue-400" />,
        url: "/gaming",
      },
    ],
  },
  {
    title: "Stores",
    url: "/stores",
    icon: <Store className="size-5 shrink-0 text-emerald-400" />,
  },
  {
    title: "Compare",
    url: "#",
    items: [
      {
        title: "All Comparisons",
        description: "Side-by-side comparisons of tools and services",
        icon: <GitCompare className="size-5 shrink-0" />,
        url: "/vs",
      },
      {
        title: "Gaming Comparisons",
        description: "Game Pass vs PS Plus, key store comparisons & more",
        icon: <MonitorPlay className="size-5 shrink-0" />,
        url: "/vs",
      },
      {
        title: "Alternatives",
        description: "Find the best alternatives to any tool",
        icon: <Layers className="size-5 shrink-0" />,
        url: "/alternatives",
      },
    ],
  },
  {
    title: "Blog",
    url: "/blog",
  },
];

const mobileExtraLinks = [
  { name: "Game Deals", url: "/gaming/deals" },
  { name: "Gaming Hub", url: "/gaming" },
  { name: "Stores", url: "/stores" },
  { name: "Comparisons", url: "/vs" },
  { name: "Alternatives", url: "/alternatives" },
];

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title} className="text-muted-foreground">
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="w-80 p-3">
            <NavigationMenuLink>
              {item.items.map((subItem) => (
                <li key={subItem.title}>
                  <Link
                    className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                    href={subItem.url}
                  >
                    {subItem.icon}
                    <div>
                      <div className="text-sm font-semibold">
                        {subItem.title}
                      </div>
                      {subItem.description && (
                        <p className="text-sm leading-snug text-muted-foreground">
                          {subItem.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </NavigationMenuLink>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }
  return (
    <Link
      key={item.title}
      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      {item.title}
    </Link>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <Link
              key={subItem.title}
              className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
              href={subItem.url}
            >
              {subItem.icon}
              <div>
                <div className="text-sm font-semibold">{subItem.title}</div>
                {subItem.description && (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {subItem.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }
  return (
    <Link key={item.title} href={item.url} className="font-semibold">
      {item.title}
    </Link>
  );
};

export default function PikorafyNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#2a2e3a] bg-[#0f1117]/90 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-emerald-400" />
              <span className="text-lg font-bold text-[#e4e6eb]">Pikorafy</span>
            </Link>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SearchDialog />
            <Button asChild variant="outline" size="sm" className="border-[#2a2e3a] text-[#8b8fa3] hover:text-white">
              <Link href="/vs">Compare</Link>
            </Button>
            <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/gaming/deals">Game Deals</Link>
            </Button>
          </div>
        </nav>
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-emerald-400" />
              <span className="text-lg font-bold text-[#e4e6eb]">Pikorafy</span>
            </Link>
            <div className="flex items-center gap-2">
              <SearchDialog />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>
                      <Link href="/" className="flex items-center gap-2">
                        <Gamepad2 className="h-6 w-6 text-emerald-400" />
                        <span className="text-lg font-semibold">Pikorafy</span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="my-6 flex flex-col gap-6">
                    <Accordion
                      type="single"
                      collapsible
                      className="flex w-full flex-col gap-4"
                    >
                      {menu.map((item) => renderMobileMenuItem(item))}
                    </Accordion>
                    <div className="border-t py-4">
                      <div className="grid grid-cols-2 justify-start">
                        {mobileExtraLinks.map((link, idx) => (
                          <Link
                            key={idx}
                            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
                            href={link.url}
                          >
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button asChild variant="outline">
                        <Link href="/vs">Compare</Link>
                      </Button>
                      <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
                        <Link href="/gaming/deals">Game Deals</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
