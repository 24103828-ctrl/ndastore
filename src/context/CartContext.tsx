import { createContext, useContext, useState, useEffect } from 'react';
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
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (id: string, color?: string) => void;
    updateQuantity: (id: string, quantity: number, color?: string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        // Load from local storage on init
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    // Save to local storage whenever items change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const { user } = useAuth();
    const [sessionId] = useState(() => {
        let id = localStorage.getItem('cart_session_id');
        if (!id) {
            id = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('cart_session_id', id);
        }
        return id;
    });

    const syncItemToDb = async (id: string, color: string | undefined, quantity: number) => {
        const { error } = await (supabase.from('cart_additions' as any) as any).upsert({
            session_id: sessionId,
            product_id: id,
            color: color || '',
            user_id: user?.id || null,
            quantity: quantity
        }, { onConflict: 'session_id,product_id,color' });

        if (error) console.error('Cart sync error:', error);
    };

    const removeItemFromDb = async (id: string, color: string | undefined) => {
        const { error } = await (supabase.from('cart_additions' as any) as any)
            .delete()
            .match({
                session_id: sessionId,
                product_id: id,
                color: color || ''
            });

        if (error) console.error('Cart remove error:', error);
    };

    // Update user_id in database when user logs in
    useEffect(() => {
        if (user?.id) {
            (supabase.from('cart_additions' as any) as any)
                .update({ user_id: user.id })
                .eq('session_id', sessionId)
                .then(({ error }: any) => {
                    if (error) console.error('Error linking cart to user:', error);
                });
        }
    }, [user, sessionId]);

    // Initial Sync and Fetch from Database
    useEffect(() => {
        const fetchUserCart = async () => {
            if (!user?.id) return;

            const { data: cartData, error: cartError } = await (supabase.from('cart_additions' as any) as any)
                .select('*')
                .eq('user_id', user.id);

            if (!cartError && cartData && cartData.length > 0) {
                const productIds = cartData.map((item: any) => item.product_id);

                // Fetch product details for all IDs in the cart
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

                    // Merge strategy: Database items take precedence, but we could also merge with current local items
                    setItems(hydratedItems);
                }
            } else if (!cartError && cartData?.length === 0) {
                setItems([]);
            }
        };

        if (user) {
            fetchUserCart();

            // Real-time synchronization
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
        }

        if (items.length > 0) {
            items.forEach(item => {
                syncItemToDb(item.id, item.color, item.quantity);
            });
        }
    }, [user]); // Run when user changes

    const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        const qtyToAdd = newItem.quantity || 1;

        setItems(currentItems => {
            const existingItem = currentItems.find(item =>
                item.id === newItem.id && item.color === newItem.color
            );

            const newTotalQty = existingItem ? existingItem.quantity + qtyToAdd : qtyToAdd;

            // Trigger sync with the correct total quantity
            syncItemToDb(newItem.id, newItem.color, newTotalQty);

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

        setIsCartOpen(true); // Open cart when adding item
    };

    const removeItem = (id: string, color?: string) => {
        setItems(currentItems => {
            const filtered = currentItems.filter(item => !(item.id === id && item.color === color));
            removeItemFromDb(id, color);
            return filtered;
        });
    };

    const updateQuantity = (id: string, quantity: number, color?: string) => {
        if (quantity < 1) {
            removeItem(id, color);
            return;
        }

        setItems(currentItems => {
            const updated = currentItems.map(item =>
                (item.id === id && item.color === color) ? { ...item, quantity } : item
            );

            // Sync the specific new quantity
            syncItemToDb(id, color, quantity);

            return updated;
        });
    };

    const clearCart = () => {
        setItems([]);
        (supabase.from('cart_additions' as any) as any)
            .delete()
            .eq('session_id', sessionId)
            .then(({ error }: any) => {
                if (error) console.error('Cart clear error:', error);
            });
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
            setIsCartOpen
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
