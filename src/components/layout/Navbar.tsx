import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, Heart, Globe } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import { SearchOverlay } from '../common/SearchOverlay';

import logo from '../../image/logo.png';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { cartCount } = useCart();
    const { favoritesCount } = useFavorites();
    const { user, signOut } = useAuth();
    const { language, setLanguage, t } = useLanguage();
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
        <>
            <nav className={cn(
                "sticky top-0 z-[9999] transition-all duration-300",
                isScrolled ? "bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm" : "bg-transparent border-b border-transparent"
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo (Left on all screens) */}
                        <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                            <Link to="/" className="flex items-center gap-3">
                                <img src={logo} alt="NDA STORE" className="h-12 md:h-16 w-auto object-contain" />
                                <span className="text-xl md:text-2xl font-serif font-black tracking-widest bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                                    NDA STORE
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Menu - Hidden on Mobile */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-10">
                                {[
                                    { label: t('home'), path: '/' },
                                    { label: t('shop'), path: '/shop' },
                                    { label: t('about'), path: '/about' },
                                    { label: t('contact'), path: '/contact' }
                                ].map((item, index) => (
                                    <Link key={index} to={item.path} className={linkBaseClass}>
                                        {item.label}
                                        {linkHoverEffect}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right Content: Icons & Mobile Menu Button - Fixed Width on Mobile */}
                        <div className="flex items-center space-x-1 md:space-x-4 w-[180px] md:w-auto justify-end overflow-visible pr-1">
                            {/* Icons Overlay (Always Visible & Interactive) */}
                            <div className="flex items-center space-x-0.5 md:space-x-2 overflow-visible" id="cart-badge-container">
                                {/* Language Switcher (Hidden on mobile header, moved to sidebar) */}
                                <button
                                    onClick={() => setLanguage(language === 'VN' ? 'EN' : 'VN')}
                                    className="hidden md:flex items-center justify-center min-w-[36px] h-[36px] text-primary hover:bg-pink-50 rounded-full transition-all font-bold font-sans text-[14px] border border-pink-100 mr-[10px] z-20"
                                    aria-label="Switch Language"
                                >
                                    {language === 'VN' ? 'EN' : 'VN'}
                                </button>

                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="text-gray-600 hover:text-primary hover:bg-pink-50 p-1.5 rounded-full transition-all duration-300 transform hover:rotate-12 z-20"
                                    aria-label="Search"
                                >
                                    <Search className="h-6 w-6" />
                                </button>

                                <Link
                                    to="/favorites"
                                    className="hidden md:flex text-gray-600 hover:text-primary hover:bg-pink-50 p-1.5 rounded-full transition-all duration-300 relative"
                                    aria-label="Favorites"
                                >
                                    <Heart className={cn("h-6 w-6", favoritesCount > 0 && "fill-primary text-primary")} />
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-white">
                                            {favoritesCount}
                                        </span>
                                    )}
                                </Link>

                                <Link
                                    to={user ? "/account" : "/login"}
                                    className="text-gray-600 hover:text-primary hover:bg-pink-50 p-1.5 rounded-full transition-all duration-300"
                                    aria-label="User Account"
                                >
                                    <User className="h-6 w-6" />
                                </Link>

                                <Link
                                    to="/cart"
                                    id="cart-link"
                                    className="text-gray-600 hover:text-primary hover:bg-pink-50 p-1.5 rounded-full transition-all duration-300 relative group overflow-visible"
                                    aria-label="Cart"
                                >
                                    <ShoppingBag className="h-6 w-6 group-hover:animate-bounce-short" />
                                    <AnimatePresence mode="popLayout">
                                        {cartCount > 0 && (
                                            <motion.span
                                                key={cartCount}
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                id="cart-badge"
                                                className="absolute bg-[#D81B60] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center shadow-lg border-2 border-white transform font-sans"
                                                style={{
                                                    position: 'absolute',
                                                    top: '-5px',
                                                    right: '-5px',
                                                    zIndex: 10
                                                }}
                                            >
                                                {cartCount}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>
                            </div>

                            {/* Mobile menu button */}
                            <div className="md:hidden ml-1">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="text-gray-700 hover:text-primary p-1.5 transition-all active:scale-90"
                                    aria-label="Open Menu"
                                >
                                    <Menu className="h-7 w-7" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Side Mobile Sidebar (Professional Design) */}
                <div
                    className={cn(
                        "fixed inset-0 z-[10000] md:hidden transition-all duration-300",
                        isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"
                    )}
                >
                    {/* Backdrop */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity pointer-events-auto",
                            isMenuOpen ? "opacity-100" : "opacity-0"
                        )}
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Sidebar Content */}
                    <div
                        className={cn(
                            "absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl transition-transform duration-300 flex flex-col pointer-events-auto",
                            isMenuOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                    >
                        <div className="p-6 border-b border-pink-100 flex items-center justify-between bg-stone-50">
                            <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                <img src={logo} alt="NDA STORE" className="h-10 w-auto" />
                                <span className="font-serif font-black text-primary text-sm tracking-widest">NDA STORE</span>
                            </Link>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-500 hover:text-primary transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                            {[
                                { label: t('home'), path: '/', icon: Globe },
                                { label: t('shop'), path: '/shop', icon: ShoppingBag },
                                { label: t('cart'), path: '/cart', icon: ShoppingBag, count: cartCount },
                                { label: t('about'), path: '/about', icon: Globe },
                                { label: t('contact'), path: '/contact', icon: Globe },
                                { label: t('favorites'), path: '/favorites', icon: Heart, count: favoritesCount },
                                { label: t('account'), path: '/account', icon: User },
                            ].map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center justify-between px-4 py-3 text-gray-700 hover:text-primary hover:bg-pink-50 rounded-xl transition-all font-medium border border-transparent hover:border-pink-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon className="h-5 w-5 opacity-70" />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.count !== undefined && item.count > 0 && (
                                        <span className="bg-primary text-white text-[10px] font-bold rounded-full h-5 px-2 flex items-center justify-center">
                                            {item.count}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>

                        <div className="p-6 border-t border-pink-100 space-y-3 bg-stone-50">
                            {/* Language Switcher in Sidebar */}
                            <button
                                onClick={() => { setLanguage(language === 'VN' ? 'EN' : 'VN'); setIsMenuOpen(false); }}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-pink-100 rounded-xl text-gray-700 font-medium shadow-sm active:scale-95 transition-all"
                            >
                                <span className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    {language === 'VN' ? 'Tiếng Việt' : 'English'}
                                </span>
                                <span className="text-xs font-bold px-2 py-1 bg-pink-50 text-primary rounded uppercase tracking-tighter">{language}</span>
                            </button>

                            {user ? (
                                <button
                                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                                    className="w-full px-4 py-3 bg-dark text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg"
                                >
                                    {t('logout')}
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full px-4 py-3 bg-dark text-white text-center rounded-xl font-bold active:scale-95 transition-all shadow-lg"
                                >
                                    {t('login')}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
