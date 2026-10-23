import { useEffect, useState } from 'react';

// Asinxron ma'lumot yuklash; deps o'zgarsa qayta yuklaydi, eski javoblarni e'tiborsiz qoldiradi
export function useAsync(fn, deps) {
  const [st, setSt] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    setSt({ data: null, error: null, loading: true });
    Promise.resolve()
      .then(fn)
      .then(
        data => alive && setSt({ data, error: null, loading: false }),
        error => alive && setSt({ data: null, error, loading: false }),
      );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return st;
}
