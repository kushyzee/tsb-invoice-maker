"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  History,
  MenuIcon,
  Plus,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Menu,
  MenuContent,
  MenuLinkItem,
  MenuTrigger,
} from "@/components/ui/menu"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

// Single source of truth: the desktop links and the mobile menu are two
// presentations of this list, never two separately maintained navs.
const NAV_ITEMS: NavItem[] = [
  { href: "/new", label: "New", icon: Plus },
  { href: "/history", label: "History", icon: History },
  { href: "/finance", label: "Finances", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
]

// New stays in the header at every width; the rest collapse into the menu
// below `sm`.
const [newItem, ...menuItems] = NAV_ITEMS

/** Nested routes mark their section active, e.g. `/history/<id>` → History. */
function isActivePath(pathname: string, href: string) {
  const current = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  return current === href || current.startsWith(`${href}/`)
}

export function AppHeader() {
  const pathname = usePathname()
  const newIsActive = isActivePath(pathname, newItem.href)

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <span className="min-w-0 flex-1 truncate text-lg font-semibold text-neutral-900">
          TSB Invoice Maker
        </span>

        <nav aria-label="Main" className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {menuItems.map((item) => {
              const active = isActivePath(pathname, item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      buttonVariants({
                        variant: active ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      !active && "text-neutral-600"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <Link
          href={newItem.href}
          aria-current={newIsActive ? "page" : undefined}
          aria-label="New invoice"
          className={cn(
            buttonVariants({
              // On /new the solid variant would sit next to that page's own
              // solid "Save invoice" as a second competing primary.
              variant: newIsActive ? "outline" : "default",
              size: "sm",
            }),
            "w-9 px-0 sm:w-auto sm:px-4"
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Link>

        {/*
          modal={false} keeps the New button beside the hamburger tappable while
          the menu is open; the default modal state renders a backdrop that
          would swallow the first tap.
        */}
        <Menu modal={false}>
          <MenuTrigger
            aria-label="Main menu"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "sm:hidden"
            )}
          >
            <MenuIcon className="h-4 w-4" />
          </MenuTrigger>

          <MenuContent>
            {menuItems.map((item) => {
              const active = isActivePath(pathname, item.href)

              return (
                <MenuLinkItem
                  key={item.href}
                  render={<Link href={item.href} />}
                  label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    active && "border-l-primary font-semibold text-neutral-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </MenuLinkItem>
              )
            })}
          </MenuContent>
        </Menu>
      </div>
    </header>
  )
}
