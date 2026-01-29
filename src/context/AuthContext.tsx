import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { type Session, type User } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isAdmin: boolean; // [NEW]
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false); // [NEW] Admin state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdminStatus(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdminStatus(session.user.id);
            } else {
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        console.log('Setting up realtime auth protection for:', user.id);
        const channel = supabase
            .channel(`public:profiles:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`
            }, async (payload) => {
                console.log('Profile changed:', payload);

                if (payload.eventType === 'DELETE') {
                    await signOut();
                    alert('Tài khoản của bạn đã bị xóa bởi quản trị viên.');
                } else if (payload.eventType === 'UPDATE') {
                    const newProfile = payload.new as any;
                    if (newProfile.is_banned) {
                        await signOut();
                        alert('Tài khoản của bạn đã bị khóa bởi quản trị viên.');
                    } else {
                        // Refresh admin status if roles changed
                        setIsAdmin(!!newProfile.is_admin);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const checkAdminStatus = async (userId: string) => {
        try {
            console.log('Checking admin status for:', userId);

            // First, ensure profile exists (Fallback for DB triggers)
            await ensureProfileExists(userId);

            const { data, error } = await supabase
                .from('profiles')
                .select('is_admin, is_banned')
                .eq('id', userId)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user status:', error);
            }

            if (data && (data as any).is_banned) {
                console.log('Access denied: User is banned');
                await signOut();
                alert('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
                return;
            }

            console.log('User status result:', data);
            setIsAdmin(!!(data as any)?.is_admin);
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    const ensureProfileExists = async (userId: string) => {
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();

        if (!profile) {
            console.log('--- SYNC: Profile not found, creating fallback record ---');
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('profiles').insert({
                    id: userId,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Khách hàng mới',
                    avatar_url: user.user_metadata?.avatar_url || '',
                    is_admin: false,
                    updated_at: new Date().toISOString()
                } as any);
                if (error) console.error('--- SYNC ERROR ---', error);
                else console.log('--- SYNC SUCCESS: Profile Created ---');
            }
        }
    };

    const signOut = async () => {
        console.log('Performing sign out...');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ session, user, isAdmin, loading, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
