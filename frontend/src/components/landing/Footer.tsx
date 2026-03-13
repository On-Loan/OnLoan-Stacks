import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  {
    heading: "Protocol",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Markets", href: "/dashboard" },
      { label: "Documentation", href: "#" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Twitter", href: "#" },
      { label: "Discord", href: "#" },
      { label: "GitHub", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Audit Reports", href: "#" },
      { label: "Brand Kit", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-zinc-800 bg-surface-primary">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="OnLoan" width={28} height={28} />
              <span className="font-bold">
                On<span className="text-onloan-orange">Loan</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Peer-to-peer lending protocol on Bitcoin via Stacks.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.heading}>
              <h4 className="text-sm font-semibold text-white mb-3">
                {group.heading}
              </h4>
              <ul className="flex flex-col gap-2">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} OnLoan. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
