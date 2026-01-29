import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Heart, TrendingUp, Users, Package, ArrowRight, ExternalLink, Search, Clock, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerDetailModal } from '../../components/admin/CustomerDetailModal';

interface ProductStats {
    id: string;
    name: string;
    images: string[];
    favorite_count: number;
    total_view_duration: number;
    cart_count: number;
}

interface UserBehavior {
    id: string;
    full_name: string;
    email: string;
    favorite_count: number;
    total_spent: number;
}

export function CustomerBehavior() {
    const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
    const [topFans, setTopFans] = useState<UserBehavior[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
    const [totalDuration, setTotalDuration] = useState(0);
    const [totalCartAdds, setTotalCartAdds] = useState(0);

    const fetchBehaviorData = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            // 1. Fetch all favorites, product views, and cart additions
            const [favsRes, viewsRes, cartRes, orderItemsRes] = await Promise.all([
                (supabase.from('favorites' as any) as any).select('product_id, products(name, images)'),
                (supabase.from('product_views' as any) as any).select('product_id, duration_seconds'),
                (supabase.from('cart_additions' as any) as any).select('product_id, quantity'),
                (supabase.from('order_items' as any) as any).select('product_id, quantity')
            ]);

            const favData = favsRes.data || [];
            const viewsData = viewsRes.data || [];
            const cartData = cartRes.data || [];
            const orderItemsData = orderItemsRes.data || [];

            // 2. Aggregate Global Stats
            const totalSecs = viewsData.reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0);
            setTotalDuration(totalSecs);

            const cartAddsCount = cartData.reduce((acc: number, curr: any) => acc + (curr.quantity || 1), 0);
            const orderedItemsCount = orderItemsData.reduce((acc: number, curr: any) => acc + (curr.quantity || 1), 0);
            setTotalCartAdds(cartAddsCount + orderedItemsCount);

            // 3. Aggregate Per-Product Stats
            const productStats: Record<string, any> = {};

            // Count favorites (and init base stats)
            favData.forEach((f: any) => {
                if (!productStats[f.product_id]) {
                    productStats[f.product_id] = {
                        id: f.product_id,
                        name: f.products?.name,
                        images: f.products?.images,
                        favorite_count: 0,
                        total_view_duration: 0,
                        cart_count: 0
                    };
                }
                productStats[f.product_id].favorite_count++;
            });

            // Sum view durations
            viewsData.forEach((v: any) => {
                if (!productStats[v.product_id]) return;
                productStats[v.product_id].total_view_duration += v.duration_seconds;
            });

            // Count cart additions
            cartData.forEach((c: any) => {
                if (!productStats[c.product_id]) return;
                productStats[c.product_id].cart_count = (productStats[c.product_id].cart_count || 0) + (c.quantity || 1);
            });

            // Add ordered items as cart additions (since they were added to cart)
            orderItemsData.forEach((oi: any) => {
                if (!productStats[oi.product_id]) return;
                productStats[oi.product_id].cart_count = (productStats[oi.product_id].cart_count || 0) + (oi.quantity || 1);
            });

            const sortedProducts = Object.values(productStats)
                .sort((a, b) => b.favorite_count - a.favorite_count)
                .slice(0, 5);

            setTopProducts(sortedProducts as any);

            // 4. Aggregate Top Spenders (Customers who spent the most)
            const { data: orderData } = await supabase
                .from('orders')
                .select('user_id, total_amount, profiles(full_name, id, email)')
                .not('status', 'eq', 'cancelled'); // Don't count cancelled orders

            if (orderData) {
                const userSpending: Record<string, any> = {};
                orderData.forEach((o: any) => {
                    const userId = o.user_id;
                    if (!userSpending[userId]) {
                        userSpending[userId] = {
                            id: userId,
                            full_name: o.profiles?.full_name || 'Khách hàng',
                            email: o.profiles?.email,
                            total_spent: 0
                        };
                    }
                    userSpending[userId].total_spent += o.total_amount || 0;
                });

                const sortedUsers = Object.values(userSpending)
                    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
                    .slice(0, 5)
                    .map(u => ({
                        id: u.id,
                        full_name: u.full_name,
                        email: u.email,
                        total_spent: u.total_spent,
                        favorite_count: 0 // Keep interface compat for now
                    }));

                setTopFans(sortedUsers as any);
            }

        } catch (error) {
            console.error('Error fetching behavior data:', error);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        fetchBehaviorData(true);

        const favoritesChannel = supabase
            .channel('favorites_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites' }, () => {
                fetchBehaviorData();
            })
            .subscribe();

        const viewsChannel = supabase
            .channel('views_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'product_views' }, () => {
                fetchBehaviorData();
            })
            .subscribe();

        const cartChannel = supabase
            .channel('cart_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_additions' }, () => {
                fetchBehaviorData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(favoritesChannel);
            supabase.removeChannel(viewsChannel);
            supabase.removeChannel(cartChannel);
        };
    }, []);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5);
        setSearchResults(data || []);
    };

    const handleProductSearch = async (query: string) => {
        setProductSearchQuery(query);
        if (query.length < 2) {
            setProductSearchResults([]);
            return;
        }

        try {
            // 1. Search products
            const { data: products } = await supabase
                .from('products')
                .select('id, name, images')
                .ilike('name', `%${query}%`)
                .limit(5);

            if (!products || products.length === 0) {
                setProductSearchResults([]);
                return;
            }

            const productIds = products.map(p => p.id);

            // 2. Fetch stats for these products
            const [favsRes, viewsRes] = await Promise.all([
                (supabase.from('favorites' as any) as any).select('product_id').in('product_id', productIds),
                (supabase.from('product_views' as any) as any).select('product_id, duration_seconds').in('product_id', productIds)
            ]);

            const favData = favsRes.data || [];
            const viewsData = viewsRes.data || [];

            // 3. Map stats to original product list
            const enrichedResults = products.map(p => {
                const favorite_count = favData.filter((f: any) => f.product_id === p.id).length;
                const total_view_duration = viewsData
                    .filter((v: any) => v.product_id === p.id)
                    .reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0);

                return {
                    ...p,
                    favorite_count,
                    total_view_duration
                };
            });

            setProductSearchResults(enrichedResults);
        } catch (error) {
            console.error('Error searching products:', error);
        }
    };

    const handleViewDetail = (customerId: string) => {
        setSelectedCustomerId(customerId);
        setIsModalOpen(true);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[400px]">Đang tải...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Hành vi khách hàng</h1>
                    <p className="text-gray-500 text-sm">Phân tích mức độ quan tâm của khách hàng đối với sản phẩm.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Customer Search */}
                    <div className="relative w-full md:w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm khách hàng..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                            />
                        </div>
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => {
                                            handleViewDetail(user.id);
                                            setSearchResults([]);
                                            setSearchQuery('');
                                        }}
                                        className="w-full p-3 text-left hover:bg-stone-50 transition-colors flex items-center justify-between group border-b border-stone-50 last:border-0"
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-dark">{user.full_name}</p>
                                            <p className="text-[10px] text-gray-400">{user.email}</p>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-primary" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Search */}
                    <div className="relative w-full md:w-64">
                        <div className="relative">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tra cứu sản phẩm..."
                                value={productSearchQuery}
                                onChange={(e) => handleProductSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                            />
                        </div>
                        {productSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                                {productSearchResults.map((product) => (
                                    <div key={product.id} className="p-3 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                                        <div className="flex items-center gap-3 mb-2">
                                            <img src={product.images?.[0]} alt="" className="w-8 h-8 rounded object-cover" />
                                            <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] text-pink-500 flex items-center gap-1 font-bold">
                                                <Heart className="w-3 h-3" /> {product.favorite_count} lượt
                                            </p>
                                            <p className="text-[10px] text-blue-500 flex items-center gap-1 font-bold">
                                                <Clock className="w-3 h-3" /> {Math.floor(product.total_view_duration / 60)}p {product.total_view_duration % 60}s
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        setProductSearchResults([]);
                                        setProductSearchQuery('');
                                    }}
                                    className="w-full p-2 text-[10px] text-gray-400 text-center hover:bg-stone-100 transition-colors"
                                >
                                    Đóng kết quả
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng thời gian ngắm</p>
                        <p className="text-2xl font-black text-gray-900">
                            {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                        <Heart className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng lượt thả tym</p>
                        <p className="text-2xl font-black text-gray-900">
                            {topProducts.reduce((acc, curr) => acc + curr.favorite_count, 0)}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lượt thêm giỏ hàng</p>
                        <p className="text-2xl font-black text-gray-900">{totalCartAdds}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Favorited Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h2 className="font-bold text-gray-900">Sản phẩm được yêu thích nhất</h2>
                        </div>
                        <Heart className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="p-0">
                        {topProducts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Chưa có dữ liệu yêu thích.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {topProducts.map((product, idx) => (
                                    <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                                            #{idx + 1}
                                        </div>
                                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={product.images?.[0]} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{product.name}</h3>
                                            <div className="flex items-center gap-3">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Heart className="w-3 h-3 text-pink-400" />
                                                    {product.favorite_count} lượt
                                                </p>
                                                <p className="text-xs text-blue-500 font-bold flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {Math.floor(product.total_view_duration / 60)}p {product.total_view_duration % 60}s
                                                </p>
                                                <p className="text-xs text-amber-500 font-bold flex items-center gap-1">
                                                    <ShoppingBag className="w-3 h-3" />
                                                    {product.cart_count || 0} giỏ
                                                </p>
                                            </div>
                                        </div>
                                        <Link to={`/product/${product.id}`} className="p-2 text-gray-400 hover:text-primary transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Spenders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-amber-500" />
                            <h2 className="font-bold text-gray-900">Top khách hàng chi tiêu</h2>
                        </div>
                        <TrendingUp className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="p-0">
                        {topFans.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Chưa có dữ liệu hoạt động.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {topFans.map((user, idx) => (
                                    <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-gray-900">{user.full_name}</h3>
                                            <p className="text-[10px] text-gray-400 font-mono">{user.email}</p>
                                            <p className="text-xs text-primary font-bold">Tổng chi tiêu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.total_spent)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleViewDetail(user.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-primary transition-all flex items-center gap-1 text-xs font-bold"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Chi tiết
                                        </button>
                                        <div className="bg-amber-50 px-3 py-1 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-wider transition-opacity group-hover:opacity-0">
                                            VIP
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CustomerDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customerId={selectedCustomerId || ''}
            />
        </div>
    );
}
