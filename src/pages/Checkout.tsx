import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle } from 'lucide-react';

export function Checkout() {
    const { items, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        email: user?.email || '',
        note: ''
    });
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'banking'>('cod');
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Location State
    const [locationData, setLocationData] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [specificAddress, setSpecificAddress] = useState('');

    useEffect(() => {
        // Import JSON data
        import('../data/vietnamAddress.json').then((data) => {
            // TS might complain about module structure depending on how json is imported
            // Usually data.default or data itself depending on config. 
            // Casting to any to avoid strict check issues for now.
            const cities = (data as any).default || data;
            setLocationData(cities);
        });
    }, []);

    // Cascading Logic
    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityId = e.target.value;
        setSelectedCity(cityId);
        setSelectedDistrict('');
        setSelectedWard('');
        setWards([]);

        const city = locationData.find((c: any) => c.Id === cityId);
        setDistricts(city ? city.Districts : []);
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const districtId = e.target.value;
        setSelectedDistrict(districtId);
        setSelectedWard('');

        const district = districts.find((d: any) => d.Id === districtId);
        setWards(district ? district.Wards : []);
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedWard(e.target.value);
    };

    // Update full address when parts change
    useEffect(() => {
        if (selectedCity && selectedDistrict && selectedWard && specificAddress) {
            const city = locationData.find(c => c.Id === selectedCity)?.Name || '';
            const district = districts.find(d => d.Id === selectedDistrict)?.Name || '';
            const ward = wards.find(w => w.Id === selectedWard)?.Name || '';

            setFormData(prev => ({
                ...prev,
                address: `${specificAddress}, ${ward}, ${district}, ${city}`
            }));
        }
    }, [selectedCity, selectedDistrict, selectedWard, specificAddress, locationData, districts, wards]);

    useEffect(() => {
        if (!user) {
            // If not logged in, redirect to login with return url?
            // For now, redirect to login
            navigate('/login');
        } else {
            // Fetch profile data to pre-fill
            fetchProfile();
        }
    }, [user, navigate]);

    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            setFormData(prev => ({
                ...prev,
                fullName: data.full_name || '',
                phone: data.phone || '',
                address: data.address || ''
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    full_name: formData.fullName,
                    phone: formData.phone,
                    address: formData.address,
                    total_amount: cartTotal,
                    payment_method: paymentMethod,
                    status: 'pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.id, // Ensure this matches UUID format if strictly enforced, but here CartItem id is likely UUID from DB
                quantity: item.quantity,
                price: item.price,
                selected_color: item.color
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Sync info to Profile (to ensure Admin visibility and updated info)
            await supabase.from('profiles').upsert({
                id: user.id,
                full_name: formData.fullName,
                phone: formData.phone,
                address: formData.address,
                email: formData.email,
                updated_at: new Date().toISOString()
            } as any);

            // 4. Clear Cart & Show Success
            clearCart();
            setOrderSuccess(true);

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (p: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    if (orderSuccess) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
                    <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                    <h1 className="text-3xl font-serif font-bold mb-4">Đặt hàng thành công!</h1>
                    <p className="text-gray-600 mb-8">Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.</p>
                    <button
                        onClick={() => navigate('/account')}
                        className="bg-primary text-dark px-8 py-3 rounded-full font-bold hover:bg-dark hover:text-white transition-colors"
                    >
                        Xem đơn hàng của bạn
                    </button>
                </div>
            </Layout>
        );
    }

    if (items.length === 0) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center">
                    <p className="text-xl mb-4">Giỏ hàng của bạn đang trống</p>
                    <button onClick={() => navigate('/shop')} className="text-primary underline">Mua sắm ngay</button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="bg-stone-50 min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-serif font-bold mb-8 text-center text-dark">Thanh toán</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* Form */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-bold mb-6">Thông tin giao hàng</h2>
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ nhận hàng</label>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <select
                                                value={selectedCity}
                                                onChange={handleCityChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary bg-white"
                                                required
                                            >
                                                <option value="">Chọn Tỉnh / Thành</option>
                                                {locationData.map((city: any) => (
                                                    <option key={city.Id} value={city.Id}>{city.Name}</option>
                                                ))}
                                            </select>

                                            <select
                                                value={selectedDistrict}
                                                onChange={handleDistrictChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary bg-white"
                                                required
                                                disabled={!selectedCity}
                                            >
                                                <option value="">Chọn Quận / Huyện</option>
                                                {districts.map((district: any) => (
                                                    <option key={district.Id} value={district.Id}>{district.Name}</option>
                                                ))}
                                            </select>

                                            <select
                                                value={selectedWard}
                                                onChange={handleWardChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary bg-white"
                                                required
                                                disabled={!selectedDistrict}
                                            >
                                                <option value="">Chọn Phường / Xã</option>
                                                {wards.map((ward: any) => (
                                                    <option key={ward.Id} value={ward.Id}>{ward.Name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Số nhà, tên đường..."
                                            required
                                            value={specificAddress}
                                            onChange={(e) => setSpecificAddress(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
                                    <textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </form>

                            <div className="mt-8">
                                <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50 bg-white">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50 bg-white">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="banking"
                                            checked={paymentMethod === 'banking'}
                                            onChange={() => setPaymentMethod('banking')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium block">Chuyển khoản ngân hàng</span>
                                            {paymentMethod === 'banking' && (
                                                <div className="text-sm text-gray-500 mt-2 p-3 bg-gray-100 rounded">
                                                    <p>Ngân hàng: MB Bank</p>
                                                    <p>STK: 0123456789</p>
                                                    <p>CTK: NGUYEN VAN A</p>
                                                    <p>Nội dung: [SĐT] - [Tên KH]</p>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
                            <h2 className="text-xl font-bold mb-6">Đơn hàng của bạn</h2>
                            <div className="max-h-96 overflow-y-auto mb-6 pr-2">
                                {items.map(item => (
                                    <div key={item.id} className="flex justify-between py-4 border-b border-gray-100 last:border-0">
                                        <div className="flex gap-4">
                                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                            <div>
                                                <p className="font-medium text-dark line-clamp-2">{item.name}</p>
                                                <p className="text-sm text-gray-500">SL: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(cartTotal)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Vận chuyển</span>
                                    <span>Miễn phí</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl pt-4 border-t border-gray-200">
                                    <span>Tổng cộng</span>
                                    <span className="text-primary">{formatPrice(cartTotal)}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={loading}
                                className="w-full mt-8 bg-dark text-white py-4 rounded-full font-bold hover:bg-primary transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
}
