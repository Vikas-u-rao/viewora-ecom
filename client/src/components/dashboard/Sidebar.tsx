"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Tag,
  LayoutDashboard,
} from "lucide-react";
import { UserProfile } from "./UserProfile";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
];

export function Sidebar({
  user,
  onLogout,
}: {
  user: { name?: string; email: string; role: string };
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 bg-white fixed h-full flex flex-col z-30">
      <div className="h-16 px-6 border-b border-gray-200 flex items-center gap-2.5 shrink-0">
        <div className="size-8.5 rounded-lg bg-gray-900 flex items-center justify-center text-white font-serif font-bold text-base">
          V
        </div>
        <div>
          <h1 className="font-serif text-base font-bold tracking-wider text-gray-900 leading-none">
            VIEWORA
          </h1>
          <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
            Console
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon className="size-4.5" /> {item.label}
            </Link>
          );
        })}
      </nav>

      <UserProfile
        name={user?.name}
        email={user?.email}
        onLogout={onLogout}
      />
    </aside>
  );
}
