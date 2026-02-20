import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, CreditCard, Heart, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { cn } from '../../lib/utils';

interface ProductCardProps {
    product: {
        id: string | number;
        name: string;
        price: number | string;
        sale_price?: number | string | null;
        images?: string[] | null;
        image?: string; // Fallback for mock data
        category?: { name: string } | null;
    };
    showRemoveButton?: boolean;
}

export function ProductCard({ product, showRemoveButton }: ProductCardProps) {
    const { addItem } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const navigate = useNavigate();

    const isFav = isFavorite(String(product.id));

    // Handle different image formats (Supabase array vs Mock string)
    const displayImage = product.images?.[0] || product.image || 'https://via.placeholder.com/300x400';
    const hoverImage = product.images?.[1];

    // Format price helper
    const formatPrice = (p: number | string) => {
        if (typeof p === 'string') return p;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to product detail
        e.stopPropagation();

        addItem({
            id: String(product.id),
            name: product.name,
            price: Number(product.sale_price || product.price),
            image: displayImage,
            quantity: 1
        });
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addItem({
            id: String(product.id),
            name: product.name,
            price: Number(product.sale_price || product.price),
            image: displayImage,
            quantity: 1
        });
        navigate('/cart'); // Or direct to checkout if preferred, but cart is safer flow
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(String(product.id));
    };

    return (
        <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            {/* Image Container */}
            <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 relative">
                <Link to={`/product/${product.id}`} className="block w-full h-full relative">
                    {/* Main Image */}
                    <img
                        src={displayImage}
                        alt={product.name}
                        className={cn(
                            "h-full w-full object-cover object-center transition-all duration-700",
                            hoverImage ? "group-hover:opacity-0" : "group-hover:scale-110"
                        )}
                    />

                    {/* Hover Image (if exists) */}
                    {hoverImage && (
                        <img
                            src={hoverImage}
                            alt={`${product.name} - view 2`}
                            className="absolute inset-0 h-full w-full object-cover object-center opacity-0 group-hover:opacity-100 transition-all duration-700 scale-105"
                        />
                    )}
                </Link>

                {/* Heart Toggle */}
                {!showRemoveButton && (
                    <button
                        onClick={handleToggleFavorite}
                        className={cn(
                            "absolute top-3 right-3 p-2 rounded-full shadow-md z-10 transition-all duration-300",
                            isFav ? "bg-white text-primary" : "bg-white/80 text-gray-400 hover:text-primary hover:bg-white"
                        )}
                    >
                        <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
                    </button>
                )}

                {/* Remove Button (For Favorites Page) */}
                {showRemoveButton && (
                    <button
                        onClick={handleToggleFavorite}
                        className="absolute top-3 left-3 p-1.5 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full shadow-md z-10 transition-all duration-300 group/remove"
                        title="Xóa khỏi yêu thích"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                {/* Quick Actions Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex flex-col gap-2">
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-white text-gray-900 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Thêm vào giỏ
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="w-full bg-primary text-white py-2 rounded-full font-bold text-sm hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <CreditCard className="h-4 w-4" />
                        Mua ngay
                    </button>
                </div>

                {/* Sale Badge */}
                {product.sale_price && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                        SALE
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                {product.category?.name && (
                    <p className="text-xs text-gray-500 mb-1 tracking-wide uppercase">{product.category.name}</p>
                )}
                <h3 className="text-sm font-bold font-serif text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    <Link to={`/product/${product.id}`}>
                        {product.name}
                    </Link>
                </h3>
                <div className="flex items-center gap-2 mt-2">
                    {product.sale_price ? (
                        <>
                            <span className="text-primary font-bold text-lg font-sans">{formatPrice(product.sale_price)}</span>
                            <span className="text-gray-400 text-sm line-through font-sans">{formatPrice(product.price)}</span>
                        </>
                    ) : (
                        <span className="text-primary font-bold text-lg font-sans">{formatPrice(product.price)}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
