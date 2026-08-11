import { useEffect, useRef, useState } from "react"

export function useSize(ref) {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  })

  const resizeObserverRef = useRef(null)

  useEffect(() => {
    const element = ref?.current

    if (!element) {
      return
    }

    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) && entries.length > 0) {
        return
      }
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })

    resizeObserverRef.current.observe(element)

    const { width, height } = element.getBoundingClientRect()
    setSize({ width, height })

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [ref])

  return size
}

export default useSize
