import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export function Cart() {
    const { items, removeItem, updateQuantity, cartTotal } = useCart();

    const formatPrice = (p: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    return (
        <Layout>
            <div className="bg-stone-50 min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-serif font-bold mb-8">Giỏ hàng của bạn</h1>

                    {items.length === 0 ? (
                        <div className="bg-white p-10 rounded-lg shadow-sm text-center">
                            <p className="text-xl text-gray-500 mb-6">Giỏ hàng của bạn đang trống.</p>
                            <Link
                                to="/shop"
                                className="inline-flex items-center bg-primary text-dark px-6 py-2 rounded-full font-bold hover:bg-dark hover:text-white transition-colors"
                            >
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Cart Items */}
                            <div className="flex-1">
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    <ul className="divide-y divide-gray-100">
                                        {items.map((item) => (
                                            <li key={item.id} className="p-6 flex flex-col sm:flex-row items-center gap-4">
                                                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1 text-center sm:text-left">
                                                    <h3 className="text-lg font-bold text-dark mb-1">
                                                        <Link to={`/product/${item.id}`}>{item.name}</Link>
                                                    </h3>
                                                    {item.color && (
                                                        <p className="text-sm text-gray-500 mb-1 font-medium">Màu sắc: <span className="text-primary">{item.color}</span></p>
                                                    )}
                                                    <p className="text-primary font-bold mb-2">{formatPrice(item.price)}</p>
                                                </div>

                                                <div className="flex items-center border border-gray-300 rounded-full">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.color)}
                                                        className="p-2 text-gray-600 hover:text-primary transition-colors"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.color)}
                                                        className="p-2 text-gray-600 hover:text-primary transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="text-right min-w-[100px] hidden sm:block">
                                                    <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(item.id, item.color)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:w-96">
                                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                                    <h2 className="text-xl font-bold mb-6">Tổng đơn hàng</h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Tạm tính</span>
                                            <span>{formatPrice(cartTotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Vận chuyển</span>
                                            <span className="text-green-600 font-medium">Miễn phí</span>
                                        </div>
                                        <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-lg">
                                            <span>Tổng tiền</span>
                                            <span className="text-primary">{formatPrice(cartTotal)}</span>
                                        </div>
                                    </div>

                                    <Link
                                        to="/checkout"
                                        className="block w-full bg-dark text-white text-center py-3 rounded-full font-bold hover:bg-primary transition-colors flex items-center justify-center"
                                    >
                                        Thanh toán <ArrowRight className="ml-2 w-4 h-4" />
                                    </Link>

                                    <p className="text-xs text-gray-400 text-center mt-4">
                                        Thanh toán bảo mật 100%. Đổi trả trong 30 ngày.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
