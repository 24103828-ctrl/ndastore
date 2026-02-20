import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    const fetchFavorites = useCallback(async () => {
        if (!user) return;

        console.log('Fetching favorites from Supabase...');
        setLoading(true);
        const { data, error } = await (supabase.from('favorites' as any) as any)
            .select('product_id')
            .eq('user_id', user.id);

        if (!error && data) {
            setFavorites((data as any[]).map(f => f.product_id).filter(Boolean));
        } else if (error) {
            console.error('Favorites fetch error:', error);
        }
        setLoading(false);
    }, [user?.id]);

    // Initial load logic: Strict SSOT
    useEffect(() => {
        if (authLoading) return;

        if (user) {
            // User: Ignore localStorage, fetch from Supabase
            fetchFavorites();
        } else {
            // Guest: load from localStorage
            try {
                const saved = localStorage.getItem('favorites');
                setFavorites(saved ? JSON.parse(saved) : []);
            } catch (e) {
                console.error('Error loading guest favorites:', e);
                setFavorites([]);
            }
            setLoading(false);
        }
    }, [user, authLoading, fetchFavorites]);

    // Persist Guest favorites to localStorage ONLY
    useEffect(() => {
        if (!authLoading && !user) {
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    }, [favorites, user, authLoading]);

    // Real-time synchronization
    useEffect(() => {
        if (!user) return;

        console.log(`Setting up Realtime favorites sync for user: ${user.id}`);
        const channel = supabase
            .channel(`favorites_realtime_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'favorites',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Favorites Realtime change detected:', payload.eventType);
                    fetchFavorites(); // Derived favoritesCount will update
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchFavorites]);

    const toggleFavorite = async (productId: string) => {
        if (!productId) return;

        if (user) {
            // SSOT: Update DB first
            setLoading(true);
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
            // Always fetch again to ensure precision
            await fetchFavorites();
        } else {
            // Guest mode: update local state
            setFavorites(prev => {
                const updated = prev.includes(productId)
                    ? prev.filter(id => id !== productId)
                    : [...prev, productId];
                return updated;
            });
        }
    };

    const isFavorite = (productId: string) => favorites.includes(productId);

    // Derived state: Derived from the synchronized 'favorites' array
    const favoritesCount = useMemo(() => favorites.length, [favorites]);

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
