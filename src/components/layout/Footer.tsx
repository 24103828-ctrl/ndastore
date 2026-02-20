import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-dark text-white pt-12 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-2xl font-serif text-primary mb-4">NDA STORE</h3>
                        <p className="text-gray-400 text-sm">
                            {t('footer_slogan')}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-medium mb-4">{t('quick_links')}</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/shop" className="hover:text-primary transition-colors">{t('shop')}</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors">{t('about')}</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">{t('contact')}</Link></li>
                            <li><Link to="/policy" className="hover:text-primary transition-colors">{t('policy')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-medium mb-4">{t('contact_info')}</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>{t('address_value')}</li>
                            <li>{t('hotline_label')}: 0862 595 798</li>
                            <li>{t('email_label')}: 24103828@st.phenikaa-uni.edu.vn</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-medium mb-4">{t('connect')}</h4>
                        <div className="flex space-x-4">
                            <a href="https://www.facebook.com/phamhuucuongvippro/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                                <Facebook className="h-6 w-6" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Instagram className="h-6 w-6" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Twitter className="h-6 w-6" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} NDA STORE. {t('rights_reserved')}
                </div>
            </div>
        </footer>
    );
}
