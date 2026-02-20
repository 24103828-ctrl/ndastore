import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Package, User as UserIcon, LogOut, Copy } from 'lucide-react';

interface Order {
    id: string;
    created_at: string;
    total_amount: number;
    status: string | null;
    payment_method: string | null;
    full_name: string | null;
    phone: string | null;
    address: string | null;
    items?: any[];
}

interface Profile {
    full_name: string | null;
    phone: string | null;
    address: string | null;
}

export function Account() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) setProfile(profileData);

            // Fetch Orders with items and products
            const { data: ordersData } = await supabase
                .from('orders')
                .select('*, items:order_items(*, product:products(name, images))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (ordersData) setOrders(ordersData as any);

        } catch (error) {
            console.error('Error fetching account data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const formatPrice = (p: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'shipping': return 'bg-blue-100 text-blue-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string | null) => {
        switch (status) {
            case 'pending': return 'Chờ xác nhận';
            case 'shipping': return 'Đang giao';
            case 'delivered': return 'Đã giao';
            case 'cancelled': return 'Đã hủy';
            default: return status || 'Không xác định';
        }
    };

    if (loading) return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="bg-stone-50 min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                        {/* Sidebar */}
                        <div className="md:col-span-1 space-y-4">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-stone-100 p-3 rounded-full">
                                        <UserIcon className="w-6 h-6 text-stone-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-stone-500">Xin chào,</p>
                                        <p className="font-bold">{profile?.full_name || user?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 text-red-500 hover:text-red-700 w-full pt-4 border-t border-stone-100 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" /> Đăng xuất
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="md:col-span-3 space-y-8">

                            {/* Profile Info */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-primary" /> Thông tin cá nhân
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                    <div className="bg-stone-50 p-4 rounded-lg">
                                        <p className="text-stone-500 mb-1">Họ và tên</p>
                                        <p className="font-semibold text-stone-900">{profile?.full_name || 'Chưa cập nhật'}</p>
                                    </div>
                                    <div className="bg-stone-50 p-4 rounded-lg">
                                        <p className="text-stone-500 mb-1">Email</p>
                                        <p className="font-semibold text-stone-900">{user?.email}</p>
                                    </div>
                                    <div className="bg-stone-50 p-4 rounded-lg">
                                        <p className="text-stone-500 mb-1">Số điện thoại</p>
                                        <p className="font-semibold text-stone-900">{profile?.phone || 'Chưa cập nhật'}</p>
                                    </div>
                                    <div className="bg-stone-50 p-4 rounded-lg">
                                        <p className="text-stone-500 mb-1">Địa chỉ</p>
                                        <p className="font-semibold text-stone-900 leading-relaxed">{profile?.address || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Orders */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold flex items-center gap-2 text-stone-900">
                                        <Package className="w-5 h-5 text-primary" /> Lịch sử đơn hàng
                                    </h2>
                                </div>

                                {orders.length === 0 ? (
                                    <div className="text-center py-12 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
                                        <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                        <p className="text-stone-500 font-medium">Bạn chưa có đơn hàng nào.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {orders.map(order => (
                                            <div key={order.id} className="border border-stone-100 rounded-xl overflow-hidden hover:border-primary transition-all duration-300 bg-white shadow-sm hover:shadow-md">
                                                <div className="flex flex-col">
                                                    {/* Header: ID, Date, Status */}
                                                    <div className="flex items-center justify-between bg-stone-50/50 px-6 py-4 border-b border-stone-100">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className="font-bold text-primary tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</p>
                                                                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-widest">{formatDate(order.created_at)}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)} ring-1 ring-inset ring-current/10`}>
                                                            {getStatusText(order.status)}
                                                        </span>
                                                    </div>

                                                    {/* Product List */}
                                                    <div className="px-6 py-4 space-y-4">
                                                        {order.items?.map((item: any) => (
                                                            <div key={item.id} className="flex justify-between items-center group/item">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative w-14 h-14 bg-stone-100 rounded-lg overflow-hidden border border-stone-100 flex-shrink-0">
                                                                        {item.product?.images?.[0] ? (
                                                                            <img
                                                                                src={item.product.images[0]}
                                                                                alt={item.product.name}
                                                                                className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                                                                            />
                                                                        ) : (
                                                                            <Package className="w-6 h-6 text-stone-300 absolute inset-0 m-auto" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-stone-800 text-sm line-clamp-1">{item.product?.name}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="text-[11px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                                                                            {item.selected_color && (
                                                                                <span className="text-[11px] text-primary font-bold bg-pink-50 px-1.5 py-0.5 rounded border border-primary/10">Màu: {item.selected_color}</span>
                                                                            )}
                                                                            <span className="text-[11px] text-stone-400 font-medium">{formatPrice(item.price)} / sản phẩm</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <p className="font-bold text-stone-900 text-sm">{formatPrice(item.price * item.quantity)}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Row 3: Shipping Details */}
                                                    <div className="px-6 py-4 bg-stone-50/50 border-t border-stone-50">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <p className="text-stone-400 font-medium uppercase tracking-tighter mb-1">Người nhận</p>
                                                                <p className="font-semibold text-stone-800">{order.full_name || 'N/A'}</p>
                                                                <p className="text-stone-600 mt-0.5">{order.phone || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-stone-400 font-medium uppercase tracking-tighter mb-1">Địa chỉ giao hàng</p>
                                                                <p className="font-medium text-stone-700 leading-relaxed">{order.address || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer: Total and Payment Method */}
                                                    <div className="bg-white px-6 py-4 border-t border-stone-100 flex flex-col gap-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-stone-300"></div>
                                                                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                                                    {order.payment_method === 'cod' ? 'Thanh toán COD' : 'Chuyển khoản'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Tổng giá trị đơn hàng</p>
                                                                <p className="text-lg font-black text-primary leading-none">{formatPrice(order.total_amount)}</p>
                                                            </div>
                                                        </div>

                                                        {/* QR Code Section for Pending Banking Orders */}
                                                        {order.payment_method === 'banking' && order.status === 'pending' && (
                                                            <div className="w-full">
                                                                <button
                                                                    onClick={() => setShowQR(showQR === order.id ? null : order.id)}
                                                                    className="w-full py-2 border border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded font-bold text-sm"
                                                                >
                                                                    {showQR === order.id ? 'Ẩn mã QR' : 'Thanh toán ngay (Xem mã QR)'}
                                                                </button>

                                                                {showQR === order.id && (
                                                                    <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
                                                                        <div className="flex flex-col md:flex-row gap-6 items-center">
                                                                            <div className="w-full md:w-1/3 max-w-[200px]">
                                                                                <img
                                                                                    src={`https://img.vietqr.io/image/VCB-9862595798-compact2.png?amount=${order.total_amount}&addInfo=${`DH${order.id.split('-')[0].toUpperCase()}`}&accountName=PHAM%20HUU%20CUONG`}
                                                                                    alt="Mã QR chuyển khoản"
                                                                                    className="w-full h-auto rounded-lg border border-white shadow-sm"
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1 space-y-2 text-sm w-full">
                                                                                <p className="font-bold text-primary mb-2">Thông tin chuyển khoản</p>
                                                                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                                                                    <span className="text-stone-500">Ngân hàng:</span>
                                                                                    <span className="font-medium">Vietcombank</span>

                                                                                    <span className="text-stone-500">Số tài khoản:</span>
                                                                                    <span className="font-medium">9862595798</span>

                                                                                    <span className="text-stone-500">Chủ tài khoản:</span>
                                                                                    <span className="font-medium">PHAM HUU CUONG</span>

                                                                                    <span className="text-stone-500">Số tiền:</span>
                                                                                    <span className="font-bold text-primary">{formatPrice(order.total_amount)}</span>

                                                                                    <span className="text-stone-500">Nội dung:</span>
                                                                                    <span className="font-bold flex items-center gap-2">
                                                                                        {`DH${order.id.split('-')[0].toUpperCase()}`}
                                                                                        <Copy
                                                                                            className="w-3.5 h-3.5 cursor-pointer text-stone-400 hover:text-primary"
                                                                                            onClick={() => {
                                                                                                navigator.clipboard.writeText(`DH${order.id.split('-')[0].toUpperCase()}`);
                                                                                                alert('Đã sao chép nội dung!');
                                                                                            }}
                                                                                        />
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-xs text-stone-400 mt-2 italic">
                                                                                    * Vui lòng điền đúng nội dung chuyển khoản để đơn hàng được xử lý nhanh nhất.
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
