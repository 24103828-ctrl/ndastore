import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { ProductCard } from '../components/product/ProductCard';
import { Filter, Search } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    sale_price: number | null;
    images: string[] | null;
    category: {
        id: string;
        name: string;
    } | null;
}

interface Category {
    id: string;
    name: string;
}

export function Shop() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
    };

    const fetchProducts = async () => {
        setLoading(true);
        let query = supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name)
      `)
            .order('created_at', { ascending: false });

        // Note: Client-side filtering is often easier for small datasets, 
        // but for scalability we should filter in the query.
        // For now, I'll fetch all and filter client side only for search to keep it simple 
        // real-time search. Complex filtering can be added to query later.

        const { data, error } = await query;
        if (error) console.error('Error fetching products:', error);
        if (data) setProducts(data as any);
        setLoading(false);
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category?.id === selectedCategory;
        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesPrice && matchesSearch;
    });

    return (
        <Layout>
            <div className="bg-stone-50 min-h-screen py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="flex flex-col md:flex-row mb-8 items-center justify-between gap-4">
                        <h1 className="text-3xl font-serif font-bold text-dark">Sản phẩm</h1>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-96">
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            className="md:hidden flex items-center gap-2 text-dark font-medium"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-5 w-5" /> Bộ lộc
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <div className={`md:w-64 flex-shrink-0 space-y-8 ${showFilters ? 'block' : 'hidden md:block'}`}>
                            {/* Categories */}
                            <div>
                                <h3 className="font-bold text-lg mb-4">Danh mục</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className={`block w-full text-left ml-2 text-sm ${selectedCategory === 'all' ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary'}`}
                                        >
                                            Tất cả
                                        </button>
                                    </li>
                                    {categories.map(cat => (
                                        <li key={cat.id}>
                                            <button
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`block w-full text-left ml-2 text-sm ${selectedCategory === cat.id ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Price Filter */}
                            <div>
                                <h3 className="font-bold text-lg mb-4">Khoảng giá</h3>
                                <div className="px-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="10000000"
                                        step="100000"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                        className="w-full accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>{new Intl.NumberFormat('vi-VN').format(priceRange[0])}đ</span>
                                        <span>{new Intl.NumberFormat('vi-VN').format(priceRange[1])}đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1">
                            {loading ? (
                                <div className="text-center py-20">Đang tải sản phẩm...</div>
                            ) : filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500">
                                    Không tìm thấy sản phẩm nào.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
