import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/product/ProductCard';
import { Star, Minus, Plus, ShoppingBag, Truck, Share2, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

// Types (should ideally be shared)
interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    sale_price: number | null;
    images: string[] | null;
    category: { id: string; name: string } | null;
    category_id: string;
}

export function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const { addItem, isProcessing } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const viewStartTime = useRef<number>(Date.now());
    const currentProductId = useRef<string | null>(null);

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        if (id) {
            window.scrollTo(0, 0); // Scroll to top when id changes
            fetchProduct(id);

            // Track view start
            viewStartTime.current = Date.now();
            currentProductId.current = id;
        }

        return () => {
            // Track view end when unmounting or id changes
            if (currentProductId.current && user) {
                const duration = Math.floor((Date.now() - viewStartTime.current) / 1000);
                if (duration > 0) {
                    (supabase.from('product_views' as any) as any).insert({
                        user_id: user.id,
                        product_id: currentProductId.current,
                        duration_seconds: duration
                    }).then(({ error }: any) => {
                        if (error) console.error('Tracking error:', error);
                    });
                }
            }
        };
    }, [id, user]);

    // ... existing helpers ...
    const formatPrice = (p: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    // Auto-play effect
    useEffect(() => {
        let interval: any;
        if (isHovering && product?.images && product.images.length > 1) {
            interval = setInterval(() => {
                handleNextImage();
            }, 2000); // Change image every 2 seconds on hover
        }
        return () => clearInterval(interval);
    }, [isHovering, activeImage, product]);

    const fetchProduct = async (productId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select(`*, category:categories(id, name)`)
            .eq('id', productId)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
        } else if (data) {
            setProduct(data as any);
            setActiveImage(data.images?.[0] || '');
            if (data.category_id) {
                fetchRelatedProducts(data.category_id, data.id);
            }
        }
        setLoading(false);
    };

    const fetchRelatedProducts = async (categoryId: string, currentId: string) => {
        if (!categoryId) return;
        const { data } = await supabase
            .from('products')
            .select(`*, category:categories(id, name)`)
            .eq('category_id', categoryId)
            .neq('id', currentId)
            .limit(4);

        if (data) setRelatedProducts(data as any);
    };

    const navigate = useNavigate();

    const handleAddToCart = () => {
        if (!product) return;

        addItem({
            id: product.id,
            name: product.name,
            price: (product.sale_price || product.price),
            image: product.images?.[0] || '',
            quantity: quantity
        });
        showToast('Đã thêm vào giỏ hàng thành công!', 'success');
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/cart');
    };

    const handleNextImage = () => {
        if (!product?.images?.length) return;
        const currentIndex = product.images.indexOf(activeImage);
        const nextIndex = (currentIndex + 1) % product.images.length;
        setActiveImage(product.images[nextIndex]);
    };

    const handlePrevImage = () => {
        if (!product?.images?.length) return;
        const currentIndex = product.images.indexOf(activeImage);
        const prevIndex = (currentIndex - 1 + product.images.length) % product.images.length;
        setActiveImage(product.images[prevIndex]);
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (!product) {
        return (
            <Layout>
                <div className="min-h-screen flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-4">{t('product_not_found')}</h2>
                    <Link to="/shop" className="text-primary underline">{t('back_to_shop')}</Link>
                </div>
            </Layout>
        )
    }

    // Use dummy images if none provided (for safety)
    const imagesArray = product.images?.length ? product.images : ['https://via.placeholder.com/600x800'];
    const currentImage = activeImage || imagesArray[0];

    return (
        <Layout>
            <div className="bg-stone-50 py-6 md:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Breadcrumb */}
                    <nav className="text-sm text-gray-500 mb-8">
                        <Link to="/" className="hover:text-primary">{t('home')}</Link>
                        <span className="mx-2">/</span>
                        <Link to="/shop" className="hover:text-primary">{t('shop')}</Link>
                        <span className="mx-2">/</span>
                        <span className="text-dark font-medium">{product.name}</span>
                    </nav>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">

                            {/* Product Gallery */}
                            <div className="p-6 md:p-8">
                                <div
                                    className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-4 relative group"
                                    onMouseEnter={() => setIsHovering(true)}
                                    onMouseLeave={() => setIsHovering(false)}
                                >
                                    <img
                                        src={currentImage}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-all duration-500"
                                    />
                                    {product.sale_price && (
                                        <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded">
                                            {t('sale')}
                                        </div>
                                    )}

                                    {/* Navigation Arrows (Visible on Hover) */}
                                    {imagesArray.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {imagesArray.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(img)}
                                            className={cn(
                                                "w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all",
                                                activeImage === img ? "border-primary" : "border-transparent hover:border-gray-200"
                                            )}
                                        >
                                            <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-6 md:p-8 md:border-l border-gray-100 flex flex-col h-full bg-stone-50/30 md:bg-white">
                                <div className="mb-auto">
                                    {product.category && (
                                        <span className="text-sm text-primary font-bold tracking-wider uppercase mb-2 block">
                                            {product.category.name}
                                        </span>
                                    )}
                                    <h1 className="text-3xl font-serif font-bold text-dark mb-4">{product.name}</h1>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex text-yellow-500">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className="w-5 h-5 fill-current" />
                                            ))}
                                        </div>
                                        <span className="text-gray-400 text-sm">(0 {t('reviews')})</span>
                                    </div>

                                    <div className="text-2xl mb-8 flex items-center gap-4">
                                        {product.sale_price ? (
                                            <>
                                                <span className="font-bold text-primary font-sans">{formatPrice(product.sale_price)}</span>
                                                <span className="text-gray-400 line-through text-lg font-sans">{formatPrice(product.price)}</span>
                                            </>
                                        ) : (
                                            <span className="font-bold text-primary font-sans">{formatPrice(product.price)}</span>
                                        )}
                                    </div>

                                    <div className="prose text-gray-600 mb-8 sm:pr-8">
                                        <p>{product.description || t('no_description')}</p>
                                    </div>


                                    {/* Quantity & Add to Cart */}
                                    <div className="flex flex-col gap-4 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center border border-gray-300 rounded-full w-full md:w-max justify-between px-2">
                                                <button
                                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                    className="p-4 md:p-3 text-gray-600 hover:text-primary transition-colors"
                                                >
                                                    <Minus className="w-5 h-5 md:w-4 md:h-4" />
                                                </button>
                                                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                                                <button
                                                    onClick={() => setQuantity(q => q + 1)}
                                                    className="p-4 md:p-3 text-gray-600 hover:text-primary transition-colors"
                                                >
                                                    <Plus className="w-5 h-5 md:w-4 md:h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleAddToCart}
                                                disabled={isProcessing}
                                                className="bg-white border-2 border-primary text-primary py-3 px-6 rounded-full font-bold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ShoppingBag className={cn("w-5 h-5", !isProcessing && "group-hover:animate-bounce-short")} />
                                                {isProcessing ? 'Đang xử lý...' : t('add_to_cart')}
                                            </motion.button>
                                            <div className="flex gap-4">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleBuyNow}
                                                    className="flex-1 bg-gradient-to-r from-primary to-pink-600 text-white py-3 px-6 rounded-full font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                                >
                                                    {t('buy_now')}
                                                </motion.button>
                                                <button
                                                    onClick={() => product && toggleFavorite(product.id)}
                                                    className={cn(
                                                        "p-3 rounded-full border-2 transition-all duration-300",
                                                        product && isFavorite(product.id)
                                                            ? "border-primary bg-primary text-dark shadow-md"
                                                            : "border-gray-200 text-gray-400 hover:text-primary hover:border-primary/50"
                                                    )}
                                                >
                                                    <Heart className={cn("w-6 h-6", product && isFavorite(product.id) && "fill-current")} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-8 border-t border-gray-100 text-sm text-gray-600">
                                        <div className="flex items-center gap-3">
                                            <Truck className="w-5 h-5 text-primary" />
                                            <span>{t('free_shipping')}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Share2 className="w-5 h-5 text-primary" />
                                            <span>{t('share_product')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-serif font-bold mb-8">{t('related_products')}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map(p => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </Layout>
    );
}
