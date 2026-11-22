import * as React from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** <select> gốc của trình duyệt (danh sách dài, chọn tốt trên điện thoại) nhưng cùng kiểu với Input. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          'h-10 w-full min-w-0 appearance-none rounded-xl border border-transparent bg-muted pr-9 pl-2.5 text-base transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:border-brand focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-brand/35 disabled:opacity-50 md:text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { NativeSelect }
