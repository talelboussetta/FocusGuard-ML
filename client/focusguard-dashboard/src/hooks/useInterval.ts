import { useEffect, useRef } from 'react'

/**
 * Custom hook for setInterval with cleanup
 * @param callback - Function to call on each interval
 * @param delay - Delay in milliseconds (null to stop)
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) {
      return
    }

    const id = setInterval(() => savedCallback.current(), delay)

    return () => clearInterval(id)
  }, [delay])
}
