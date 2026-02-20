import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
    favorites: string[]; // array of product ids
    toggleFavorite: (productId: string) => Promise<void>;
    isFavorite: (productId: string) => boolean;
    loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchFavorites();
        } else {
            setFavorites([]);
        }
    }, [user]);

    const fetchFavorites = async () => {
        setLoading(true);
        const { data, error } = await (supabase.from('favorites' as any) as any)
            .select('product_id')
            .eq('user_id', user?.id);

        if (!error && data) {
            setFavorites((data as any[]).map(f => f.product_id));
        }
        setLoading(false);
    };

    const toggleFavorite = async (productId: string) => {
        if (!user) {
            alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích.');
            return;
        }

        const isFav = favorites.includes(productId);

        if (isFav) {
            // Remove
            const { error } = await (supabase.from('favorites' as any) as any)
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (!error) {
                // Rely on Realtime or update immediately for responsiveness
                setFavorites(prev => prev.filter(id => id !== productId));
            } else {
                console.error('Error removing favorite:', error);
            }
        } else {
            // Add
            const { error } = await (supabase.from('favorites' as any) as any)
                .insert({ user_id: user.id, product_id: productId });

            if (!error) {
                setFavorites(prev => [...prev, productId]);
            } else {
                console.error('Error adding favorite:', error);
            }
        }
    };

    // Real-time synchronization for Favorites
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
    }, [user]);

    const isFavorite = (productId: string) => favorites.includes(productId);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
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
