"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MapPin, Package, User } from "lucide-react";
import Header from "@/components/header";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/orders", label: "Orders", icon: Package },
];

export default function AccountLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-[1200px] px-6 pt-28 pb-16">
          <h1 className="font-serif text-3xl text-white mb-8">{title}</h1>
          <div className="grid gap-8 md:grid-cols-[230px_1fr]">
            <aside className="flex flex-row md:flex-col gap-2 overflow-x-auto border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
              {links.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 whitespace-nowrap px-4 py-3 text-sm font-semibold tracking-wider transition-colors ${
                      active ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label.toUpperCase()}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="flex items-center gap-3 whitespace-nowrap px-4 py-3 text-sm font-semibold tracking-wider text-muted-foreground transition-colors hover:text-gold"
              >
                <LogOut className="size-4" />
                LOGOUT
              </button>
            </aside>
            <section className="min-h-[420px] border border-border bg-card p-5 lg:p-6">{children}</section>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
