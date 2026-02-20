import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from '../components/product/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Favorites() {
    const { favorites } = useFavorites();
    const { t } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (favorites.length > 0) {
            fetchFavoriteProducts();
        } else {
            setProducts([]);
            setLoading(false);
        }
    }, [favorites]);

    const fetchFavoriteProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*, category:categories(name)')
            .in('id', favorites);

        if (!error && data) {
            setProducts(data);
        }
        setLoading(false);
    };

    return (
        <Layout>
            <div className="bg-stone-50 min-h-screen py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 mb-8">
                        <Heart className="w-8 h-8 text-primary fill-primary" />
                        <h1 className="text-3xl font-serif font-bold text-gray-900">{t('favorites_title')}</h1>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-pink-50">
                            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-6">{t('favorites_empty')}</p>
                            <Link
                                to="/shop"
                                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 transition-colors shadow-lg"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {t('explore_now')}
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} showRemoveButton={true} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
