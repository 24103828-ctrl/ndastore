import { Layout } from '../components/layout/Layout';
import { MapPin, Phone, Mail, Facebook } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Contact() {
    const { t } = useLanguage();
    return (
        <Layout>
            <div className="bg-stone-50 min-h-screen py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-sans font-bold text-gray-900 mb-4">{t('contact_page_title')}</h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            {t('contact_subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                        {/* Contact Information */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-sans font-bold text-dark mb-8">{t('contact_info_title')}</h2>

                            <div className="space-y-8">
                                {/* Address */}
                                <div className="flex items-start gap-4 group">
                                    <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{t('address_label')}</h3>
                                        <p className="text-gray-600">{t('address_value')}</p>
                                    </div>
                                </div>

                                {/* Hotline */}
                                <a href="tel:0862595798" className="flex items-start gap-4 group hover:bg-gray-50 -m-4 p-4 rounded-xl transition-colors">
                                    <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{t('hotline_label')}</h3>
                                        <p className="text-gray-600 group-hover:text-primary font-medium">0862 595 798</p>
                                        <span className="text-xs text-primary mt-1 inline-block">{t('click_to_call')}</span>
                                    </div>
                                </a>

                                {/* Email */}
                                <a href="mailto:24103828@st.phenikaa-uni.edu.vn" className="flex items-start gap-4 group hover:bg-gray-50 -m-4 p-4 rounded-xl transition-colors">
                                    <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{t('email_label')}</h3>
                                        <p className="text-gray-600 break-all group-hover:text-primary">24103828@st.phenikaa-uni.edu.vn</p>
                                    </div>
                                </a>

                                {/* Facebook Button */}
                                <div className="pt-4">
                                    <a
                                        href="https://www.facebook.com/phamhuucuongvippro/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                                    >
                                        <Facebook className="w-5 h-5" />
                                        {t('facebook_connect')}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 h-full min-h-[400px]">
                            <iframe
                                title="Google Maps - Kien Hung, Ha Dong"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14900.563080776746!2d105.78389659999999!3d20.9576357!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135add134812b11%3A0xe544c9b13977dc4!2zS2nhur9uIEjGsG5nLCBIw6AgxJDDtG5nLCBIYW5vaSwgVmlldG5hbQ!5e0!3m2!1sen!2s!4v1708415000000!5m2!1sen!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0, minHeight: '400px', borderRadius: '1rem' }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
}
