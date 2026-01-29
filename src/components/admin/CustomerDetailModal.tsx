import { useState, useEffect } from 'react';
import { X, User, Heart, CreditCard, MapPin, Phone, Mail, TrendingUp, Clock, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
}

export function CustomerDetailModal({ isOpen, onClose, customerId }: CustomerDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [activeCart, setActiveCart] = useState<any[]>([]);
    const [engagedViews, setEngagedViews] = useState<any[]>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalViewSeconds, setTotalViewSeconds] = useState(0);

    useEffect(() => {
        if (isOpen && customerId) {
            fetchCustomerDetails();
        }
    }, [isOpen, customerId]);

    const fetchCustomerDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', customerId)
                .single();
            setProfile(profileData);

            // 2. Fetch Favorites
            const { data: favData } = await (supabase.from('favorites' as any) as any)
                .select('product_id, products(*, category:categories(name))')
                .eq('user_id', customerId);
            setFavorites(favData || []);

            // 2.5 Fetch Active Cart (Added but not purchased)
            const { data: cartData } = await (supabase.from('cart_additions' as any) as any)
                .select('product_id, quantity, color, products(*, category:categories(name))')
                .eq('user_id', customerId);
            setActiveCart(cartData || []);

            // 3. Fetch Total Spent
            const { data: ordersData } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('user_id', customerId);

            const total = ordersData?.reduce((acc, order) => acc + order.total_amount, 0) || 0;
            setTotalSpent(total);

            // 4. Fetch Product Views
            const { data: viewsData } = await (supabase.from('product_views' as any) as any)
                .select('product_id, duration_seconds, products(*, category:categories(name))')
                .eq('user_id', customerId);

            if (viewsData) {
                let totalSecs = 0;
                // Aggregate durations if multiple views for same product
                const aggregated: Record<string, any> = {};
                viewsData.forEach((v: any) => {
                    totalSecs += v.duration_seconds;
                    if (!aggregated[v.product_id]) {
                        aggregated[v.product_id] = { ...v, total_duration: 0 };
                    }
                    aggregated[v.product_id].total_duration += v.duration_seconds;
                });

                setTotalViewSeconds(totalSecs);

                // Filter for "ngắm lâu nhất" (engagement > 30s total or single)
                // The user specified "ngắm trên 30s"
                const sorted = Object.values(aggregated)
                    .filter((v: any) => v.total_duration >= 30)
                    .sort((a: any, b: any) => b.total_duration - a.total_duration);

                setEngagedViews(sorted);
            }

        } catch (error) {
            console.error('Error fetching customer details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatPrice = (p: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Chi tiết khách hàng</h2>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">ID: {customerId.slice(0, 8)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            <p className="text-gray-500 font-medium">Đang tải thông tin khách hàng...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Thông tin liên hệ</h3>
                                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <User className="w-4 h-4 text-stone-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-stone-500">Họ và tên</p>
                                                <p className="font-bold text-gray-900">{profile?.full_name || 'Hệ thống'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-4 h-4 text-stone-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-stone-500">Email</p>
                                                <p className="font-bold text-gray-900 break-all">{profile?.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="w-4 h-4 text-stone-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-stone-500">Số điện thoại</p>
                                                <p className="font-bold text-gray-900">{profile?.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-stone-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-stone-500">Địa chỉ</p>
                                                <p className="font-bold text-gray-900 text-sm">{profile?.address || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Thống kê mua sắm</h3>
                                        <div className="bg-gradient-to-br from-primary to-pink-600 p-6 rounded-xl text-white shadow-lg">
                                            <CreditCard className="w-8 h-8 opacity-50 mb-4" />
                                            <p className="text-sm opacity-80 mb-1">Tổng cộng đã chi</p>
                                            <p className="text-3xl font-black">{formatPrice(totalSpent)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Mức độ quan tâm</h3>
                                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg">
                                            <Clock className="w-8 h-8 opacity-50 mb-4" />
                                            <p className="text-sm opacity-80 mb-1">Tổng thời gian ngắm</p>
                                            <p className="text-3xl font-black">
                                                {Math.floor(totalViewSeconds / 60)}p {totalViewSeconds % 60}s
                                            </p>
                                            <p className="text-[10px] opacity-60 mt-2 italic">* Tính từ khi bắt đầu theo dõi</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center/Right Column: Behavior Insights */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Favorites Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-primary" /> Sản phẩm đã thả tym ({favorites.length})
                                    </h3>

                                    {favorites.length === 0 ? (
                                        <div className="bg-stone-50 rounded-xl border border-dashed border-stone-200 p-8 text-center text-gray-400">
                                            <p className="text-sm">Chưa có sản phẩm yêu thích.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {favorites.map((fav: any) => (
                                                <div key={fav.product_id} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                                                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={fav.products?.images?.[0]} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 truncate">{fav.products?.name}</h4>
                                                        <p className="text-xs text-primary font-bold">{formatPrice(fav.products?.price || 0)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Active Cart Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-amber-500" /> Đang trong giỏ (Chưa mua) ({activeCart.length})
                                    </h3>

                                    {activeCart.length === 0 ? (
                                        <div className="bg-amber-50/30 rounded-xl border border-dashed border-amber-100 p-8 text-center text-gray-400">
                                            <p className="text-sm">Giỏ hàng hiện đang trống.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {activeCart.map((item: any) => (
                                                <div key={`${item.product_id}-${item.color}`} className="flex gap-4 p-3 bg-white border border-amber-100 rounded-xl hover:shadow-sm transition-shadow relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-1 bg-amber-500 text-white text-[8px] font-bold rounded-bl-lg">
                                                        SỐ LƯỢNG: {item.quantity}
                                                    </div>
                                                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={item.products?.images?.[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 truncate">{item.products?.name}</h4>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <p className="text-xs text-amber-600 font-bold">{formatPrice(item.products?.price || 0)}</p>
                                                            {item.color && <span className="text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-gray-500 uppercase">{item.color}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Engaged Views Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-500" /> Sản phẩm ngắm lâu nhất ({engagedViews.length})
                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black ml-auto">PHÁT HIỆN TRÊN 30S</span>
                                    </h3>

                                    {engagedViews.length === 0 ? (
                                        <div className="bg-blue-50/30 rounded-xl border border-dashed border-blue-100 p-8 text-center text-gray-400">
                                            <p className="text-sm">Chưa phát hiện hành vi ngắm lâu.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {engagedViews.map((view: any) => (
                                                <div key={view.product_id} className="flex gap-4 p-3 bg-white border border-blue-100 rounded-xl hover:shadow-sm transition-shadow relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-1 bg-blue-500 text-white text-[8px] font-bold rounded-bl-lg">
                                                        {view.total_duration}s ENGAGED
                                                    </div>
                                                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={view.products?.images?.[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 truncate">{view.products?.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-500 rounded-full"
                                                                    style={{ width: `${Math.min(100, (view.total_duration / 120) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-blue-500">{view.total_duration}s</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-stone-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
