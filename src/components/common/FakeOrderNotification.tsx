import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface FakeOrder {
    id: string;
    productName: string;
    productImage: string;
    phoneNumber: string;
    productId: string;
}

export function FakeOrderNotification() {
    const [settings, setSettings] = useState({ enabled: false, interval: 30 });
    const [currentOrder, setCurrentOrder] = useState<FakeOrder | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchProducts();

        // Lắng nghe thay đổi realtime từ Admin
        const channel = supabase
            .channel('site_settings_changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'site_settings',
                filter: 'key=eq.fake_order_settings'
            }, (payload: any) => {
                setSettings(payload.new.value);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchSettings = async () => {
        const { data } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'fake_order_settings')
            .single();

        if (data) setSettings(data.value);
    };

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name, images')
            .limit(20);

        if (data) setProducts(data);
    };

    useEffect(() => {
        if (!settings.enabled || products.length === 0) {
            setIsVisible(false);
            return;
        }

        const showNotification = () => {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const randomPhone = `09${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}${Math.floor(Math.random() * 10)}`;
            const obfuscatedPhone = `${randomPhone.substring(0, 2)}xxxxxxx${randomPhone.substring(9)}`;

            setCurrentOrder({
                id: Math.random().toString(),
                productName: randomProduct.name,
                productImage: randomProduct.images?.[0] || 'https://via.placeholder.com/50',
                phoneNumber: obfuscatedPhone,
                productId: randomProduct.id
            });

            setIsVisible(true);

            // Tự động ẩn sau 5 giây
            setTimeout(() => {
                setIsVisible(false);
            }, 6000);
        };

        // Chạy lần đầu sau 5s
        const initialTimeout = setTimeout(showNotification, 5000);

        // Chạy định kỳ
        const interval = setInterval(showNotification, settings.interval * 1000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [settings, products]);

    return (
        <AnimatePresence>
            {isVisible && currentOrder && (
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 20, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="fixed bottom-6 left-0 z-[60] flex items-center gap-3 bg-white p-2 pr-6 rounded-lg shadow-2xl border border-pink-100 max-w-[320px] sm:max-w-md pointer-events-auto"
                >
                    <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-100">
                        <img
                            src={currentOrder.productImage}
                            alt={currentOrder.productName}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full">
                            <ShoppingBag className="w-2.5 h-2.5" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mb-0.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Khách hàng <span className="font-bold text-gray-700">{currentOrder.phoneNumber}</span>
                        </p>
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-1 mb-0.5 uppercase tracking-tighter">
                            Vừa mua {currentOrder.productName}
                        </h4>
                        <div className="flex items-center justify-between">
                            <Link
                                to={`/product/${currentOrder.productId}`}
                                className="text-[10px] text-primary hover:underline font-medium"
                                onClick={() => setIsVisible(false)}
                            >
                                Xem ngay &rarr;
                            </Link>
                            <span className="text-[9px] text-gray-400 italic">Cách đây vài giây</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-gray-600 p-0.5 rounded-full shadow-md border border-gray-100"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
