import { BarChart3, Package, ShoppingBag, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function Dashboard() {
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        customers: 0,
        revenue: 0
    });

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

        setStats({
            products: productsCount || 0,
            orders: ordersCount || 0,
            customers: customersCount || 0,
            revenue
        });
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
                <h2 className="text-lg font-bold mb-4">Hoạt động gần đây</h2>
                <div className="h-64 flex items-center justify-center text-gray-400">
                    Biểu đồ doanh thu (đang cập nhật)
                </div>
            </div>
        </div>
    );
}
