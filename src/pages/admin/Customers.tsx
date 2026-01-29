import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Phone, MapPin, Eye } from 'lucide-react';
import { CustomerDetailModal } from '../../components/admin/CustomerDetailModal';

interface Customer {
    id: string;
    full_name: string;
    email?: string;
    phone: string;
    address: string;
    created_at: string;
    is_admin?: boolean;
    is_banned?: boolean;
    username?: string;
}

export function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchCustomers();

        // Realtime subscription
        const channel = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                console.log('Realtime update:', payload);
                if (payload.eventType === 'INSERT') {
                    setCustomers(prev => [payload.new as Customer, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setCustomers(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...(payload.new as any) } : c));
                } else if (payload.eventType === 'DELETE') {
                    setCustomers(prev => prev.filter(c => c.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleViewDetail = (customerId: string) => {
        setSelectedCustomerId(customerId);
        setIsModalOpen(true);
    };

    const fetchCustomers = async () => {
        setLoading(true);
        console.log('Fetching customers...');
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching customers:', error);
            alert('Lỗi tải danh sách khách hàng: ' + error.message);
        } else {
            console.log('--- ADMIN DEBUG: RAW PROFILES FROM DB ---');
            console.table(data);
            console.log('Total count:', data?.length);
        }

        if (data) setCustomers(data as any);
        setLoading(false);
    };

    const handleToggleBan = async (customerId: string, currentStatus: boolean) => {
        setUpdatingId(customerId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_banned: !currentStatus } as any)
                .eq('id', customerId);

            if (error) throw error;

            setCustomers(customers.map(c =>
                c.id === customerId ? { ...c, is_banned: !currentStatus } : c
            ));
        } catch (error: any) {
            console.error('Error updating ban status:', error);
            alert('Không thể cập nhật trạng thái chặn: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteUser = async (customerId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) return;

        setUpdatingId(customerId);
        try {
            const { error } = await (supabase as any).rpc('delete_user_by_id', {
                target_user_id: customerId
            });

            if (error) throw error;

            setCustomers(customers.filter(c => c.id !== customerId));
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert('Không thể xóa người dùng: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleToggleAdmin = async (customerId: string, currentStatus: boolean) => {
        // ... rest of handleToggleAdmin ...
        setUpdatingId(customerId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: !currentStatus } as any)
                .eq('id', customerId);

            if (error) throw error;

            // Update local state
            setCustomers(customers.map(c =>
                c.id === customerId ? { ...c, is_admin: !currentStatus } : c
            ));
        } catch (error) {
            console.error('Error updating admin status:', error);
            alert('Không thể cập nhật quyền Admin. Vui lòng thử lại.');
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Quản lý người dùng</h1>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Chi tiết</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((customer) => (
                            <tr key={customer.id} className={customer.is_banned ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => handleViewDetail(customer.id)}
                                        className="p-2 text-primary hover:bg-pink-50 rounded-full transition-colors"
                                        title="Xem chi tiết"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{customer.full_name || 'Khách hàng chưa tên'}</div>
                                    <div className="text-[10px] text-gray-400 font-mono">ID: {customer.id.slice(0, 8)}...</div>
                                    <div className="text-xs text-gray-500">{customer.username}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500 flex flex-col gap-1">
                                        {customer.phone && (
                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                                        )}
                                        {customer.email && (
                                            <span className="text-xs">{customer.email}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={customer.is_admin || false}
                                                onChange={() => handleToggleAdmin(customer.id, customer.is_admin || false)}
                                                disabled={updatingId === customer.id || customer.is_banned}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                        <span className={`text-xs font-medium ${customer.is_admin ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {customer.is_admin ? 'Admin' : 'User'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.is_banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {customer.is_banned ? 'Đã chặn' : 'Hoạt động'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggleBan(customer.id, customer.is_banned || false)}
                                            disabled={updatingId === customer.id}
                                            className={`${customer.is_banned ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                                        >
                                            {customer.is_banned ? 'Mở khóa' : 'Chặn'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(customer.id)}
                                            disabled={updatingId === customer.id}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            Xóa
                                        </button>
                                        {updatingId === customer.id && (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500 flex items-start gap-1">
                                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{customer.address || '---'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.created_at ? formatDate(customer.created_at) : '---'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {customers.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">Chưa có người dùng nào.</div>
                )}
            </div>

            <CustomerDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customerId={selectedCustomerId || ''}
            />
        </div>
    );
}
