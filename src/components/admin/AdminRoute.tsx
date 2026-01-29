import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AdminRoute() {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Check if user is logged in AND is admin
    console.log('AdminRoute check - User:', user?.email, 'IsAdmin:', isAdmin);

    if (!user || !isAdmin) {
        console.log('Redirecting to home...');
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
