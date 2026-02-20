import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Use a simplified Product type for the cart
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const { user } = useAuth();

    const [sessionId] = useState(() => {
        let id = localStorage.getItem('cart_session_id');
        if (!id) {
            id = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('cart_session_id', id);
        }
        return id;
    });

    const effectiveSessionId = user ? `user_${user.id}` : sessionId;

    // Save Guest items to localStorage ONLY (SSOT for guests)
    useEffect(() => {
        if (!user) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, user]);

    // Unified Fetch from Database (SSOT for logged-in users)
    const fetchUserCart = useCallback(async () => {
        if (!user?.id) return;

        const { data: cartData, error: cartError } = await (supabase.from('cart_additions' as any) as any)
            .select('*')
            .eq('user_id', user.id);

        if (!cartError && cartData) {
            if (cartData.length === 0) {
                setItems([]);
                return;
            }

            const productIds = cartData.map((item: any) => item.product_id);
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, name, price, sale_price, images')
                .in('id', productIds);

            if (!productsError && productsData) {
                const hydratedItems: CartItem[] = cartData.map((cartItem: any) => {
                    const product = productsData.find(p => p.id === cartItem.product_id);
                    return {
                        id: cartItem.product_id,
                        name: product?.name || 'Unknown Product',
                        price: product?.sale_price || product?.price || 0,
                        image: product?.images?.[0] || '',
                        quantity: cartItem.quantity,
                        color: cartItem.color
                    };
                });
                setItems(hydratedItems);
            }
        }
    }, [user?.id]);

    const syncItemToDb = async (id: string, color: string | undefined, quantity: number) => {
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

        if (error) console.error('Cart sync error:', error);
    };

    const removeItemFromDb = async (id: string, color: string | undefined) => {
        const { error } = await (supabase.from('cart_additions' as any) as any)
            .delete()
            .match({
                session_id: effectiveSessionId,
                product_id: id,
                color: color || ''
            });

        if (error) console.error('Cart remove error:', error);
    };

    // Migrate guest cart to user cart on login and Clear Guest Local Storage
    useEffect(() => {
        const migrateCart = async () => {
            if (user?.id && items.length > 0) {
                // If there is guest data in state/storage, push it to user account
                const savedGuestItems = localStorage.getItem('cart');
                if (savedGuestItems) {
                    const guestItems: CartItem[] = JSON.parse(savedGuestItems);
                    for (const item of guestItems) {
                        await syncItemToDb(item.id, item.color, item.quantity);
                    }
                    localStorage.removeItem('cart'); // Success migrate, clear guest trace
                }
                fetchUserCart();
            } else if (user?.id) {
                fetchUserCart();
            }
        };

        if (user) {
            migrateCart();
        }
    }, [user?.id, fetchUserCart]);

    // Set up Realtime listener
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`cart_sync_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cart_additions',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchUserCart();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchUserCart]);

    const addItem = async (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        const qtyToAdd = newItem.quantity || 1;

        if (user) {
            const existingItem = items.find(item => item.id === newItem.id && item.color === newItem.color);
            const newTotalQty = existingItem ? existingItem.quantity + qtyToAdd : qtyToAdd;
            await syncItemToDb(newItem.id, newItem.color, newTotalQty);
            await fetchUserCart(); // Force refetch for immediate precision
        } else {
            setItems(currentItems => {
                const existingItem = currentItems.find(item =>
                    item.id === newItem.id && item.color === newItem.color
                );
                if (existingItem) {
                    return currentItems.map(item =>
                        (item.id === newItem.id && item.color === newItem.color)
                            ? { ...item, quantity: item.quantity + qtyToAdd }
                            : item
                    );
                }
                return [...currentItems, {
                    id: newItem.id,
                    name: newItem.name,
                    price: newItem.price,
                    image: newItem.image,
                    quantity: qtyToAdd,
                    color: newItem.color
                }];
            });
        }
        setIsCartOpen(true);
    };

    const removeItem = async (id: string, color?: string) => {
        if (user) {
            await removeItemFromDb(id, color);
            await fetchUserCart();
        } else {
            setItems(currentItems => currentItems.filter(item => !(item.id === id && item.color === color)));
        }
    };

    const updateQuantity = async (id: string, quantity: number, color?: string) => {
        if (quantity < 1) {
            await removeItem(id, color);
            return;
        }

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
    };

    const clearCart = async () => {
        if (user) {
            const { error } = await (supabase.from('cart_additions' as any) as any)
                .delete()
                .eq('user_id', user.id);

            if (!error) {
                setItems([]);
            }
        } else {
            setItems([]);
        }
    };

    const cartCount = items.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal,
            isCartOpen,
            setIsCartOpen,
            fetchUserCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
