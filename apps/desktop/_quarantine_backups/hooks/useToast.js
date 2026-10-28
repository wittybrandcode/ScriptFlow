import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  showToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    const newToast = { id, message, type }
    set((state) => ({ toasts: [...state.toasts, newToast] }))

    if (duration) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}))

export function useToast() {
  const toasts = useToastStore((state) => state.toasts)
  const showToast = useToastStore((state) => state.showToast)
  const dismissToast = useToastStore((state) => state.dismissToast)
  return { toasts, showToast, dismissToast }
}
