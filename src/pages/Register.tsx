import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { supabase } from '../lib/supabase';

export function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    // Redirect is mostly for email links, but good compatibility
                    emailRedirectTo: window.location.origin,
                },
            });

            if (signUpError) {
                if (signUpError.message.includes('rate limit')) {
                    setError('Bạn đang thao tác quá nhanh. Vui lòng thử lại sau giây lát, hoặc kiểm tra email.');
                } else {
                    setError(signUpError.message);
                }
            } else {
                // If "Confirm Email" is disabled in Supabase, we get a user and session immediately.
                if (data.user) {
                    // We attempt to insert email, but wrap in try/catch or just be aware it might fail if col missing
                    const { error: profileError } = await supabase.from('profiles').insert([
                        {
                            id: data.user.id,
                            full_name: fullName,
                            username: email.split('@')[0],
                            email: email // We hope this column is added by the user
                        }
                    ]);
                    if (profileError) console.error('Error creating profile (Identity might be missing):', profileError);
                }

                // If session is established, navigate
                if (data.session) {
                    navigate('/');
                } else if (data.user && !data.session) {
                    // This means email confirmation is likely enabled
                    setError('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.');
                    // Optionally try a direct sign in just in case (will likely fail if not confirmed)
                    // But usually we just tell them to check email.
                } else {
                    navigate('/');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-serif font-bold text-gray-900">
                            Đăng ký tài khoản
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Hoặc{' '}
                            <Link to="/login" className="font-medium text-primary hover:text-dark">
                                đăng nhập nếu đã có tài khoản
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                                {error}
                            </div>
                        )}
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                    placeholder="Họ và tên"
                                />
                            </div>
                            <div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 border-t-0 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                    placeholder="Email"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md border-t-0 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                    placeholder="Mật khẩu"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-dark hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Đang xử lý...' : 'Đăng ký'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
