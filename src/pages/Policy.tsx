import { Layout } from '../components/layout/Layout';
import { ShieldCheck, Clock, MapPin, PhoneCall, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Policy() {
    const { t } = useLanguage();

    return (
        <Layout>
            <div className="bg-stone-50 min-h-screen py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-tight">
                            {t('policy') || 'Chính sách đổi trả'}
                        </h1>
                        <div className="w-24 h-1.5 bg-primary mx-auto rounded-full"></div>
                    </div>

                    <div className="space-y-12">
                        {/* Section 1: Conditions */}
                        <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-pink-100 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-pink-100 rounded-2xl text-primary">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Điều kiện đổi trả</h2>
                            </div>

                            <p className="text-gray-700 mb-8 leading-relaxed text-lg">
                                Quý Khách hàng cần kiểm tra tình trạng hàng hóa và có thể đổi hàng/ trả lại hàng ngay tại thời điểm giao/nhận hàng trong những trường hợp sau:
                            </p>

                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">Sai chủng loại, mẫu mã</p>
                                        <p className="text-gray-600">Hàng không đúng chủng loại, mẫu mã trong đơn hàng đã đặt hoặc như trên website tại thời điểm đặt hàng.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">Thiếu số lượng</p>
                                        <p className="text-gray-600">Không đủ số lượng, không đủ bộ như trong đơn hàng.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">Lỗi do vận chuyển/sản xuất</p>
                                        <p className="text-gray-600">Tình trạng bên ngoài bị ảnh hưởng như rách bao bì, bong tróc, bể vỡ…</p>
                                    </div>
                                </li>
                            </ul>

                            <div className="mt-10 p-5 bg-stone-50 rounded-2xl border-l-4 border-primary flex gap-4 items-start">
                                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-gray-700 italic">
                                    Khách hàng có trách nhiệm trình giấy tờ liên quan chứng minh sự thiếu sót trên để hoàn thành việc hoàn trả/đổi trả hàng hóa.
                                </p>
                            </div>
                        </section>

                        {/* Section 2: Time and Location */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Time Limits */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-pink-100 rounded-xl text-primary">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Thời gian quy định</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="pb-4 border-b border-gray-100">
                                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Thông báo đổi trả</p>
                                        <p className="text-gray-900 font-medium text-lg">Trong vòng 48h kể từ khi nhận hàng (đối với sản phẩm thiếu phụ kiện, quà tặng hoặc bể vỡ).</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Gửi trả sản phẩm</p>
                                        <p className="text-gray-900 font-medium text-lg">Trong vòng 14 ngày kể từ khi nhận sản phẩm.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Location & Support */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-pink-100 rounded-xl text-primary">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Địa điểm & Hỗ trợ</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="pb-4 border-b border-gray-100">
                                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Địa điểm đổi trả</p>
                                        <p className="text-gray-900 font-medium">Trực tiếp tại văn phòng/cửa hàng hoặc gửi qua đường bưu điện.</p>
                                    </div>
                                    <a href="tel:0862595798" className="flex items-start gap-4 p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform duration-200 cursor-pointer">
                                        <PhoneCall className="w-6 h-6 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold">Khiếu nại chất lượng</p>
                                            <p className="text-sm opacity-90">Vui lòng liên hệ hotline chăm sóc khách hàng của chúng tôi.</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
