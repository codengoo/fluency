import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

/** Trùng breakpoint `< 640px` (dưới `sm`) của Tailwind - thuần điện thoại di động. */
export const useIsMobile = () => useMediaQuery('(max-width: 639px)')

/** Màn hình nhỏ (tablet / split-screen): từ `sm` (640px) đến trước `lg` (1023px). */
export const useIsSmallScreen = () => useMediaQuery('(min-width: 640px) and (max-width: 1023px)')

/** Trùng breakpoint `lg` của Tailwind (>= 1024px) - máy tính / màn hình lớn. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
