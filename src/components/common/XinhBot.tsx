import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

/**
 * XinhBot - Persistent Chat Architecture
 * 1. messages state khởi tạo từ LocalStorage (Hiện tức thì)
 * 2. Supabase đồng bộ ngầm khi mount/Visibility Change
 * 3. Chat Instance đồng nhất (Singleton-like) nhờ render tại Root (App.tsx)
 */
export function XinhBot() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Key định danh lịch sử cho từng User
    const STORAGE_KEY = user?.id ? `chat_history_${user.id}` : 'chat_history_guest';
    
    // --- 1. STATE TIN NHẮN BỀN VỮNG (Persistent State) ---
    const [messages, setMessages] = useState<any[]>(() => {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });

    const chatInitialized = useRef(false);
    const chatInstance = useRef<any>(null);

    // --- 2. ĐỘC LẬP: LƯU TIN NHẮN VÀO LOCALSTORAGE ---
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, STORAGE_KEY]);

    useEffect(() => {
        // Log in -> Clear nội bộ n8n session để widget không bị loạn mapping
        if (user) {
            localStorage.removeItem('n8n-chat-session');
        }

        // --- DOM SETUP ---
        const CHAT_TARGET_ID = 'xinhbot-container';
        let chatContainer = document.getElementById(CHAT_TARGET_ID);
        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.id = CHAT_TARGET_ID;
            document.body.appendChild(chatContainer);
        }

        const TOOLTIP_ID = 'xinhbot-tooltip';
        let tooltipEl = document.getElementById(TOOLTIP_ID);
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = TOOLTIP_ID;
            tooltipEl.innerText = '🤖 Hi bạn, cần hỗ trợ thì tới đây nha!!';
            document.body.appendChild(tooltipEl);
        }

        // --- STYLES ---
        const STYLE_ID = 'xinhbot-custom-style';
        if (!document.getElementById(STYLE_ID)) {
            const styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            styleEl.innerHTML = `
                :root {
                    --chat--header--background: linear-gradient(135deg, #FFB7C5, #FF69B4) !important;
                    --chat--header--color: #ffffff !important;
                    --chat--button--background--primary: #FF69B4 !important;
                    --chat--button--border-radius: 20px !important;
                    --chat--message--user--background: #FF69B4 !important;
                    --chat--message--user--color: #ffffff !important;
                    --chat--message--bot--background: #FFF0F5 !important;
                    --chat--message--bot--color: #333333 !important;
                    --chat--toggle--background: #FF69B4 !important;
                }
                .chat-powered-by { display: none !important; }
                #xinhbot-tooltip {
                    position: fixed; bottom: 90px; right: 20px;
                    background-color: #FF69B4; color: white;
                    padding: 10px 15px; border-radius: 20px;
                    font-size: 14px; font-weight: 500;
                    box-shadow: 0 4px 10px rgba(255, 105, 180, 0.4);
                    z-index: 999999; pointer-events: none; opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                }
                .shake-animation { animation: tooltipShake 0.5s ease-in-out infinite; }
                @keyframes tooltipShake {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-3deg); }
                    50% { transform: translateX(5px) rotate(3deg); }
                    75% { transform: translateX(-5px) rotate(-3deg); }
                    100% { transform: translateX(0); }
                }
            `;
            document.head.appendChild(styleEl);
        }

        // Tải Script/CSS Assets
        if (!document.getElementById('n8n-chat-css')) {
            const link = document.createElement('link'); link.id = 'n8n-chat-css';
            link.rel = 'stylesheet'; link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.13.1/dist/style.css';
            document.head.appendChild(link);
        }
        if (!document.getElementById('n8n-chat-script')) {
            const script = document.createElement('script'); script.id = 'n8n-chat-script';
            script.type = 'module';
            script.innerHTML = `import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.13.1/dist/chat.bundle.es.js'; window.createN8nChat = createChat; window.dispatchEvent(new CustomEvent('n8n-chat-loaded'));`;
            document.head.appendChild(script);
        }

        // --- HYDROLOGY (Khôi phục vào Widget) ---
        const syncToWidget = (msgs: any[]) => {
            if (chatInstance.current && typeof chatInstance.current.setMessages === 'function') {
                chatInstance.current.setMessages(msgs);
            }
        };

        // --- FETCH TỪ SUPABASE (Đồng bộ ngầm) ---
        const fetchHistoryFromSupabase = async () => {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('n8n_chat_histories')
                    .select('message')
                    .eq('session_id', user.id)
                    .order('id', { ascending: true });

                if (error) throw error;
                if (data) {
                    const freshMessages = data.map(item => item.message);
                    setMessages(freshMessages); 
                    syncToWidget(freshMessages);
                }
            } catch (err) {
                console.error('Supabase Sync Error:', err);
            }
        };

        // --- TAB VISIBILITY LISTENER ---
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user?.id) {
                fetchHistoryFromSupabase();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // --- GUEST INTERACTION ---
        let redirectTimeout: any;
        const showLoginModal = () => {
            const MODAL_ID = 'xinhbot-login-modal';
            if (document.getElementById(MODAL_ID)) return;
            const overlay = document.createElement('div');
            overlay.id = MODAL_ID; overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:2000000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;';
            overlay.innerHTML = `
                <div style="background:white;padding:30px;border-radius:20px;text-align:center;max-width:340px;box-shadow:0 15px 40px rgba(0,0,0,0.15);border:3px solid #FFB7C5;transform:scale(0.8);transition:transform 0.3s;">
                    <div style="font-size:40px;margin-bottom:15px;">🌸</div>
                    <h3 style="margin-bottom:15px;font-size:18px;color:#333;">Bạn yêu ơi, vui lòng <b>Đăng nhập</b> để được XinhBot hỗ trợ riêng nhé!</h3>
                    <p style="font-size:12px;color:#888;margin-bottom:20px;">Bạn sẽ được chuyển hướng sau 2 giây...</p>
                    <button id="xlogin-btn" style="width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg, #FFB7C5, #FF69B4);color:white;cursor:pointer;font-weight:700;">Đăng nhập ngay 💖</button>
                </div>`;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => { overlay.style.opacity = '1'; (overlay.firstElementChild as HTMLElement).style.transform = 'scale(1)'; });
            const goToLogin = () => { clearTimeout(redirectTimeout); overlay.style.opacity = '0'; setTimeout(() => { if (overlay) overlay.remove(); navigate('/login'); }, 300); };
            overlay.querySelector('#xlogin-btn')?.addEventListener('click', goToLogin);
            redirectTimeout = setTimeout(goToLogin, 2500);
        };

        const handleInteractionCatch = (e: MouseEvent) => {
            if (!user) {
                const container = document.getElementById(CHAT_TARGET_ID);
                if (container && container.contains(e.target as Node)) {
                    e.preventDefault(); e.stopPropagation(); showLoginModal();
                }
            }
        };
        document.addEventListener('click', handleInteractionCatch, true);

        // --- INITIALIZE WIDGET ---
        const initChat = () => {
            if ((window as any).createN8nChat && !chatInitialized.current) {
                const sid = user?.id || 'guest-session';
                chatInstance.current = (window as any).createN8nChat({
                    webhookUrl: 'https://phamhuucuong231.app.n8n.cloud/webhook/004eb129-66fb-431c-9f64-2fa8df0954dd/chat',
                    target: '#xinhbot-container', mode: 'window', showWelcomeScreen: true,
                    initialMessages: ['Xin chào! Mình là XINHBOT 🌸', 'Mình có thể giúp gì cho bạn hôm nay?'],
                    metadata: { user_id: sid, email: user?.email || 'guest@ndastore.vn' },
                    i18n: { en: { title: 'XINHBOT', inputPlaceholder: 'Nhập tin nhắn...' } }
                });
                chatInitialized.current = true;
                
                // Khôi phục ngay từ messages state (đã có data từ LocalStorage khi khởi tạo component)
                if (messages.length > 0) {
                    setTimeout(() => syncToWidget(messages), 500);
                }
                
                if (user?.id) {
                    fetchHistoryFromSupabase();
                }
            }
        };

        if ((window as any).createN8nChat) initChat();
        else window.addEventListener('n8n-chat-loaded', initChat);

        // --- CLEAR HISTORY MODAL ---
        const showClearConfirmModal = () => {
            const MODAL_ID = 'xinhbot-confirm-modal';
            const overlay = document.createElement('div');
            overlay.id = MODAL_ID; overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200000;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:white;padding:24px;border-radius:16px;text-align:center;width:280px;border:2px solid #FFB7C5;">
                    <h3 style="margin-bottom:20px;font-size:16px;">Làm mới cuộc trò chuyện?</h3>
                    <div style="display:flex;gap:12px;justify-content:center;">
                        <button id="xbtn-no" style="padding:8px 15px;border-radius:10px;border:1px solid #ddd;cursor:pointer;">Hủy</button>
                        <button id="xbtn-yes" style="padding:8px 15px;border-radius:10px;border:none;background:linear-gradient(135deg, #FFB7C5, #FF69B4);color:white;cursor:pointer;">Đồng ý</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#xbtn-no')?.addEventListener('click', () => overlay.remove());
            overlay.querySelector('#xbtn-yes')?.addEventListener('click', async () => {
                if (user?.id) {
                    await supabase.from('n8n_chat_histories').delete().eq('session_id', user.id);
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem('n8n-chat-session');
                    setMessages([]);
                    window.location.reload();
                }
            });
        };

        // --- SCAN SHADOW DOM & TOOLTIP ANIMATION ---
        let ttIv: any, sdIv: any, syncIv: any;
        const animateTt = () => { if (tooltipEl) { tooltipEl.style.opacity = '1'; tooltipEl.classList.add('shake-animation'); setTimeout(() => { if (tooltipEl) { tooltipEl.style.opacity = '0'; tooltipEl.classList.remove('shake-animation'); } }, 3000); } };
        ttIv = setInterval(animateTt, 15000); setTimeout(animateTt, 1000);

        let isChatOpen = false;
        const scanSD = (node: Node) => {
            if (!node) return;
            if ((node as Element).shadowRoot) scanSD((node as Element).shadowRoot as any as Node);
            if (node.nodeType === 1 && (node as Element).classList) {
                const el = node as HTMLElement;
                if (el.classList.contains('chat-window')) { const c = window.getComputedStyle(el); if (c.display !== 'none' && c.opacity !== '0') isChatOpen = true; }
                if (el.classList.contains('chat-header') && !el.querySelector('.xinhbot-refresh-btn')) {
                    const b = document.createElement('button'); b.className = 'xinhbot-refresh-btn';
                    b.style.cssText = 'background:none;border:none;color:white;cursor:pointer;padding:8px;margin-left:auto;';
                    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';
                    b.onclick = (e) => { e.stopPropagation(); showClearConfirmModal(); };
                    el.appendChild(b); el.style.justifyContent = 'space-between';
                }
            }
            node.childNodes.forEach(scanSD);
        };
        sdIv = setInterval(() => { isChatOpen = false; scanSD(chatContainer || document.body); if (tooltipEl) tooltipEl.style.opacity = isChatOpen ? '0' : tooltipEl.style.opacity; }, 500);

        // --- SYNC WIDGET -> STATE (Polling fallback) ---
        syncIv = setInterval(() => {
            if (chatInstance.current && typeof chatInstance.current.getMessages === 'function') {
                const currentMsgs = chatInstance.current.getMessages();
                if (currentMsgs && currentMsgs.length > messages.length) {
                    setMessages(currentMsgs);
                }
            }
        }, 3000);

        return () => {
            window.removeEventListener('n8n-chat-loaded', initChat);
            document.removeEventListener('click', handleInteractionCatch, true);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(ttIv); clearInterval(sdIv); clearInterval(syncIv); clearTimeout(redirectTimeout);
            // Chúng ta KHÔNG remove container ở đây để giữ trạng thái khi navigage
            // Tuy nhiên, vì React useEffect re-run khi user đổi, chúng ta cần cẩn thận
            // Nếu unmount thật sự (App unmount), container nên mất. 
            // Nhưng trong App.tsx, XinhBot luôn sống.
        };
    }, [user, navigate, messages.length, STORAGE_KEY]);

    return null;
}
