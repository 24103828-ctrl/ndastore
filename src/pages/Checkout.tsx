import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, Copy, ChevronRight, MapPin, CreditCard } from 'lucide-react';

export function Checkout() {
    const { items, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Helper for formatting price (defined early to avoid ReferenceError)
    const formatPrice = (p: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    // Steps: 1 = Shipping, 2 = Payment, 3 = Success
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        email: user?.email || '',
        note: ''
    });
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'banking'>('cod');
    const [loading, setLoading] = useState(false);

    // Order Result State
    const [createdOrder, setCreatedOrder] = useState<{ id: string, total: number, code: string } | null>(null);

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
            navigate('/login');
        } else {
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

    // Go to Step 2
    const handleContinueToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.phone || !formData.address) {
            alert('Vui lòng điền đầy đủ thông tin giao hàng');
            return;
        }
        setStep(2);
        window.scrollTo(0, 0);
    };

    // Finalize Order (Step 2 -> Step 3)
    const handleConfirmOrder = async () => {
        if (!user) return;
        setLoading(true);

        const shippingFee = cartTotal >= 200000 ? 0 : 21000;
        const finalTotal = cartTotal + shippingFee;

        try {
            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    full_name: formData.fullName,
                    phone: formData.phone,
                    address: formData.address,
                    total_amount: finalTotal,
                    payment_method: paymentMethod,
                    status: 'pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                selected_color: item.color
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Sync info to Profile
            await supabase.from('profiles').upsert({
                id: user.id,
                full_name: formData.fullName,
                phone: formData.phone,
                address: formData.address,
                email: formData.email,
                updated_at: new Date().toISOString()
            } as any);

            // 4. Set created order details
            setCreatedOrder({
                id: orderData.id,
                total: finalTotal,
                code: orderData.id.split('-')[0].toUpperCase()
            });

            // 5. Clear Cart & Move to Step 3
            clearCart();
            setStep(3);
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Empty Cart Check (Only if not in success step)
    if (items.length === 0 && step !== 3) {
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

                    {/* Stepper Header */}
                    <div className="flex items-center justify-center mb-10 text-sm font-medium">
                        <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>1</span>
                            <span>Thông tin giao hàng</span>
                        </div>
                        <div className={`w-12 h-0.5 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                        <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>2</span>
                            <span>Thanh toán</span>
                        </div>
                        <div className={`w-12 h-0.5 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                        <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 3 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>3</span>
                            <span>Hoàn tất</span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* LEFT COLUMN: Main Content based on Step */}
                        <div className="flex-1">

                            {/* STEP 1: Shipping Info */}
                            {step === 1 && (
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" /> Thông tin giao hàng
                                    </h2>
                                    <form id="shipping-form" onSubmit={handleContinueToPayment} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                                placeholder="Nguyễn Văn A"
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
                                                placeholder="0912345678"
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
                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                className="w-full md:w-auto bg-dark text-white px-8 py-3 rounded-full font-bold hover:bg-primary transition-colors flex items-center justify-center gap-2"
                                            >
                                                Tiếp tục đến phương thức thanh toán <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* STEP 2: Payment Selection */}
                            {step === 2 && (
                                <div className="bg-white p-6 rounded-lg shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-primary" /> Phương thức thanh toán
                                    </h2>
                                    <div className="space-y-4">
                                        <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary ring-1 ring-primary bg-stone-50' : 'border-gray-200 hover:border-primary/50'}`}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="cod"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                                className="mt-1 text-primary focus:ring-primary"
                                            />
                                            <div className="ml-4">
                                                <span className="font-bold block text-base">Thanh toán khi nhận hàng (COD)</span>
                                                <span className="text-sm text-gray-500">Bạn sẽ thanh toán tiền mặt cho shipper khi nhận được hàng.</span>
                                            </div>
                                        </label>

                                        <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'banking' ? 'border-primary ring-1 ring-primary bg-stone-50' : 'border-gray-200 hover:border-primary/50'}`}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="banking"
                                                checked={paymentMethod === 'banking'}
                                                onChange={() => setPaymentMethod('banking')}
                                                className="mt-1 text-primary focus:ring-primary"
                                            />
                                            <div className="ml-4 w-full">
                                                <span className="font-bold block text-base">Chuyển khoản ngân hàng</span>
                                                <span className="text-sm text-gray-500 block mb-2">Quét mã QR để thanh toán nhanh chóng, an toàn.</span>

                                                {/* Preview of Bank Info (Optional, user sees actual QR in next step) */}
                                                {paymentMethod === 'banking' && (
                                                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded text-sm text-gray-600">
                                                        <p>Hệ thống sẽ tạo mã QR thanh toán tự động ở bước tiếp theo.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>

                                    <div className="mt-8 flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="px-6 py-3 border border-gray-300 rounded-full font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            onClick={handleConfirmOrder}
                                            disabled={loading}
                                            className="flex-1 bg-dark text-white px-8 py-3 rounded-full font-bold hover:bg-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>Processing...</>
                                            ) : (
                                                <>Xác nhận đơn hàng <CheckCircle className="w-4 h-4" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Success & QR Code */}
                            {step === 3 && createdOrder && (
                                <div className="bg-white p-8 rounded-lg shadow-lg border border-primary/20 text-center animate-in zoom-in-95 duration-300">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-serif font-bold text-dark mb-2">Đặt hàng thành công!</h2>
                                    <p className="text-lg text-gray-600 mb-6">
                                        Đơn hàng của <span className="font-bold text-dark">{formData.fullName}</span> đã được khởi tạo.
                                    </p>

                                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 inline-block w-full max-w-md mx-auto text-left">
                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between border-b border-stone-200 pb-2">
                                                <span className="text-gray-500">Mã đơn hàng:</span>
                                                <span className="font-bold text-primary text-lg">DH{createdOrder.code}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-stone-200 pb-2">
                                                <span className="text-gray-500">Tổng tiền:</span>
                                                <span className="font-bold text-dark text-lg">{formatPrice(createdOrder.total)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Người nhận:</span>
                                                <span className="font-medium text-dark">{formData.fullName}</span>
                                            </div>
                                        </div>

                                        {paymentMethod === 'banking' ? (
                                            <div className="mt-6">
                                                <div className="bg-white p-4 rounded-lg border-2 border-primary/10 shadow-sm text-center">
                                                    <p className="font-bold text-primary mb-3 uppercase text-sm tracking-wider">Quét mã để thanh toán</p>
                                                    <img
                                                        src={`https://img.vietqr.io/image/VCB-9862595798-qr_only.png?amount=${createdOrder.total}&addInfo=DH${createdOrder.code}`}
                                                        alt="VietQR"
                                                        className="w-full h-auto rounded-lg max-w-[250px] mx-auto mb-4"
                                                    />
                                                    <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded">
                                                        * Nội dung chuyển khoản đã được tự động điền. Vui lòng không thay đổi để đơn hàng được xử lý nhanh nhất.
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-center text-sm">
                                                Vui lòng chuẩn bị số tiền tương ứng để thanh toán cho shipper khi nhận hàng.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8">
                                        <button
                                            onClick={() => navigate('/account')}
                                            className="bg-transparent text-dark border border-dark px-8 py-3 rounded-full font-bold hover:bg-dark hover:text-white transition-colors"
                                        >
                                            Quản lý đơn hàng
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* RIGHT COLUMN: Order Summary (Visible on Step 1 & 2) */}
                        {step !== 3 && (
                            <div className="lg:w-96">
                                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
                                    <h3 className="text-lg font-bold mb-4">Đơn hàng của bạn ({items.length} món)</h3>
                                    <div className="max-h-80 overflow-y-auto pr-2 mb-4 space-y-4">
                                        {items.map(item => (
                                            <div key={item.id} className="flex gap-3">
                                                <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded bg-gray-100" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                                                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Tạm tính</span>
                                            <span>{formatPrice(cartTotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Vận chuyển</span>
                                            {cartTotal >= 200000 ? (
                                                <span className="text-green-600 font-medium">Miễn phí</span>
                                            ) : (
                                                <span>{formatPrice(21000)}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 mt-2">
                                            <span>Tổng cộng</span>
                                            <span className="text-primary">{formatPrice(cartTotal + (cartTotal >= 200000 ? 0 : 21000))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
