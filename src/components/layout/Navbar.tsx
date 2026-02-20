import { useState, useEffect } from 'react';
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
    const { favorites } = useFavorites();
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
                "sticky top-0 z-50 transition-all duration-300",
                isScrolled ? "bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm" : "bg-transparent border-b border-transparent"
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Mobile menu button (Moved to Left) */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-600 hover:text-primary p-2 transition-colors -ml-2"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Logo (Gradient Cherry Blossom Theme) */}
                        <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                            <Link to="/" className="flex items-center gap-3">
                                <img src={logo} alt="NDA STORE" className="h-16 w-auto object-contain" />
                                <span className="text-xl md:text-2xl font-serif font-black tracking-widest bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                                    NDA STORE
                                </span>
                            </Link>
                        </div>
                        {/* Desktop Menu */}
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

                        {/* Icons */}
                        <div className="flex items-center space-x-2 md:space-x-6">
                            {/* Language Switcher */}
                            <button
                                onClick={() => setLanguage(language === 'VN' ? 'EN' : 'VN')}
                                className="flex items-center gap-1 text-gray-600 hover:text-primary font-bold transition-colors font-sans"
                            >
                                <Globe className="h-5 w-5" />
                                <span>{language}</span>
                            </button>

                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="text-gray-600 hover:text-primary hover:bg-pink-50 p-2 rounded-full transition-all duration-300 transform hover:rotate-12">
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
                    </div>
                </div>

                {/* Left Side Mobile Sidebar (Professional Design) */}
                <div
                    className={cn(
                        "fixed inset-0 z-[100] md:hidden transition-all duration-300 pointer-events-none",
                        isMenuOpen ? "opacity-100" : "opacity-0"
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
                                { label: t('about'), path: '/about', icon: Globe },
                                { label: t('contact'), path: '/contact', icon: Globe },
                                { label: t('favorites'), path: '/favorites', icon: Heart },
                                { label: t('account'), path: '/account', icon: User },
                            ].map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:text-primary hover:bg-pink-50 rounded-xl transition-all font-medium border border-transparent hover:border-pink-100"
                                >
                                    <item.icon className="h-5 w-5 opacity-70" />
                                    <span>{item.label}</span>
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
