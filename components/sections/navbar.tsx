"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Menu,
  Server,
  Terminal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FaGithub, FaJs, FaPython } from "react-icons/fa";
import { SiSvelte } from "react-icons/si";

import { Logo } from "@/components/shadcnblocks/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { social } from "@/lib/social";

const developerLinks = [
  {
    title: "Priompt Server",
    description: "The self-hostable gRPC prompt server.",
    href: "https://github.com/priompt/priompt",
    icon: Server,
  },
  {
    title: "CLI",
    description: "Git-backed prompt authoring.",
    href: "https://github.com/priompt/cli",
    icon: Terminal,
  },
  {
    title: "Python SDK",
    description: "Python client over gRPC.",
    href: "https://github.com/priompt/python-sdk",
    icon: FaPython,
  },
  {
    title: "JavaScript SDK",
    description: "JavaScript client over gRPC.",
    href: "https://github.com/priompt/js-sdk",
    icon: FaJs,
  },
  {
    title: "Database Adapters",
    description: "SQLite & PostgreSQL storage.",
    href: "https://github.com/priompt/db-adapters",
    icon: Database,
  },
  {
    title: "Web UI",
    description: "Self-hostable Svelte UI.",
    href: "https://github.com/priompt/ui",
    icon: SiSvelte,
  },
];

interface NavbarProps {
  className?: string;
}

const mobileMenuTransition = {
  duration: 0.22,
  ease: [0.32, 0.72, 0, 1] as const,
};

// Inner submenu (root <-> developers) horizontal slide.
const mobilePanelVariants = {
  initial: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? "100%" : "-100%",
  }),
  animate: {
    x: 0,
  },
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? "-100%" : "100%",
  }),
};

// The sheet itself slides in from the right edge of the viewport.
const mobileSheetVariants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
};

// Full-viewport sheet anchored to the right. Rendered outside NavigationMenu
// so nothing clips it or turns it into an in-flow dropdown.
const mobileMenuShellClassName =
  "fixed inset-y-0 right-0 z-[210] flex w-full max-w-sm flex-col overflow-hidden border-l border-border bg-popover text-popover-foreground shadow-xl lg:hidden";

const mobileMenuPanelClassName =
  "absolute inset-0 flex h-full w-full flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-popover will-change-transform";

const Navbar = ({ className }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<"developers" | null>(null);
  const [menuDirection, setMenuDirection] = useState(0);

  const openSubmenu = (nextSubmenu: "developers") => {
    setMenuDirection(1);
    setSubmenu(nextSubmenu);
  };

  const closeSubmenu = () => {
    setMenuDirection(-1);
    setSubmenu(null);
  };

  const toggleMobileMenu = () => {
    if (open) {
      setMenuDirection(0);
      setOpen(false);
      setSubmenu(null);
      return;
    }

    setMenuDirection(0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const docEl = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = docEl.style.overflow;
    body.style.overflow = "hidden";
    docEl.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevBodyOverflow;
      docEl.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  return (
    <section
      className={cn(
        "sticky top-0 z-100 w-full self-start bg-background py-4",
        className,
      )}
    >
      <div className="container">
        <NavigationMenu className="min-w-full items-start [&>div:last-child]:left-1/2 [&>div:last-child]:-translate-x-1/2">
          <div className="relative z-110 flex w-full items-center justify-between gap-12 bg-background">
            {/* Logo */}
            <div>
              <Logo url="/">
                <Image
                  src="/images/black-priompt-icon.png"
                  alt="Priompt"
                  width={473}
                  height={450}
                  priority
                  className="h-7 w-auto dark:hidden"
                />
                <Image
                  src="/images/white-priompt-icon.png"
                  alt="Priompt"
                  width={473}
                  height={450}
                  priority
                  className="hidden h-7 w-auto dark:block"
                />
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  Priompt.com
                </span>
              </Logo>
            </div>

            <NavigationMenuList className="hidden lg:flex">
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#features"
                  className={navigationMenuTriggerStyle()}
                >
                  Features
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#compare"
                  className={navigationMenuTriggerStyle()}
                >
                  Compare
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Developers</NavigationMenuTrigger>
                <NavigationMenuContent className="w-[420px] p-5">
                  <div>
                    <div className="mb-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                      Build with Priompt
                    </div>
                    <div className="mb-4 text-sm font-normal text-muted-foreground">
                      Docs, SDKs, and the tools for authoring and serving
                      prompts.
                    </div>
                    <div className="space-y-1">
                      {developerLinks.map((link, index) => (
                        <NavigationMenuLink
                          key={index}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-row items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/30 focus:bg-muted/30 focus:text-accent-foreground dark:hover:bg-muted/25 dark:focus:bg-muted/25"
                        >
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted p-1.5 transition-colors group-hover:bg-muted/80 dark:group-hover:bg-muted/70">
                            <link.icon className="size-4 text-foreground" />
                          </span>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {link.title}
                            </div>
                            <div className="text-sm font-normal text-muted-foreground">
                              {link.description}
                            </div>
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#faq"
                  className={navigationMenuTriggerStyle()}
                >
                  FAQ
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>

            <div className="hidden items-center gap-2 lg:flex">
              <ThemeToggle />
              <Button variant="default" asChild>
                <a
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGithub />
                  GitHub
                </a>
              </Button>
            </div>

            <div className="flex items-center gap-4 lg:hidden">
              <Button
                variant="outline"
                size="icon"
                aria-label="Main Menu"
                onClick={toggleMobileMenu}
              >
                {!open && <Menu className="size-4" />}
                {open && <X className="size-4" />}
              </Button>
            </div>
          </div>
        </NavigationMenu>
      </div>

      {/* Mobile Menu — a right-to-left sheet, rendered outside NavigationMenu
          so it is not clipped or positioned like a dropdown. */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={toggleMobileMenu}
              className="fixed inset-0 z-[200] bg-black/40 lg:hidden"
            />

            {/* Sheet */}
            <motion.div
              variants={mobileSheetVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={mobileMenuTransition}
              className={mobileMenuShellClassName}
            >
              {/* Sheet header: always present so the sheet is self-contained.
                  Shows Back when in a submenu, the brand otherwise; the close
                  (X) button is always available on the right. */}
              <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-border bg-popover px-4 py-3">
                {submenu ? (
                  <Button variant="outline" size="sm" onClick={closeSubmenu}>
                    <ChevronLeft className="size-4" />
                    Back
                  </Button>
                ) : (
                  <span className="text-base font-semibold tracking-tight">
                    Menu
                  </span>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Close menu"
                  onClick={toggleMobileMenu}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="relative min-h-0 flex-1">
                <AnimatePresence
                  mode="sync"
                  custom={menuDirection}
                  initial={false}
                >
                  <motion.div
                    key={submenu ?? "root"}
                    custom={menuDirection}
                    variants={mobilePanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={mobileMenuTransition}
                    className={mobileMenuPanelClassName}
                  >
                    {!submenu && (
                      <>
                        <div>
                          {(
                            [
                              ["#features", "Features"],
                              ["#compare", "Compare"],
                              ["#faq", "FAQ"],
                            ] as const
                          ).map(([href, label]) => (
                            <a
                              key={href}
                              href={href}
                              onClick={toggleMobileMenu}
                              className="flex w-full items-center border-b border-border px-8 py-7 text-left transition-colors hover:bg-muted/30 dark:hover:bg-muted/25"
                            >
                              <span className="flex-1">{label}</span>
                            </a>
                          ))}
                          <button
                            type="button"
                            className="flex w-full items-center border-b border-border px-8 py-7 text-left transition-colors hover:bg-muted/30 dark:hover:bg-muted/25"
                            onClick={() => openSubmenu("developers")}
                          >
                            <span className="flex-1">Developers</span>
                            <span className="shrink-0">
                              <ChevronRight className="size-4" />
                            </span>
                          </button>
                        </div>
                        <div className="mx-8 mt-auto flex flex-col gap-4 pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Toggle theme
                            </span>
                            <ThemeToggle className="border border-border" />
                          </div>
                          <Button className="relative" size="lg" asChild>
                            <a
                              href={social.github}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FaGithub />
                              GitHub
                            </a>
                          </Button>
                        </div>
                      </>
                    )}

                    {submenu === "developers" && (
                      <>
                        <div className="px-8 pt-8 pb-3.5 text-xs font-semibold tracking-wide text-foreground uppercase">
                          Build with Priompt
                        </div>
                        <div className="mb-4 px-8 text-sm font-normal text-muted-foreground">
                          Docs, SDKs, and the tools for authoring and serving
                          prompts.
                        </div>
                        <div className="space-y-1 px-8 pb-16">
                          {developerLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-row items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/30 dark:hover:bg-muted/25"
                            >
                              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted p-1.5">
                                <link.icon className="size-4 text-foreground" />
                              </span>
                              <div>
                                <div className="text-sm font-medium">
                                  {link.title}
                                </div>
                                <div className="text-sm font-normal text-muted-foreground">
                                  {link.description}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export { Navbar };
