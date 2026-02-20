import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
    favorites: string[]; // array of product ids
    toggleFavorite: (productId: string) => Promise<void>;
    isFavorite: (productId: string) => boolean;
    loading: boolean;
    favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('favorites');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Persist Guest favorites to localStorage
    useEffect(() => {
        if (!user) {
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    }, [favorites, user]);

    const fetchFavorites = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await (supabase.from('favorites' as any) as any)
            .select('product_id')
            .eq('user_id', user.id);

        if (!error && data) {
            setFavorites((data as any[]).map(f => f.product_id));
        }
        setLoading(false);
    }, [user?.id]);

    // Initial load and Migration on Login
    useEffect(() => {
        const handleAuthChange = async () => {
            if (user) {
                // Migrate guest favorites if they exist
                const guestFavsRaw = localStorage.getItem('favorites');
                if (guestFavsRaw) {
                    const guestFavs: string[] = JSON.parse(guestFavsRaw);
                    if (guestFavs.length > 0) {
                        for (const productId of guestFavs) {
                            await (supabase.from('favorites' as any) as any)
                                .upsert({ user_id: user.id, product_id: productId }, { onConflict: 'user_id,product_id' });
                        }
                        localStorage.removeItem('favorites'); // Clear guest trace
                    }
                }
                fetchFavorites();
            } else {
                // If logged out, load from localStorage is handled by useState init
            }
        };

        handleAuthChange();
    }, [user, fetchFavorites]);

    // Real-time synchronization
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`favorites_sync_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'favorites',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchFavorites();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchFavorites]);

    const toggleFavorite = async (productId: string) => {
        if (user) {
            // SSOT: Update DB first
            const isFav = favorites.includes(productId);
            if (isFav) {
                await (supabase.from('favorites' as any) as any)
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
            } else {
                await (supabase.from('favorites' as any) as any)
                    .insert({ user_id: user.id, product_id: productId });
            }
            await fetchFavorites(); // Precise sync
        } else {
            // Guest mode: update local state
            setFavorites(prev =>
                prev.includes(productId)
                    ? prev.filter(id => id !== productId)
                    : [...prev, productId]
            );
        }
    };

    const isFavorite = (productId: string) => favorites.includes(productId);
    const favoritesCount = favorites.length;

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading, favoritesCount }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
