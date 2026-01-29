import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronUp, Trash2, User, Mail, Phone, MapPin, Package } from 'lucide-react';

interface Order {
    id: string;
    created_at: string;
    full_name: string;
    phone: string;
    email: string;
    address: string;
    total_amount: number;
    status: string;
    payment_method: string;
    items?: any[];
}

export function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();

        // Realtime subscription
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Realtime order update:', payload);
                if (payload.eventType === 'DELETE') {
                    setOrders(prev => prev.filter(o => o.id !== payload.old.id));
                } else {
                    fetchOrders();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        console.log('Fetching orders...');
        const { data, error } = await supabase
            .from('orders')
            .select('*, profiles(email), items:order_items(*, product:products(name, images))')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            alert('Lỗi tải danh sách đơn hàng: ' + error.message);
        } else {
            console.log('Fetched orders:', data);
            const enrichedData = (data || []).map((order: any) => ({
                ...order,
                email: order.profiles?.email || 'N/A'
            }));
            setOrders(enrichedData as any);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này sẽ xóa tất cả dữ liệu liên quan.')) return;

        setDeletingId(id);
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setOrders(prev => prev.filter(o => o.id !== id));
            if (expandedOrder === id) setExpandedOrder(null);
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Lỗi xóa đơn hàng: ' + (error as any).message);
        } finally {
            setDeletingId(null);
        }
    };

    const formatPrice = (p: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'shipping': return 'bg-blue-100 text-blue-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Quản lý đơn hàng</h1>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đặt</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                            <React.Fragment key={order.id}>
                                <tr className={`hover:bg-gray-50 transition-colors ${deletingId === order.id ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{order.full_name}</span>
                                            <span className="text-[10px] text-gray-400">{order.email}</span>
                                            <span className="text-[10px] text-gray-400">{order.phone}</span>
                                            <span className="text-[10px] text-primary truncate max-w-[200px]" title={order.address}>{order.address}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatPrice(order.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-primary ${getStatusColor(order.status)}`}
                                            disabled={deletingId === order.id}
                                        >
                                            <option value="pending">Chờ xác nhận</option>
                                            <option value="shipping">Đang giao</option>
                                            <option value="delivered">Đã giao</option>
                                            <option value="cancelled">Đã hủy</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                disabled={deletingId === order.id}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Xóa đơn hàng"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                className="text-gray-400 hover:text-primary transition-colors"
                                            >
                                                {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedOrder === order.id && (
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={6} className="px-6 py-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Left: Product Details */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-primary" />
                                                        Chi tiết sản phẩm
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {order.items?.map((item: any) => (
                                                            <li key={item.id} className="flex items-start justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                                <div className="flex gap-3">
                                                                    <img src={item.product?.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-gray-900">{item.product?.name}</span>
                                                                        <span className="text-xs text-gray-500">Số lượng: {item.quantity}</span>
                                                                        {item.selected_color && (
                                                                            <span className="text-[10px] text-primary font-bold bg-pink-50 px-1.5 py-0.5 rounded w-fit mt-1 border border-primary/10">Màu: {item.selected_color}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                                        <span className="text-xs text-gray-500">PTTT: {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</span>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">Tổng cộng</p>
                                                            <p className="text-lg font-black text-primary">{formatPrice(order.total_amount)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Customer Information */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <User className="w-4 h-4 text-blue-500" />
                                                        Thông tin người nhận
                                                    </h4>
                                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                                <User className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Họ tên</p>
                                                                <p className="text-sm font-bold text-gray-900">{order.full_name}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                                                <Mail className="w-4 h-4 text-purple-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Email</p>
                                                                <p className="text-sm font-bold text-gray-900">{order.email}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                                                <Phone className="w-4 h-4 text-green-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Số điện thoại</p>
                                                                <p className="text-sm font-bold text-gray-900">{order.phone}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <MapPin className="w-4 h-4 text-red-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Địa chỉ giao hàng</p>
                                                                <p className="text-sm font-medium text-gray-600 leading-relaxed">{order.address}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">Chưa có đơn hàng nào.</div>
                )}
            </div>
        </div>
    );
}

import React from 'react';
