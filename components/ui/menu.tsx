"use client"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

const Menu = MenuPrimitive.Root

function MenuTrigger({ className, ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      className={cn("outline-none select-none", className)}
      {...props}
    />
  )
}

function MenuContent({
  className,
  children,
  side = "bottom",
  sideOffset = 8,
  align = "end",
  alignOffset = 0,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
      >
        <MenuPrimitive.Popup
          data-slot="menu-content"
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-auto min-w-44 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-none bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function MenuLinkItem({
  className,
  // Base UI defaults this to false for link items (unlike plain menu items),
  // which would leave the menu open over the page it just navigated to.
  closeOnClick = true,
  ...props
}: MenuPrimitive.LinkItem.Props) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="menu-link-item"
      closeOnClick={closeOnClick}
      className={cn(
        // The transparent left border reserves the space an active item's
        // accent bar occupies, so marking a route active shifts no layout.
        "relative flex w-full cursor-pointer items-center gap-2.5 rounded-none border-l-2 border-l-transparent py-2 pr-3 pl-2.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  )
}

export { Menu, MenuContent, MenuLinkItem, MenuTrigger }
