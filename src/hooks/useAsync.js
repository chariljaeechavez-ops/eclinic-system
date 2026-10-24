import { useEffect, useState } from 'react'

// Runs fn whenever `key` changes; ignores stale responses. loading is derived, so no setState runs in the effect body.
export function useAsync(fn, key, enabled = true) {
  const [r, setR] = useState({ key: null, data: null, error: '' })
  useEffect(() => {
    if (!enabled) return
    let stale = false
    fn().then((data) => !stale && setR({ key, data, error: '' }))
      .catch((e) => !stale && setR({ key, data: null, error: e.message }))
    return () => { stale = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])
  return { data: r.data, error: r.error, loading: enabled && r.key !== key }
}
