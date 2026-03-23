import { BarChart3, Package, ShoppingBag, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

export function Dashboard() {
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        customers: 0,
        revenue: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [fakeOrderSettings, setFakeOrderSettings] = useState({ enabled: true, interval: 30 });
    const [notificationTagSettings, setNotificationTagSettings] = useState({ enabled: false, productId: null as string | null, text: '🔥 Sản phẩm HOT đang giảm giá!' });
    const [bgSettings, setBgSettings] = useState({ url: '' });
    const [musicPlayerSettings, setMusicPlayerSettings] = useState({ show_button: true, auto_play: false, url: '' });
    const [products, setProducts] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // 1. Products Count
        const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

        // 2. Orders Count (Total)
        const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });

        // 3. Customers Count (Profiles)
        const { count: customersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

        // 4. Revenue (Sum of total_amount from orders where status != cancelled)
        const { data: revenueData } = await supabase
            .from('orders')
            .select('total_amount')
            .neq('status', 'cancelled');

        const revenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        // 5. Chart Data (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const { data: recentOrders } = await supabase
            .from('orders')
            .select('created_at, total_amount')
            .gte('created_at', sevenDaysAgo.toISOString())
            .neq('status', 'cancelled');

        const chartMap = new Map();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            chartMap.set(dateStr, 0);
        }

        recentOrders?.forEach(order => {
            const dateStr = new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            if (chartMap.has(dateStr)) {
                chartMap.set(dateStr, chartMap.get(dateStr) + (order.total_amount || 0));
            }
        });

        const formattedChartData = Array.from(chartMap.entries())
            .map(([name, amount]) => ({ name, amount }))
            .reverse();

        setChartData(formattedChartData);

        setStats({
            products: productsCount || 0,
            orders: ordersCount || 0,
            customers: customersCount || 0,
            revenue
        });

        // 6. Fake Order Settings
        const { data: settingsData } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'fake_order_settings')
            .single();

        if (settingsData) setFakeOrderSettings(settingsData.value);

        // 7. Notification Tag Settings
        const { data: tagSettingsData } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'notification_tag_settings')
            .single();

        if (tagSettingsData?.value) setNotificationTagSettings(tagSettingsData.value);

        // 8. Background Settings
        const { data: bgData } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'shop_background_url')
            .single();
        if (bgData?.value) setBgSettings(bgData.value);

        // 9. Music Player Settings
        const { data: musicData } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'music_player_settings')
            .single();
        if (musicData?.value) setMusicPlayerSettings({
            show_button: musicData.value.show_button ?? musicData.value.enabled ?? true,
            auto_play: musicData.value.auto_play ?? false,
            url: musicData.value.url ?? ''
        });

        // Fetch products for dropdown
        const { data: productsData } = await supabase
            .from('products')
            .select('id, name')
            .order('created_at', { ascending: false });
        if (productsData) setProducts(productsData);
    };

    const handleUpdateSettings = async (newSettings: any) => {
        setIsSaving(true);
        const { error } = await supabase
            .from('site_settings')
            .update({
                key: 'fake_order_settings',
                value: newSettings
            } as any)
            .eq('key', 'fake_order_settings');

        if (!error) {
            setFakeOrderSettings(newSettings);
        }
        setIsSaving(false);
    };

    const handleUpdateTagSettings = async (newSettings: any) => {
        setIsSaving(true);
        
        // Ensure record exists or updates normally
        const { error } = await supabase
            .from('site_settings')
            .upsert({
                key: 'notification_tag_settings',
                value: newSettings
            } as any, { onConflict: 'key' });

        if (!error) {
            setNotificationTagSettings(newSettings);
        }
        setIsSaving(false);
    };

    const handleUpdateBgSettings = async (url: string) => {
        setIsSaving(true);
        const newSettings = { url };
        const { error } = await supabase
            .from('site_settings')
            .upsert({
                key: 'shop_background_url',
                value: newSettings
            } as any, { onConflict: 'key' });

        if (!error) {
            setBgSettings(newSettings);
        }
        setIsSaving(false);
    };

    const handleUpdateMusicSettings = async (newSettings: {show_button: boolean; auto_play: boolean; url: string}) => {
        setIsSaving(true);
        // BƯỚC 1: Ép kiểu rõ ràng về Boolean trước khi gọi API UPSERT
        const payloadValue = { 
            show_button: Boolean(newSettings.show_button), 
            auto_play: Boolean(newSettings.auto_play), 
            url: newSettings.url || '' 
        };
        const { error } = await supabase
            .from('site_settings')
            .upsert({
                key: 'music_player_settings',
                value: payloadValue
            } as any, { onConflict: 'key' });

        if (!error) {
            setMusicPlayerSettings(payloadValue);
        }
        setIsSaving(false);
    };

    const statCards = [
        { label: 'Tổng Doanh thu', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue), icon: BarChart3, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Đơn hàng', value: stats.orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Sản phẩm', value: stats.products, icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Khách hàng', value: stats.customers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-8">Tổng quan</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-bold mb-6">Doanh thu 7 ngày gần nhất</h2>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value)), 'Doanh thu']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#ec4899"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick Settings */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-bold mb-6">Cấu hình Website</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Setting 1: Fake Orders */}
                    <div className="space-y-6 bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-800 text-base">Thông báo mua hàng giả lập</h4>
                                <p className="text-sm text-gray-500 mt-1">Hiển thị popup khách hàng vừa mua sản phẩm ở góc dưới.</p>
                            </div>
                            <button
                                onClick={() => handleUpdateSettings({ ...fakeOrderSettings, enabled: !fakeOrderSettings.enabled })}
                                disabled={isSaving}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                    fakeOrderSettings.enabled ? "bg-primary" : "bg-gray-200"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                        fakeOrderSettings.enabled ? "translate-x-6" : "translate-x-1"
                                    )}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <h4 className="font-medium text-gray-700 text-sm">Tần suất hiển thị</h4>
                                <p className="text-xs text-gray-500 mt-1">Chờ giữa mỗi lần hiện (giây)</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={fakeOrderSettings.interval}
                                    onChange={(e) => handleUpdateSettings({ ...fakeOrderSettings, interval: parseInt(e.target.value) || 30 })}
                                    min="5"
                                    max="3600"
                                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-center text-sm"
                                />
                                <span className="text-sm text-gray-500 font-medium">s</span>
                            </div>
                        </div>
                    </div>

                    {/* Setting 2: Notification Tag */}
                    <div className="space-y-6 bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-800 text-base">Tag Thông Báo Gắn Đầu Trang</h4>
                                <p className="text-sm text-gray-500 mt-1">Hiển thị thanh chạy nổi bật lơ lửng trên cùng website.</p>
                            </div>
                            <button
                                onClick={() => handleUpdateTagSettings({ ...notificationTagSettings, enabled: !notificationTagSettings.enabled })}
                                disabled={isSaving}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                    notificationTagSettings.enabled ? "bg-primary" : "bg-gray-200"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                        notificationTagSettings.enabled ? "translate-x-6" : "translate-x-1"
                                    )}
                                />
                            </button>
                        </div>
                        
                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nội dung thông báo động</label>
                                <input
                                    type="text"
                                    value={notificationTagSettings.text}
                                    onChange={(e) => setNotificationTagSettings({...notificationTagSettings, text: e.target.value})}
                                    onBlur={() => handleUpdateTagSettings(notificationTagSettings)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                                    placeholder="VD: 🔥 Sản phẩm HOT đang giảm giá..."
                                    disabled={!notificationTagSettings.enabled}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Liên kết sự kiện tới Sản phẩm</label>
                                <select
                                    value={notificationTagSettings.productId || ''}
                                    onChange={(e) => handleUpdateTagSettings({...notificationTagSettings, productId: e.target.value || null})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm bg-white"
                                    disabled={!notificationTagSettings.enabled}
                                >
                                    <option value="">-- Không điều hướng (Chỉ hiện chữ) --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Setting 3: Background Image */}
                    <div className="space-y-6 bg-white border border-gray-100 p-5 rounded-xl shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-800 text-base">Ảnh Nền Toàn Website</h4>
                                <p className="text-sm text-gray-500 mt-1">Thay đổi ảnh nền hiển thị trên trang chủ và toàn bộ web (chèn link ảnh trực tiếp).</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Ảnh Nền (Background URL)</label>
                                <input
                                    type="text"
                                    value={bgSettings.url}
                                    onChange={(e) => setBgSettings({ url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                                    placeholder="Ví dụ: https://example.com/flower.jpg"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUpdateBgSettings(bgSettings.url)}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded hover:bg-pink-700 transition"
                                >
                                    Lưu Ảnh Nền
                                </button>
                                <button
                                    onClick={() => handleUpdateBgSettings('')}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200 transition"
                                >
                                    Khôi phục mặc định
                                </button>
                            </div>
                            {bgSettings.url && (
                                <div className="mt-2 relative w-[200px] h-[120px] rounded border border-gray-200 overflow-hidden shadow-inner bg-gray-50">
                                    <img src={bgSettings.url} alt="Preview BG" className="w-full h-full object-cover opacity-80" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Setting 4: Nhạc Nền Mua Sắm */}
                    <div className="space-y-6 bg-white border border-gray-100 p-5 rounded-xl shadow-sm lg:col-span-2">
                        <div className="flex flex-col pb-4 border-b border-gray-100 gap-4">
                            <div>
                                <h4 className="font-bold text-gray-800 text-base">Nhạc Nền Mua Sắm</h4>
                                <p className="text-sm text-gray-500 mt-1">Cấu hình nhạc nền hiển thị và tự động phát trên giao diện người dùng.</p>
                            </div>
                            
                            {/* Toggle 1: Hiển thị nút nghe nhạc */}
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div>
                                    <h5 className="font-medium text-gray-800 text-sm">Hiển thị nút nghe nhạc</h5>
                                    <p className="text-xs text-gray-500 mt-1">Bật để hiển thị icon nhạc nền trôi nổi trên giao diện khách hàng.</p>
                                </div>
                                <button
                                    onClick={() => setMusicPlayerSettings({...musicPlayerSettings, show_button: !musicPlayerSettings.show_button})}
                                    disabled={isSaving}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                        musicPlayerSettings.show_button ? "bg-primary" : "bg-gray-200"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            musicPlayerSettings.show_button ? "translate-x-6" : "translate-x-1"
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Toggle 2: Tự động phát nhạc */}
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div>
                                    <h5 className="font-medium text-gray-800 text-sm">Tự động phát nhạc (Auto-play)</h5>
                                    <p className="text-xs text-orange-500 mt-1">Cảnh báo: Tùy theo chính sách, một số trình duyệt có thể chặn tính năng tự động phát nhạc.</p>
                                </div>
                                <button
                                    onClick={() => setMusicPlayerSettings({...musicPlayerSettings, auto_play: !musicPlayerSettings.auto_play})}
                                    disabled={isSaving}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                        musicPlayerSettings.auto_play ? "bg-primary" : "bg-gray-200"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            musicPlayerSettings.auto_play ? "translate-x-6" : "translate-x-1"
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Nhạc Nền (File .mp3)</label>
                                <input
                                    type="text"
                                    value={musicPlayerSettings.url}
                                    onChange={(e) => setMusicPlayerSettings({ ...musicPlayerSettings, url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                                    placeholder="Ví dụ: https://example.com/audio.mp3"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUpdateMusicSettings(musicPlayerSettings)}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded hover:bg-pink-700 transition"
                                >
                                    Lưu Nhạc Nền
                                </button>
                                <button
                                    onClick={() => handleUpdateMusicSettings({...musicPlayerSettings, url: ''})}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200 transition"
                                >
                                    Khôi phục URL mặc định
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
