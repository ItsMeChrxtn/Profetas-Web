import { useEffect } from 'react';

/**
 * Loads the given stylesheet URLs (from Vite `?url` imports) while the
 * calling component is mounted, and removes them on unmount. The original
 * site had two mutually-incompatible unscoped global stylesheets - the
 * customer site (Bootstrap + site.css) and the admin panel (admin.css only,
 * no Bootstrap) - so only one set may be attached to <head> at a time.
 * SiteLayout and AdminLayout each own their own set via this hook.
 */
export function useStylesheets(hrefs) {
  useEffect(() => {
    const links = hrefs.map((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((link) => link.remove());
  }, [hrefs.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
}
