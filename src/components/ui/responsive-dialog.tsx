import * as React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

// Điện thoại (< 640px): drawer trượt từ đáy. Màn nhỏ / desktop: hộp thoại giữa màn hình (giống chiatien).

const Ctx = React.createContext({ isMobile: false })

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  return (
    <Ctx.Provider value={{ isMobile }}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </Ctx.Provider>
  )
}

export function ResponsiveDialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { isMobile } = React.useContext(Ctx)
  if (isMobile) return <DrawerContent className={cn('mx-auto max-w-lg', className)}>{children}</DrawerContent>
  return <DialogContent className={className}>{children}</DialogContent>
}

export function ResponsiveDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const { isMobile } = React.useContext(Ctx)
  if (isMobile) return <DrawerHeader className={cn('text-left', className)} {...props} />
  return <div className={cn('flex flex-col gap-1.5 px-5 pt-5 pr-12 pb-3', className)} {...props} />
}

export function ResponsiveDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  const { isMobile } = React.useContext(Ctx)
  return isMobile ? <DrawerTitle className={cn('text-lg', className)} {...props} /> : <DialogTitle className={cn('text-lg', className)} {...props} />
}

export function ResponsiveDialogDescription({ className, ...props }: React.ComponentProps<typeof DialogDescription>) {
  const { isMobile } = React.useContext(Ctx)
  return isMobile ? <DrawerDescription className={className} {...props} /> : <DialogDescription className={className} {...props} />
}

/** Phần nội dung cuộn được (giữa header và footer). */
export function ResponsiveDialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto px-5', className)} {...props} />
}

export function ResponsiveDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const { isMobile } = React.useContext(Ctx)
  if (isMobile) return <DrawerFooter className={cn('pb-[max(1rem,env(safe-area-inset-bottom))]', className)} {...props} />
  return <div className={cn('flex flex-col gap-2 border-t bg-muted/40 p-4', className)} {...props} />
}
