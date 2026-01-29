import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, LogOut, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { cn } from '../../lib/utils';

import logo from '../../image/logo.png';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { cartCount } = useCart();
    const { favorites } = useFavorites();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const linkBaseClass = "relative text-gray-700 hover:text-primary transition-colors duration-300 font-medium tracking-wide group py-2";
    const linkHoverEffect = (
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ease-out group-hover:w-full" />
    );

    return (
        <nav className={cn(
            "sticky top-0 z-50 transition-all duration-300",
            isScrolled ? "bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm" : "bg-transparent border-b border-transparent"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo (Gradient Cherry Blossom Theme) */}
                    <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                        <Link to="/" className="flex items-center gap-3">
                            <img src={logo} alt="NDA STORE" className="h-16 w-auto object-contain" />
                            <span className="text-2xl font-serif font-black tracking-widest bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                                NDA STORE
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-10">
                            {['Trang chủ', 'Sản phẩm', 'Về chúng tôi', 'Liên hệ'].map((item, index) => {
                                const path = item === 'Trang chủ' ? '/' : item === 'Sản phẩm' ? '/shop' : `/${item.toLowerCase().replace(/ /g, '-')}`; // Simple mapping
                                // Fix mapping specifically
                                const realPath = item === 'Trang chủ' ? '/' : item === 'Sản phẩm' ? '/shop' : '/';
                                return (
                                    <Link key={index} to={realPath} className={linkBaseClass}>
                                        {item}
                                        {linkHoverEffect}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Icons */}
                    <div className="flex items-center space-x-2 md:space-x-6">
                        <button className="text-gray-600 hover:text-primary hover:bg-pink-50 p-2 rounded-full transition-all duration-300 transform hover:rotate-12">
                            <Search className="h-6 w-6" />
                        </button>

                        <div className="hidden md:block">
                            {user ? (
                                <Link to="/account" className="text-gray-600 hover:text-primary hover:bg-pink-50 p-2 rounded-full transition-all duration-300 block">
                                    <User className="h-6 w-6" />
                                </Link>
                            ) : (
                                <Link to="/login" className="text-gray-600 hover:text-primary hover:bg-pink-50 p-2 rounded-full transition-all duration-300 block">
                                    <User className="h-6 w-6" />
                                </Link>
                            )}
                        </div>

                        <Link to="/favorites" className="text-gray-600 hover:text-primary hover:bg-pink-50 p-2 rounded-full transition-all duration-300 relative group">
                            <Heart className={cn("h-6 w-6 transition-colors", favorites.length > 0 ? "fill-primary text-primary" : "group-hover:text-primary")} />
                            {favorites.length > 0 && (
                                <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white transform group-hover:scale-110 transition-transform">
                                    {favorites.length}
                                </span>
                            )}
                        </Link>

                        <Link to="/cart" className="text-gray-600 hover:text-primary hover:bg-pink-50 p-2 rounded-full transition-all duration-300 relative group">
                            <ShoppingBag className="h-6 w-6 group-hover:animate-bounce-short" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white transform group-hover:scale-110 transition-transform">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 hover:text-primary p-2 transition-colors"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-pink-100 absolute w-full shadow-xl">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {['Trang chủ', 'Sản phẩm', 'Yêu thích', 'Tài khoản', 'Đăng nhập', 'Đăng xuất'].map((item) => {
                            if (item === 'Đăng xuất' && !user) return null;
                            if (item === 'Đăng nhập' && user) return null;

                            // Logic mapping
                            let toPath = '/';
                            if (item === 'Sản phẩm') toPath = '/shop';
                            if (item === 'Yêu thích') toPath = '/favorites';
                            if (item === 'Tài khoản') toPath = '/account';
                            if (item === 'Đăng nhập') toPath = '/login';

                            if (item === 'Đăng xuất') {
                                return (
                                    <button key={item} onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-gray-700 hover:text-primary hover:bg-pink-50 rounded-lg transition-all font-medium">
                                        {item}
                                    </button>
                                )
                            }

                            return (
                                <Link
                                    key={item}
                                    to={toPath}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-700 hover:text-primary hover:bg-pink-50 rounded-lg transition-all font-medium"
                                >
                                    {item}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}
