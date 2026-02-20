import { Layout } from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { Gem, Tag, HeartHandshake, ShieldCheck, Camera, Truck, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function About() {
    const { t } = useLanguage();

    return (
        <Layout>
            <div className="bg-white min-h-screen">
                {/* Hero Section */}
                <div className="bg-pink-50 py-16 md:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-[1.4]">
                            {t('about_hero_title')}
                        </h1>
                        <p className="text-base text-[#333333] max-w-3xl mx-auto leading-relaxed">
                            {t('about_hero_desc')}
                        </p>
                    </div>
                </div>

                {/* Mission & Core Values */}
                <div className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-serif font-bold text-pink-500 mb-4 leading-normal">{t('core_values')}</h2>
                            <div className="w-24 h-1 bg-pink-200 mx-auto rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Value 1 */}
                            <div className="bg-pink-50 p-8 rounded-2xl text-center transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-pink-500">
                                    <Gem className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-[1.4]">{t('value_1_title')}</h3>
                                <p className="text-[#333333] text-base">
                                    {t('value_1_desc')}
                                </p>
                            </div>

                            {/* Value 2 */}
                            <div className="bg-pink-50 p-8 rounded-2xl text-center transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-pink-500">
                                    <Tag className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-[1.4]">{t('value_2_title')}</h3>
                                <p className="text-[#333333] text-base">
                                    {t('value_2_desc')}
                                </p>
                            </div>

                            {/* Value 3 */}
                            <div className="bg-pink-50 p-8 rounded-2xl text-center transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-pink-500">
                                    <HeartHandshake className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-[1.4]">{t('value_3_title')}</h3>
                                <p className="text-[#333333] text-base">
                                    {t('value_3_desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Why Choose Us */}
                <div className="py-16 bg-gradient-to-b from-white to-pink-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">{t('why_choose_us')}</h2>
                            <p className="text-gray-500">{t('why_choose_subtitle')}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <div className="flex flex-col items-center p-6 text-center">
                                <div className="mb-4 text-pink-500 bg-pink-100 p-4 rounded-full">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 leading-[1.4]">{t('reason_durable')}</h3>
                                <p className="text-base text-[#333333]">{t('reason_durable_desc')}</p>
                            </div>

                            <div className="flex flex-col items-center p-6 text-center">
                                <div className="mb-4 text-pink-500 bg-pink-100 p-4 rounded-full">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 leading-[1.4]">{t('reason_real_photo')}</h3>
                                <p className="text-base text-[#333333]">{t('reason_real_photo_desc')}</p>
                            </div>

                            <div className="flex flex-col items-center p-6 text-center">
                                <div className="mb-4 text-pink-500 bg-pink-100 p-4 rounded-full">
                                    <Truck className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 leading-[1.4]">{t('reason_fast_ship')}</h3>
                                <p className="text-base text-[#333333]">{t('reason_fast_ship_desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="py-20 bg-pink-600 text-white text-center px-4">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">{t('ready_style')}</h2>
                    <p className="text-pink-100 mb-8 max-w-2xl mx-auto text-lg">
                        {t('explore_collection')}
                    </p>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-pink-50 hover:scale-105 transition-all shadow-lg"
                    >
                        {t('shop_now')} <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
