
import {
  FaDiscord,
  FaGithub,
  FaLinkedin,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { social } from "@/lib/social";

interface FooterLink {
  name: string;
  href: string;
}
interface FooterSection {
  title: string;
  links: FooterLink[];
}
interface FooterSocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}
interface FooterLogo {
  url: string;
  src: string;
  alt: string;
  title: string;
}

interface FooterCompactProps {
  logo?: FooterLogo;
  sections?: FooterSection[];
  socialLinks?: FooterSocialLink[];
  className?: string;
}

interface FooterProps extends FooterCompactProps {}
type Props = Partial<FooterProps>;

const socialIcons: {
  key: keyof typeof social;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "github", label: "GitHub", icon: <FaGithub className="size-5" /> },
  { key: "twitter", label: "X", icon: <FaXTwitter className="size-5" /> },
  { key: "discord", label: "Discord", icon: <FaDiscord className="size-5" /> },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: <FaLinkedin className="size-5" />,
  },
  { key: "youtube", label: "YouTube", icon: <FaYoutube className="size-5" /> },
]

// Only surface socials that actually have a URL in social.ts.
const socialLinksFromConfig: FooterSocialLink[] = socialIcons
  .filter(({ key }) => Boolean(social[key]))
  .map(({ key, label, icon }) => ({ href: social[key], label, icon }))

const defaultProps: FooterProps = {
  logo: {
    url: "/",
    src: "/images/black-priompt-icon.png",
    alt: "Priompt",
    title: "Priompt.com",
  },
  sections: [
    {
      title: "Menu",
      links: [
        { name: "Features", href: "#features" },
        { name: "Compare", href: "#compare" },
        { name: "FAQ", href: "#faq" },
        { name: "GitHub", href: social.github },
      ],
    },
  ],
  socialLinks: socialLinksFromConfig,
};

const MAX_SECTIONS = 1;

const Footer = (props: Props) => {
  const { logo, sections, socialLinks, className } = {
    ...defaultProps,
    ...props,
  };

  const visibleSections = (sections ?? []).slice(0, MAX_SECTIONS);
  const quickLinks = visibleSections.flatMap((s) => s.links);

  return (
    <section className={cn("py-8 lg:py-10", className)}>
      <div className="container mx-auto">
        <footer>
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
            <a
              href={logo?.url ?? "#"}
              title={logo?.title ?? ""}
              className="inline-flex shrink-0 items-center gap-2"
            >
              <Image
                src="/images/black-priompt-icon.png"
                alt={logo?.alt ?? "Priompt"}
                width={473}
                height={450}
                className="h-6 w-auto dark:hidden"
              />
              <Image
                src="/images/white-priompt-icon.png"
                alt={logo?.alt ?? "Priompt"}
                width={473}
                height={450}
                className="hidden h-6 w-auto dark:block"
              />
              <span className="text-base font-semibold tracking-tight text-foreground">
                {logo?.title ?? "Priompt.com"}
              </span>
            </a>
            <nav
              aria-label="Footer"
              className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground lg:flex-1 lg:justify-center"
            >
              {quickLinks.map((link, idx) => (
                <a
                  key={`${idx}-${link.name}-${link.href}`}
                  href={link.href}
                  className="hover:text-primary"
                >
                  {link.name}
                </a>
              ))}
            </nav>
            {socialLinks && socialLinks.length > 0 ? (
              <ul className="flex w-full flex-wrap items-center justify-center gap-3 text-muted-foreground lg:w-auto lg:justify-end">
                {socialLinks.map((link, idx) => (
                  <li key={idx} className="font-medium hover:text-primary">
                    <a
                      href={link.href}
                      aria-label={link.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="[&_svg]:size-4">{link.icon}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground/80 lg:mt-8">
            Third-party logos are shown for representation only and do not imply
            affiliation with or endorsement by their owners.
          </p>
        </footer>
      </div>
    </section>
  );
};

export { Footer };
