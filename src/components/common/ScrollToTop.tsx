import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lắng nghe thay đổi routing và tự động cuộn lên đầu trang.
 * Không thay đổi UI hay cấu trúc nội dung.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}
