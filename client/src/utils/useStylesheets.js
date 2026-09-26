import { useEffect, useState } from 'react';

/**
 * Loads the given stylesheet URLs (from Vite `?url` imports) while the
 * calling component is mounted, and removes them on unmount. The original
 * site had two mutually-incompatible unscoped global stylesheets - the
 * customer site (Bootstrap + site.css) and the admin panel (admin.css only,
 * no Bootstrap) - so only one set may be attached to <head> at a time.
 * SiteLayout and AdminLayout each own their own set via this hook.
 *
 * Returns true once every sheet has loaded, so layouts can hold off
 * rendering and avoid a flash of unstyled content on a hard refresh.
 */
export function useStylesheets(hrefs) {
  const key = hrefs.join('|');
  const [loadedKey, setLoadedKey] = useState(null);

  useEffect(() => {
    let pending = hrefs.length;
    const done = () => {
      pending -= 1;
      if (pending === 0) setLoadedKey(key);
    };
    const links = hrefs.map((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      // Count errors too so a failed sheet never leaves the page blank.
      link.onload = done;
      link.onerror = done;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((link) => link.remove());
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return loadedKey === key;
}
