"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  Bus,
  Route,
  Users,
  Ticket,
  Settings,
  Menu,
  X,
  LogOut,
  Brain
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if user is authenticated and is an admin
  if (status === "unauthenticated") {
    router.push("/auth/login?callbackUrl=/admin");
    return null;
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Buses",
      href: "/admin/buses",
      icon: Bus,
    },
    {
      name: "Routes",
      href: "/admin/routes",
      icon: Route,
    },
    {
      name: "Trips",
      href: "/admin/trips",
      icon: Ticket,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: Brain,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-vh-100 d-flex bg-light">
      {/* Sidebar */}
      <aside className="d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm position-fixed start-0 h-100" style={{ width: 240, zIndex: 1040, top: 56 }}>
        <nav className="nav nav-pills flex-column mb-auto mt-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link d-flex align-items-center gap-2 mb-2 px-3 py-2 rounded ${
                  isActive ? "active bg-primary text-white" : "text-dark hover-bg-light"
                }`}
                style={{ fontWeight: 500, fontSize: 16 }}
              >
                <item.icon className="me-2" size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-3 border-top">
          <Link
            href="/auth/logout"
            className="nav-link d-flex align-items-center gap-2 px-3 py-2 rounded text-danger fw-semibold hover-bg-danger hover-text-white"
            style={{ fontSize: 16 }}
          >
            <LogOut className="me-2" size={20} />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-grow-1" style={{ marginLeft: 240 }}>
        <main className="flex-1">
          <div className="py-4 px-3 px-md-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 