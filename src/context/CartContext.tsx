import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CartItem {
    id: string; // product id
    name: string;
    price: number;
    image: string;
    quantity: number;
    color?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
    removeItem: (id: string, color?: string) => Promise<void>;
    updateQuantity: (id: string, quantity: number, color?: string) => Promise<void>;
    clearCart: () => Promise<void>;
    cartCount: number;
    cartTotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    fetchUserCart: () => Promise<void>;
    isProcessing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { user, loading: authLoading } = useAuth();

    // Use ref to prevent double-initialization sync loops
    const initialFetchDone = useRef(false);

    const [sessionId] = useState(() => {
        let id = localStorage.getItem('cart_session_id');
        if (!id) {
            id = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('cart_session_id', id);
        }
        return id;
    });

    const effectiveSessionId = user ? `user_${user.id}` : sessionId;

    const fetchUserCart = useCallback(async () => {
        if (!user?.id) return;

        const { data: cartData, error: cartError } = await (supabase.from('cart_additions' as any) as any)
            .select('*')
            .eq('user_id', user.id);

        if (!cartError && cartData) {
            const validData = cartData.filter((item: any) => item.product_id);
            if (validData.length === 0) {
                setItems([]);
                return;
            }

            const productIds = validData.map((item: any) => item.product_id);
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, name, price, sale_price, images')
                .in('id', productIds);

            if (!productsError && productsData) {
                const hydratedItems: CartItem[] = validData.map((cartItem: any) => {
                    const product = productsData.find(p => p.id === cartItem.product_id);
                    if (!product) return null;
                    return {
                        id: cartItem.product_id,
                        name: product.name,
                        price: product.sale_price || product.price || 0,
                        image: product.images?.[0] || '',
                        quantity: cartItem.quantity,
                        color: cartItem.color
                    };
                }).filter(Boolean) as CartItem[];

                setItems(hydratedItems);
            }
        }
    }, [user?.id]);

    useEffect(() => {
        if (authLoading) return;

        if (user) {
            if (!initialFetchDone.current) {
                console.log('--- SSOT: Primary initialization from Supabase ---');
                fetchUserCart().finally(() => { initialFetchDone.current = true; });
            }
        } else {
            console.log('--- SSOT: Primary initialization from LocalStorage (Guest) ---');
            try {
                const saved = localStorage.getItem('cart');
                setItems(saved ? JSON.parse(saved) : []);
            } catch (e) {
                setItems([]);
            }
        }
    }, [user, authLoading, fetchUserCart]);

    useEffect(() => {
        if (!authLoading && !user) {
            localStorage.setItem('cart', JSON.stringify(items));
        } else if (user) {
            // For logged in users, we NEVER persist current state to localStorage
            // This prevents "migrating" old data back accidentally
        }
    }, [items, user, authLoading]);

    const syncItemToDb = async (id: string, color: string | undefined, quantity: number) => {
        if (!id) return;
        const payload: any = {
            product_id: id,
            color: color || '',
            quantity: quantity,
            user_id: user?.id || null,
            session_id: effectiveSessionId
        };

        const { error } = await (supabase.from('cart_additions' as any) as any).upsert(
            payload,
            { onConflict: 'session_id,product_id,color' }
        );

        if (error) throw error;
    };

    const removeItemFromDb = async (id: string, color: string | undefined) => {
        if (!id) return;
        const matchCriteria: any = { product_id: id, color: color || '' };

        if (user) matchCriteria.user_id = user.id;
        else matchCriteria.session_id = sessionId;

        const { error } = await (supabase.from('cart_additions' as any) as any)
            .delete()
            .match(matchCriteria);

        if (error) throw error;
    };

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`cart_realtime_${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cart_additions', filter: `user_id=eq.${user.id}` },
                () => { fetchUserCart(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id, fetchUserCart]);

    const addItem = async (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        if (!newItem.id || isProcessing) return;
        setIsProcessing(true);

        try {
            const qtyToAdd = newItem.quantity || 1;
            if (user) {
                // Fetch latest state briefly to avoid race condition if possible
                // but upsert usually handles it.
                const existingItem = items.find(item => item.id === newItem.id && item.color === newItem.color);
                const newTotalQty = existingItem ? existingItem.quantity + qtyToAdd : qtyToAdd;

                await syncItemToDb(newItem.id, newItem.color, newTotalQty);
                await fetchUserCart();
            } else {
                setItems(currentItems => {
                    const existingItem = currentItems.find(item =>
                        item.id === newItem.id && item.color === newItem.color
                    );
                    return existingItem
                        ? currentItems.map(item =>
                            (item.id === newItem.id && item.color === newItem.color)
                                ? { ...item, quantity: item.quantity + qtyToAdd }
                                : item
                        )
                        : [...currentItems, { ...newItem, quantity: qtyToAdd }];
                });
            }
            setIsCartOpen(true);
        } catch (error) {
            console.error('Cart add error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const removeItem = async (id: string, color?: string) => {
        if (!id || isProcessing) return;
        setIsProcessing(true);

        try {
            if (user) {
                await removeItemFromDb(id, color);
                // Clear state IMMEDIATELY after successful DB removal to prevent ghosting
                setItems(prev => prev.filter(item => !(item.id === id && item.color === color)));
                // Also trigger a fetch to be 100% sure sync is correct
                await fetchUserCart();
            } else {
                setItems(currentItems => currentItems.filter(item => !(item.id === id && item.color === color)));
                await removeItemFromDb(id, color);
            }
            localStorage.removeItem('cart'); // Double safety
        } catch (error) {
            console.error('Cart remove error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const updateQuantity = async (id: string, quantity: number, color?: string) => {
        if (!id || isProcessing) return;
        if (quantity < 1) {
            await removeItem(id, color);
            return;
        }

        setIsProcessing(true);
        try {
            if (user) {
                await syncItemToDb(id, color, quantity);
                await fetchUserCart();
            } else {
                setItems(currentItems =>
                    currentItems.map(item =>
                        (item.id === id && item.color === color) ? { ...item, quantity } : item
                    )
                );
            }
        } catch (error) {
            console.error('Cart update error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const clearCart = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            localStorage.removeItem('cart');
            if (user) {
                await (supabase.from('cart_additions' as any) as any)
                    .delete()
                    .eq('user_id', user.id);
            } else {
                await (supabase.from('cart_additions' as any) as any)
                    .delete()
                    .eq('session_id', sessionId);
            }
            setItems([]);
        } catch (error) {
            console.error('Cart clear error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const cartCount = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
    const cartTotal = useMemo(() => items.reduce((total, item) => total + (item.price * item.quantity), 0), [items]);

    return (
        <CartContext.Provider value={{
            items, addItem, removeItem, updateQuantity, clearCart,
            cartCount, cartTotal, isCartOpen, setIsCartOpen, fetchUserCart, isProcessing
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) throw new Error('useCart must be used within a CartProvider');
    return context;
}
