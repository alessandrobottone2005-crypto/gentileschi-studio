import { useCallback, useEffect, useRef, useState } from 'react';
export function useResource<T>(
  loader: () => Promise<T>,
  dispose?: (data: T) => void,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const current = useRef<T | null>(null);
  const sequence = useRef(0);
  const mounted = useRef(false);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const next = await loader();
      if (!mounted.current || request !== sequence.current) {
        dispose?.(next);
        return;
      }
      if (current.current) dispose?.(current.current);
      current.current = next;
      setData(next);
    } catch (cause) {
      if (mounted.current && request === sequence.current)
        setError(
          cause instanceof Error
            ? cause.message
            : 'Caricamento non riuscito. Riprova.',
        );
    } finally {
      if (mounted.current && request === sequence.current) setLoading(false);
    }
  }, [loader, dispose]);
  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
      sequence.current++;
      if (current.current) dispose?.(current.current);
      current.current = null;
    };
  }, [reload, dispose]);
  return { data, loading, error, reload };
}
