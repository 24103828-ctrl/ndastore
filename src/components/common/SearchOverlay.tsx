import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Reset fields on open if needed, or keep them. 
            // Keeping them might be better UX if user accidentally closed.
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams();
        if (keyword.trim()) params.append('q', keyword.trim());
        if (minPrice) params.append('min', minPrice);
        if (maxPrice) params.append('max', maxPrice);

        navigate(`/shop?${params.toString()}`);
        onClose();
    };

    const handleClear = () => {
        setKeyword('');
        setMinPrice('');
        setMaxPrice('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif font-bold text-dark">{t('search_placeholder')}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-6">
                        {/* Keyword Input */}
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder={t('search_placeholder')}
                                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                autoFocus
                            />
                        </div>

                        {/* Price Range Inputs */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter_price')}</label>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <input
                                        type="number"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        placeholder={t('min_price')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                        min="0"
                                    />
                                </div>
                                <div className="flex items-center text-gray-400">-</div>
                                <div className="flex-1">
                                    <input
                                        type="number"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        placeholder={t('max_price')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-full hover:bg-gray-50 transition-colors"
                            >
                                {t('clear_filter')}
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-dark text-white font-bold py-3 rounded-full hover:bg-primary transition-colors shadow-lg"
                            >
                                {t('search_btn')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
