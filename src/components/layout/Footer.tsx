import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="bg-dark text-white pt-12 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-2xl font-serif text-primary mb-4">NDA STORE</h3>
                        <p className="text-gray-400 text-sm">
                            Thương hiệu túi xách thời trang cao cấp, mang đến vẻ đẹp sang trọng và đẳng cấp cho phái đẹp.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-medium mb-4">Liên kết nhanh</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/shop" className="hover:text-primary transition-colors">Sản phẩm</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors">Về chúng tôi</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">Liên hệ</Link></li>
                            <li><Link to="/policy" className="hover:text-primary transition-colors">Chính sách đồi trả</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-medium mb-4">Liên hệ</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>Số 123, Đường ABC, TP.HCM</li>
                            <li>Hotline: 0123 456 789</li>
                            <li>Email: support@ndastore.com</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-medium mb-4">Kết nối</h4>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Facebook className="h-6 w-6" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Instagram className="h-6 w-6" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Twitter className="h-6 w-6" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} NDA STORE. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
