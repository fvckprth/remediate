"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNav } from "./nav-config";

function isItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/docs") return pathname === "/docs";
  return pathname === itemHref || pathname.startsWith(itemHref + "/");
}

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-8 w-full">
      {docsNav.map((section) => (
        <div key={section.title} className="flex flex-col gap-3">
          <p className="text-[14px] font-bold tracking-[-0.56px] leading-none text-foreground/25 uppercase">
            {section.title}
          </p>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active = isItemActive(item.href, pathname);
              return (
                <li key={item.slug}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-2 py-1 text-[18px] font-medium tracking-[-0.72px] leading-tight transition-colors ${
                      active
                        ? "text-foreground bg-foreground/5"
                        : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
