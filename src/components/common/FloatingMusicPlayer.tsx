import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Volume2, VolumeX } from 'lucide-react';
import { FaMusic } from 'react-icons/fa6';
import { cn } from '../../lib/utils';

export function FloatingMusicPlayer() {
    // Sửa lại điều kiện render ĐẦU TIÊN của component
    if (window.location.pathname.startsWith('/admin')) return null;

    const [showButton, setShowButton] = useState(false);
    const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
    const [musicUrl, setMusicUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetchMusicSettings();

        // Lắng nghe realtime từ bảng site_settings để cập nhật ngay nếu admin đổi
        const channel = supabase
            .channel('site_settings_music')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'site_settings',
                    filter: "key=eq.music_player_settings"
                },
                () => {
                    fetchMusicSettings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchMusicSettings = async () => {
        try {
            const { data: fetchedData, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'music_player_settings');

            console.log('Music Settings fetch từ DB:', fetchedData);

            if (!error && fetchedData && fetchedData.length > 0) {
                // Phải lấy dữ liệu đúng từ cột value của JSONB
                const settings = fetchedData[0]?.value as any;
                
                if (settings && settings.show_button === true) {
                    setShowButton(true);
                    setAutoPlayEnabled(settings.auto_play === true);
                    setMusicUrl(settings.url || '');
                } else {
                    setShowButton(false);
                }
            } else {
                setShowButton(false);
            }
        } catch (error) {
            console.error('Lỗi khi fetch cài đặt nhạc nền:', error);
            setShowButton(false);
        }
    };

    // Nếu không có dữ liệu HOẶC show_button không phải là true thì ẨN HOÀN TOÀN
    if (showButton !== true) return null;

    // Handle play/pause logic
    const togglePlay = () => {
        if (audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(e => console.error("Play prevented", e));
            } else {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    // Handle mute logic
    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-[9999] bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border border-pink-100 group min-w-[3rem] h-12 px-3">
            <audio 
                ref={audioRef} 
                src={musicUrl} 
                loop 
                autoPlay={autoPlayEnabled}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            
            <div className="flex items-center gap-2">
                <div 
                    onClick={togglePlay}
                    className={cn(
                        "w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 shadow-sm cursor-pointer transition-transform hover:scale-110",
                        isPlaying && "animate-[spin_4s_linear_infinite]"
                    )}
                    title={isPlaying ? "Dừng nhạc" : "Phát nhạc"}
                >
                    <div className="relative flex items-center justify-center w-5 h-5">
                        <FaMusic className="w-full h-full text-pink-500" />
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[130%] h-[2.5px] bg-pink-600 rotate-45 rounded-full" />
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center gap-1 opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto transition-all overflow-hidden duration-300">
                    <button 
                        onClick={toggleMute}
                        className="p-1.5 hover:bg-pink-100 rounded-full text-gray-500 transition"
                        title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                    >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
