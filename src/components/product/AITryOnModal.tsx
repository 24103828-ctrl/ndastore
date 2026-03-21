import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, Download, RefreshCcw, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface AITryOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    garmentImage: string;
}

export function AITryOnModal({ isOpen, onClose, productId, productName, garmentImage }: AITryOnModalProps) {
    const { user } = useAuth();
    
    // UI States
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'requesting' | 'processing' | 'completed' | 'error'>('idle');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen && status !== 'processing' && status !== 'completed') {
            resetState();
        }
    }, [isOpen]);

    // Realtime subscription
    useEffect(() => {
        if (!sessionId || status !== 'processing') return;

        console.log(`Subscribing to realtime updates for session: ${sessionId}`);
        
        const channel = supabase
            .channel(`try_on_${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'try_on_requests',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    console.log('Realtime update received:', payload);
                    const newRecord = payload.new as any;
                    
                    if (newRecord.status === 'completed' && newRecord.result_image) {
                        setResultImage(newRecord.result_image);
                        setStatus('completed');
                    } else if (newRecord.status === 'error') {
                        setErrorMsg('Có lỗi xảy ra trong quá trình xử lý AI.');
                        setStatus('error');
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, status]);

    const resetState = () => {
        setFile(null);
        setPreviewUrl(null);
        setStatus('idle');
        setResultImage(null);
        setErrorMsg('');
        setSessionId(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            // Check file type
            if (!selectedFile.type.startsWith('image/')) {
                setErrorMsg('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, ...).');
                return;
            }
            
            // Check file size (limit to 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setErrorMsg('Kích thước ảnh không được vượt quá 5MB.');
                return;
            }

            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setErrorMsg('');
        }
    };

    const handleStartTryOn = async () => {
        if (!file) {
            setErrorMsg('Vui lòng tải lên ảnh của bạn.');
            return;
        }

        try {
            setStatus('uploading');
            setErrorMsg('');

            // B2: Upload ảnh cá nhân
            const fileExt = file.name.split('.').pop();
            const uniqueId = Math.random().toString(36).substring(2, 9);
            const fileName = `${Date.now()}-${uniqueId}.${fileExt}`;
            const filePath = `user_uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tryon-images')
                .upload(filePath, file);

            if (uploadError) {
                throw new Error(`Lỗi upload ảnh: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('tryon-images')
                .getPublicUrl(filePath);

            const humanImageUrl = publicUrl;

            // B3: Tạo session_id ngẫu nhiên
            setStatus('requesting');
            const newSessionId = `NDA-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
            setSessionId(newSessionId);

            // B4: Insert vào Database
            const { error: dbError } = await supabase
                .from('try_on_requests' as any)
                .insert({
                    user_id: user?.id || null, // Allow null if not logged in
                    product_id: productId,
                    session_id: newSessionId,
                    human_image: humanImageUrl,
                    garment_image: garmentImage,
                    status: 'pending'
                });

            if (dbError) {
                throw new Error(`Lỗi lưu CSDL: ${dbError.message}`);
            }

            // B5: Gửi request Webhook
            const webhookUrl = "https://phamhuucuong231.app.n8n.cloud/webhook/1fde6f9a-525c-4533-8565-f859f6a0bbf9";
            
            const webhookPayload = {
                session_id: newSessionId,
                human_image: humanImageUrl,
                garment_image: garmentImage,
                product_name: productName
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(webhookPayload)
            });

            if (!response.ok) {
                console.error("Webhook error:", response.statusText);
                throw new Error("Không thể kết nối tới hệ thống AI. Vui lòng thử lại sau.");
            }

            // B6: Chuyển sang màn hình Loading chờ Realtime
            setStatus('processing');

        } catch (err: any) {
            console.error("Try On Error:", err);
            setErrorMsg(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
            setStatus('error');
        }
    };

    const handleDownload = async () => {
        if (!resultImage) return;
        
        try {
            const response = await fetch(resultImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `XinhBot_AI_TryOn_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading the image:', error);
            // Fallback: Open in new window if download fails due to CORS
            window.open(resultImage, '_blank');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50 to-white">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-bold text-gray-900 font-serif">Thử Đồ AI</h3>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 relative min-h-[400px] flex flex-col justify-center">
                        
                        {/* Loading Overlay */}
                        {status === 'processing' && (
                            <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="mb-6"
                                >
                                    <div className="w-16 h-16 border-4 border-pink-100 border-t-primary rounded-full" />
                                </motion.div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">Đang thiết kế riêng cho bạn...</h4>
                                <p className="text-gray-500 text-sm">
                                    Chuyên viên đang thiết kế riêng cho bạn, vui lòng đợi trong giây lát...<br/>
                                    (Bạn có thể đóng cửa sổ này để xem sản phẩm khác, kết quả sẽ nằm trong <b>Lịch sử thử đồ</b>)
                                </p>
                            </div>
                        )}

                        {/* Completed State */}
                        {status === 'completed' && resultImage && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex flex-col items-center h-full"
                            >
                                <div className="w-full h-[400px] bg-gray-50 rounded-2xl overflow-hidden mb-6 border border-gray-100">
                                    <img 
                                        src={resultImage} 
                                        alt="AI Try On Result" 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex w-full gap-4">
                                    <button 
                                        onClick={resetState}
                                        className="flex-1 py-3 px-4 rounded-xl border-2 border-primary text-primary font-bold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCcw className="w-5 h-5" />
                                        Thử lại
                                    </button>
                                    <button 
                                        onClick={handleDownload}
                                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-pink-600 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Tải ảnh về
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Upload State */}
                        {(status === 'idle' || status === 'error' || status === 'uploading' || status === 'requesting') && (
                            <div className="flex flex-col h-full">
                                <p className="text-gray-600 mb-6 text-sm">
                                    Mặc thử mẫu <span className="font-bold text-gray-900">{productName}</span> lên người bạn ngay lập tức với công nghệ AI của XinhBot.
                                </p>

                                {/* Dropzone / Preview */}
                                <div className="flex-1 mb-6">
                                    {previewUrl ? (
                                        <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border-2 border-stone-200 group">
                                            <img 
                                                src={previewUrl} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="cursor-pointer bg-white text-gray-900 py-2 px-4 rounded-lg font-medium text-sm hover:scale-105 transition-transform">
                                                    Đổi ảnh khác
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full h-[300px] rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 hover:border-primary transition-colors group">
                                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="w-8 h-8 text-primary" />
                                            </div>
                                            <span className="font-bold text-gray-900 mb-1">Tải ảnh của bạn lên</span>
                                            <span className="text-sm text-gray-500">Hỗ trợ JPG, PNG (Tối đa 5MB)</span>
                                            <span className="text-xs text-primary mt-4 max-w-[250px] text-center bg-white px-3 py-1.5 rounded-full border border-pink-100">Mẹo: Chọn ảnh chụp thẳng, thon gọn, không bị che khuất</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Error message */}
                                {errorMsg && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={handleStartTryOn}
                                    disabled={!file || status === 'uploading' || status === 'requesting'}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-pink-600 text-white font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {(status === 'uploading' || status === 'requesting') ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Đang chuẩn bị dữ liệu...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Bắt đầu thử đồ
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
