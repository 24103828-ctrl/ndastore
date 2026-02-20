import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Truck, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProductCard } from '../components/product/ProductCard';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

import bghoadao from '../image/bghoadao.png';

// Helper interface if not imported
interface Product {
    id: string;
    name: string;
    price: number;
    sale_price: number | null;
    images: string[] | null;
    category: { name: string } | null;
}

export function Home() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        fetchFeaturedProducts();
    }, []);

    const fetchFeaturedProducts = async () => {
        setLoading(true);
        // Fetch 4 newest products
        const { data } = await supabase
            .from('products')
            .select('*, category:categories(name)')
            .order('created_at', { ascending: false })
            .limit(4);

        if (data) setFeaturedProducts(data as any);
        setLoading(false);
    };

    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative h-[400px] md:h-[600px] flex items-end justify-center pb-16 md:pb-32 bg-black/20">
                <div className="absolute inset-0 z-0">
                    <img
                        src={bghoadao}
                        alt="Hero Background"
                        className="w-full h-full object-cover opacity-90"
                    />
                </div>
                <div className="relative z-10 text-center px-4">
                    <Link
                        to="/shop"
                        className="inline-flex items-center bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                        {t('shop_now')} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="p-6">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-primary mb-4">
                                <Truck className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('feature_free_shipping_title')}</h3>
                            <p className="text-gray-600">{t('feature_free_shipping_desc')}</p>
                        </div>
                        <div className="p-6">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-primary mb-4">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('feature_quality_title')}</h3>
                            <p className="text-gray-600">{t('feature_quality_desc')}</p>
                        </div>
                        <div className="p-6">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-primary mb-4">
                                <Shield className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('feature_secure_payment_title')}</h3>
                            <p className="text-gray-600">{t('feature_secure_payment_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 bg-stone-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-serif font-bold text-center mb-12">{t('featured_products')}</h2>
                    {loading ? (
                        <div className="flex justify-center h-40 items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                            {featuredProducts.length === 0 && (
                                <div className="col-span-full text-center text-gray-500">{t('no_products')}</div>
                            )}
                        </div>
                    )}
                    <div className="text-center mt-12">
                        <Link to="/shop" className="text-dark border-b-2 border-primary pb-1 hover:text-primary transition-colors font-medium">
                            {t('view_all')}
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
