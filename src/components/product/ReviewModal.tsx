import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: {
        id: string;
        name: string;
        image: string;
    };
    orderId: string;
    userId: string;
}

export function ReviewModal({ isOpen, onClose, onSuccess, product, orderId, userId }: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    product_id: product.id,
                    user_id: userId,
                    order_id: orderId,
                    rating,
                    comment: comment.trim() || null
                });

            if (error) throw error;

            showToast('Cảm ơn bạn đã đánh giá sản phẩm!', 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast('Không thể gửi đánh giá. Vui lòng thử lại.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-primary p-6 text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-xl font-bold">Đánh giá sản phẩm</h3>
                            <p className="text-pink-100 text-sm mt-1">Chia sẻ trải nghiệm của bạn về sản phẩm này</p>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Product Info */}
                            <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-lg border border-stone-200"
                                />
                                <p className="font-bold text-gray-900 line-clamp-2">{product.name}</p>
                            </div>

                            {/* Stars */}
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Bạn thấy sản phẩm thế nào?</p>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className="focus:outline-none transition-transform hover:scale-110"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                        >
                                            <Star
                                                className={`w-10 h-10 ${star <= (hover || rating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-200'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-3 font-bold text-primary">
                                    {rating === 5 && 'Tuyệt vời 😍'}
                                    {rating === 4 && 'Rất tốt 😊'}
                                    {rating === 3 && 'Bình thường 😐'}
                                    {rating === 2 && 'Không hài lòng ☹️'}
                                    {rating === 1 && 'Tệ quá 😡'}
                                </p>
                            </div>

                            {/* Comment */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                    <MessageSquare className="w-4 h-4" />
                                    <label>Lời nhận xét (không bắt buộc)</label>
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Chia sẻ thêm cảm nhận của bạn để giúp những người mua khác nhé..."
                                    className="w-full h-32 px-4 py-3 rounded-2xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Action */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-pink-600 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Gửi đánh giá
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
