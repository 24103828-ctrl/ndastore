import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface TagSettings {
  enabled: boolean;
  productId: string | null;
  text: string;
}

interface ProductInfo {
  name: string;
  price: number;
  sale_price: number | null;
  images: string[] | null;
}

export function NotificationTag() {
  const [settings, setSettings] = useState<TagSettings | null>(null);
  const [productData, setProductData] = useState<ProductInfo | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    // 1. Lấy dữ liệu ban đầu
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'notification_tag_settings')
        .single();
      
      if (data?.value) {
        setSettings(data.value);
      }
    };
    fetchSettings();

    // 2. Lắng nghe Realtime từ Supabase (bảng site_settings đã bật Realtime)
    const channel = supabase.channel('public:site_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: "key=eq.notification_tag_settings" },
        (payload) => {
          if (payload.new && payload.new.value) {
            setSettings(payload.new.value as TagSettings);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'site_settings', filter: "key=eq.notification_tag_settings" },
        (payload) => {
          if (payload.new && payload.new.value) {
            setSettings(payload.new.value as TagSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Tự động lấy thông tin sản phẩm dựa trên productId từ Admin
  useEffect(() => {
    if (settings?.productId) {
      const fetchProduct = async () => {
        const { data } = await supabase
          .from('products')
          .select('name, price, sale_price, images')
          .eq('id', settings.productId as string)
          .single();
        if (data) {
          setProductData(data as ProductInfo);
        }
      };
      fetchProduct();
    } else {
      setProductData(null);
    }
  }, [settings?.productId]);

  // Nếu tắt trong Admin, hoặc chưa gắn sản phẩm, HOẶC user vừa bấm 'X' đóng thì sẽ ẩn
  if (!settings || !settings.enabled || !productData || isClosed) return null;

  // Lấy ảnh đầu tiên hoặc ảnh mặc định
  const displayImage = productData.images?.[0] || 'https://via.placeholder.com/150';
  
  // Tính toán nhãn giảm giá
  let discountDisplay = '';
  if (productData.sale_price && productData.price) {
    const percent = Math.round((1 - productData.sale_price / productData.price) * 100);
    if (percent > 0) discountDisplay = `-${percent}%`;
    else discountDisplay = 'HOT';
  } else {
    discountDisplay = 'HOT';
  }

  const content = (
    <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-2.5 rounded-2xl shadow-2xl shadow-pink-500/30 flex items-center gap-3 w-[260px] cursor-pointer relative animate-tada group box-border border border-pink-300/50">
      
      {/* Nút Đóng (Dấu X) mờ mờ ở góc phải */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsClosed(true);
        }}
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/40 hover:text-white transition-all z-20"
        aria-label="Đóng thông báo"
      >
        <span className="text-[14px] font-bold leading-none mb-[1px]">&times;</span>
      </button>

      {/* Thumbnail sản phẩm */}
      <img src={displayImage} alt={productData.name} className="w-12 h-12 rounded-xl object-cover bg-white shrink-0 shadow-sm" />
      
      {/* Thông tin Text rút gọn */}
      <div className="flex flex-col flex-1 overflow-hidden pr-3">
        <span className="text-[13px] leading-tight font-bold text-white line-clamp-2 drop-shadow-sm group-hover:scale-[1.02] transform transition-transform origin-left">
          {settings.text} - {productData.name}
        </span>
      </div>

      {/* Nhãn giảm giá nổi bật (Sử dụng màu trắng - chữ hồng tuân thủ Tone) */}
      <div className="absolute -top-3 -right-3 bg-white text-rose-600 text-[11px] font-black px-2 py-0.5 rounded-full border border-pink-100 shadow-md transform rotate-[15deg] group-hover:rotate-[20deg] group-hover:scale-110 transition-all duration-300 z-10">
        {discountDisplay}
      </div>
      
      <style>{`
        @keyframes tada {
          0% { transform: scale3d(1, 1, 1); }
          10%, 20% { transform: scale3d(0.95, 0.95, 0.95) rotate3d(0, 0, 1, -2deg); }
          30%, 50%, 70%, 90% { transform: scale3d(1.05, 1.05, 1.05) rotate3d(0, 0, 1, 2deg); }
          40%, 60%, 80% { transform: scale3d(1.05, 1.05, 1.05) rotate3d(0, 0, 1, -2deg); }
          100% { transform: scale3d(1, 1, 1); }
        }
        .animate-tada {
          animation: tada 4s ease-in-out infinite; /* Lặp chậm lại để không khó chịu */
        }
      `}</style>
    </div>
  );

  return (
    <div className="fixed top-24 left-6 z-[10001]">
      <Link to={`/product/${settings.productId}`} className="block">
        {content}
      </Link>
    </div>
  );
}
