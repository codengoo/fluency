import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '@/lib/utils'

const DrawerContext = React.createContext<{ isInsideDrawer: boolean }>({
  isInsideDrawer: false,
})

export function useIsInsideDrawer() {
  return React.useContext(DrawerContext).isInsideDrawer
}

function Drawer({
  children,
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      repositionInputs={repositionInputs}
      {...props}
    >
      <DrawerContext.Provider value={{ isInsideDrawer: true }}>
        {children}
      </DrawerContext.Provider>
    </DrawerPrimitive.Root>
  )
}

function DrawerNestedRoot({
  children,
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  const { isInsideDrawer } = React.useContext(DrawerContext)
  if (isInsideDrawer) {
    return (
      <DrawerPrimitive.NestedRoot data-slot="drawer-nested-root" {...props}>
        {children}
      </DrawerPrimitive.NestedRoot>
    )
  }
  return (
    <DrawerPrimitive.Root
      data-slot="drawer-nested-root"
      repositionInputs={repositionInputs}
      {...props}
    >
      <DrawerContext.Provider value={{ isInsideDrawer: true }}>
        {children}
      </DrawerContext.Provider>
    </DrawerPrimitive.Root>
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs duration-500 data-state-closed:duration-300 data-state-open:animate-in data-state-open:fade-in-0 data-state-closed:animate-out data-state-closed:fade-out-0',
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  showHandle = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  showHandle?: boolean
}) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[1.75rem] border-t bg-popover text-popover-foreground shadow-2xl outline-none no-scrollbar touch-pan-y',
          className
        )}
        {...props}
      >
        {showHandle && (
          <DrawerPrimitive.Handle className="mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors cursor-grab active:cursor-grabbing" />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex flex-col gap-1.5 px-5 pb-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4 pt-2', className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-base font-semibold leading-tight text-foreground', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerNestedRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
