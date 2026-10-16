import { useEffect } from 'react'

export function useKeyboard(actions) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input/textarea
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)
      
      const key = (e.key || '').toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      const alt = e.altKey

      let shortcut = ''
      if (ctrl) shortcut += 'ctrl+'
      if (shift) shortcut += 'shift+'
      if (alt) shortcut += 'alt+'
      shortcut += key

      if (actions[shortcut]) {
        // Special case: allow Ctrl+S and Escape even in inputs
        if (!isInput || ['ctrl+s', 'escape'].includes(shortcut)) {
          actions[shortcut](e)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actions])
}
