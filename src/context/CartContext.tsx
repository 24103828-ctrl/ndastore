import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartItem {
    id: string; // product id
    dbId?: string | number; // row id in database
    name: string;
    price: number;
    image: string;
    quantity: number;
    color?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (id: string, color?: string) => Promise<void>;
    updateQuantity: (id: string, quantity: number, color?: string) => void;
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
    const { showToast } = useToast();

    const initialFetchDone = useRef(false);
    // Track debounced syncs per product+color combo
    const syncTimersRef = useRef<Record<string, any>>({});

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

        console.log('Fetching cart from Supabase...');
        const { data: cartData, error: cartError } = await (supabase.from('cart_additions' as any) as any)
            .select('*')
            .eq('user_id', user.id);

        if (cartError) {
            console.error('Cart fetch error:', cartError);
            return;
        }

        if (cartData) {
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
                        dbId: cartItem.id,
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
                fetchUserCart().finally(() => { initialFetchDone.current = true; });
            }
        } else {
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
        }
    }, [items, user, authLoading]);

    const syncItemToDbBatch = async (id: string, color: string | undefined, quantity: number) => {
        const payload: any = {
            product_id: id,
            color: color || '',
            quantity: quantity,
            user_id: user?.id || null,
            session_id: effectiveSessionId
        };

        setIsProcessing(true);
        try {
            const { error } = await (supabase.from('cart_additions' as any) as any).upsert(
                payload,
                { onConflict: 'session_id,product_id,color' }
            );
            if (error) throw error;
        } catch (error: any) {
            console.error('Batch sync error:', error);
            showToast('Lỗi đồng bộ giỏ hàng', 'error');
            fetchUserCart(); // Rollback to server state
        } finally {
            setIsProcessing(false);
        }
    };

    const debouncedSync = (id: string, color: string | undefined) => {
        if (!user) return; // Guests use localStorage only

        const key = `${id}_${color || ''}`;
        if (syncTimersRef.current[key]) {
            clearTimeout(syncTimersRef.current[key]);
        }

        syncTimersRef.current[key] = setTimeout(() => {
            // Pull the LATEST quantity from state when the timer fires
            setItems(currentItems => {
                const item = currentItems.find(i => i.id === id && i.color === color);
                if (item) {
                    syncItemToDbBatch(id, color, item.quantity);
                }
                return currentItems;
            });
            delete syncTimersRef.current[key];
        }, 800); // 800ms debounce
    };

    const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        if (!newItem.id) return;

        let finalQuantity = newItem.quantity || 1;

        // 1. Immediate UI update (High Speed Addition)
        setItems(prevItems => {
            const existing = prevItems.find(i => i.id === newItem.id && i.color === newItem.color);
            if (existing) {
                finalQuantity = existing.quantity + (newItem.quantity || 1);
                return prevItems.map(i => i === existing ? { ...i, quantity: finalQuantity } : i);
            }
            return [...prevItems, { ...newItem, quantity: finalQuantity }];
        });
        setIsCartOpen(true);

        // 2. Schedule Sync (debouncedSync will pull the latest quantity from state)
        debouncedSync(newItem.id, newItem.color);
    };

    const updateQuantity = (id: string, quantity: number, color?: string) => {
        if (!id) return;
        if (quantity < 1) {
            removeItem(id, color);
            return;
        }

        // 1. Immediate UI update
        setItems(prev => prev.map(item => (item.id === id && item.color === color) ? { ...item, quantity } : item));

        // 2. Schedule Sync
        debouncedSync(id, color);
    };

    const removeItemFromDb = async (id: string, color: string | undefined, dbId?: string | number) => {
        if (!id && !dbId) return;

        let query = (supabase.from('cart_additions' as any) as any).delete();

        if (dbId) {
            query = query.eq('id', dbId);
        } else {
            const matchCriteria: any = { product_id: id, color: color || '' };
            if (user) matchCriteria.user_id = user.id;
            else matchCriteria.session_id = sessionId;
            query = query.match(matchCriteria);
        }

        const { error } = await query;
        if (error) throw error;
    };

    const removeItem = async (id: string, color?: string) => {
        if (!id || isProcessing) return;
        setIsProcessing(true);

        const itemToRemove = items.find(item => item.id === id && item.color === color);
        setItems(prev => prev.filter(item => !(item.id === id && item.color === color)));

        try {
            await removeItemFromDb(id, color, itemToRemove?.dbId);
            localStorage.removeItem('cart');
        } catch (error: any) {
            console.error('Cart remove error:', error);
            alert(`Xóa thất bại: ${error.message}`);
            fetchUserCart();
        } finally {
            setIsProcessing(false);
        }
    };

    const clearCart = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        const originalItems = [...items];
        setItems([]);
        localStorage.removeItem('cart');

        try {
            if (user) {
                await (supabase.from('cart_additions' as any) as any).delete().eq('user_id', user.id);
            } else {
                await (supabase.from('cart_additions' as any) as any).delete().eq('session_id', sessionId);
            }
        } catch (error: any) {
            console.error('Cart clear error:', error);
            alert(`Xóa giỏ hàng thất bại: ${error.message}`);
            setItems(originalItems);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`cart_realtime_${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cart_additions', filter: `user_id=eq.${user.id}` },
                () => {
                    // Only re-fetch if not currently syncing or pending sync
                    if (!isProcessing && Object.keys(syncTimersRef.current).length === 0) {
                        fetchUserCart();
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id, fetchUserCart, isProcessing]);

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
