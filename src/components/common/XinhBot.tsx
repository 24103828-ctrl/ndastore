import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

/**
 * XinhBot - Strict Header Design + Persistent State
 * - Sync Auth State
 * - Fixed Header: 60px, Centered 'XINHBOT', 🔄 Refresh Icon
 * - Login Modal & Fetch logic preserved
 */
export function XinhBot() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // 1. NGAY LẬP TỨC UPDATE USER.ID TỪ AUTH STATE CHANGE CHUYÊN CHO CHATBOT
    const [currentUserId, setCurrentUserId] = useState<string | null>(user?.id || null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(user?.email || null);

    useEffect(() => {
        // Lắng nghe auth để tài khoản mới tạo (hoặc login) nhận ngay ID Session
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user?.id || null);
            setCurrentUserEmail(session?.user?.email || null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const STORAGE_KEY = currentUserId ? `chat_history_${currentUserId}` : 'chat_history_guest';
    
    // --- STATE BỀN VỮNG ---
    const [messages, setMessages] = useState<any[]>(() => {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });

    const chatInitialized = useRef(false);
    const initializedSessionId = useRef<string | null>(null);
    const chatInstance = useRef<any>(null);

    // Lưu cache nhanh chóng
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, STORAGE_KEY]);

    useEffect(() => {
        if (currentUserId) {
            localStorage.removeItem('n8n-chat-session');
        }

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
            tooltipEl.innerText = '🤖 Hi bạn, tư vấn viên XinhBot đây!!';
            document.body.appendChild(tooltipEl);
        }

        // --- STYLE OVERRIDE STRICTURE (HEADER 60PX, CENTERED TITLE) ---
        const STYLE_ID = 'xinhbot-custom-style';
        if (!document.getElementById(STYLE_ID)) {
            const styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            styleEl.innerHTML = `
                :root {
                    --chat--header--background: linear-gradient(135deg, #FFB7C5, #FF69B4) !important;
                    --chat--header--color: #ffffff !important;
                    --chat--button--background--primary: #FF69B4 !important;
                    --chat--toggle--background: #FF69B4 !important;
                }
                .chat-window { overflow: hidden !important; border-radius: 20px !important; }
                
                /* EXACT HEADER RULES */
                .chat-header { 
                    height: 60px !important; 
                    min-height: 60px !important; 
                    padding: 0 15px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    position: relative !important;
                }
                .chat-header-title { 
                    font-size: 18px !important; 
                    font-weight: bold !important;
                    color: white !important;
                    text-transform: uppercase !important;
                    text-align: center !important;
                    margin: 0 auto !important;
                    flex: 1 !important;
                }
                .chat-header-subtitle { display: none !important; }
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

                .xinhbot-refresh-btn:hover {
                    opacity: 0.8;
                }
            `;
            document.head.appendChild(styleEl);
        }

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

        const syncToWidget = (msgs: any[]) => {
            if (chatInstance.current && typeof chatInstance.current.setMessages === 'function') {
                chatInstance.current.setMessages(msgs);
            }
        };

        const fetchHistoryFromSupabase = async (userId: string) => {
            if (!userId) return;
            try {
                const { data, error } = await supabase
                    .from('n8n_chat_histories')
                    .select('message')
                    .eq('session_id', userId)
                    .order('id', { ascending: true });
                if (error) throw error;
                if (data) {
                    const fresh = data.map(item => item.message);
                    setMessages(fresh); syncToWidget(fresh);
                }
            } catch (err) { console.error('Supabase Sync Error:', err); }
        };

        // Ràng buộc bảo vệ tuyệt đối: Logic fetch lịch sử khi chuyển tab
        const handleVisibilityChange = () => { 
            if (document.visibilityState === 'visible' && currentUserId) {
                fetchHistoryFromSupabase(currentUserId);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // LOGIN MODAL
        let redirectTimeout: any;
        const showLoginModal = () => {
            const MODAL_ID = 'xinhbot-login-modal';
            if (document.getElementById(MODAL_ID)) return;
            const overlay = document.createElement('div');
            overlay.id = MODAL_ID; overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:2000000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;';
            overlay.innerHTML = `
                <div style="background:white;padding:30px;border-radius:24px;text-align:center;max-width:340px;box-shadow:0 15px 40px rgba(0,0,0,0.15);border:3px solid #FFB7C5;transform:scale(0.8);transition:transform 0.3s;">
                    <div style="font-size:40px;margin-bottom:15px;">🌸</div>
                    <h3 style="margin-bottom:15px;font-size:18px;color:#333;">Bạn yêu ơi, vui lòng <b>Đăng nhập</b> để được XinhBot hỗ trợ chuyên sâu nhé!</h3>
                    <button id="xlogin-btn" style="width:100%;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg, #FFB7C5, #FF69B4);color:white;cursor:pointer;font-weight:700;">Đồng ý ngay 💖</button>
                    <p style="font-size:12px;color:#999;margin-top:15px;">Tự động chuyển hướng sau 2s...</p>
                </div>`;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => { overlay.style.opacity = '1'; (overlay.firstElementChild as HTMLElement).style.transform = 'scale(1)'; });
            const goToLogin = () => { clearTimeout(redirectTimeout); overlay.style.opacity = '0'; setTimeout(() => { if (overlay) overlay.remove(); navigate('/login'); }, 300); };
            overlay.querySelector('#xlogin-btn')?.addEventListener('click', goToLogin);
            redirectTimeout = setTimeout(goToLogin, 2500);
        };

        const handleInteractionCatch = (e: MouseEvent) => {
            if (!currentUserId) {
                const container = document.getElementById(CHAT_TARGET_ID);
                if (container && container.contains(e.target as Node)) { e.preventDefault(); e.stopPropagation(); showLoginModal(); }
            }
        };
        document.addEventListener('click', handleInteractionCatch, true);

        // INITIALIZE OR RE-INITIALIZE CHAT
        const initChat = () => {
            if (!(window as any).createN8nChat) return;
            
            const sid = currentUserId || 'guest-session';
            
            // 2. NẾU USER CẬP NHẬT TỪ NULL -> ID HOẶC ID MỚI TRONG SESSION NÀY
            if (chatInitialized.current && initializedSessionId.current !== sid) {
                // Hủy instance cũ bằng cách clear container
                const container = document.getElementById('xinhbot-container');
                if (container) container.innerHTML = '';
                chatInitialized.current = false;
            }

            if (!chatInitialized.current) {
                chatInstance.current = (window as any).createN8nChat({
                    webhookUrl: 'https://phamhuucuong231.app.n8n.cloud/webhook/004eb129-66fb-431c-9f64-2fa8df0954dd/chat',
                    target: '#xinhbot-container', 
                    mode: 'window', 
                    showWelcomeScreen: false, // 3. Tắt màn hình "Start a chat..."
                    initialMessages: ['Xin chào! Mình là XINHBOT 🌸', 'Mình có thể giúp gì cho bạn hôm nay?'],
                    metadata: { user_id: sid, email: currentUserEmail || 'guest@ndastore.vn' },
                    i18n: { 
                        en: { 
                            title: 'XINHBOT', 
                            subtitle: '', 
                            inputPlaceholder: 'Nhập tin nhắn...' 
                        } 
                    }
                });
                chatInitialized.current = true;
                initializedSessionId.current = sid;
                
                // Đồng bộ từ local cache mượt mà
                const cacheForSid = localStorage.getItem(`chat_history_${sid}`);
                if (cacheForSid) {
                    const parsed = JSON.parse(cacheForSid);
                    setMessages(parsed);
                    setTimeout(() => syncToWidget(parsed), 800);
                } else if (messages.length > 0) {
                    setTimeout(() => syncToWidget(messages), 800);
                }

                // Nếu là full_user thì sync DB
                if (currentUserId) {
                    fetchHistoryFromSupabase(currentUserId);
                }
            }
        };

        if ((window as any).createN8nChat) initChat();
        else window.addEventListener('n8n-chat-loaded', initChat);

        // --- SIMPLE CUSTOM MODAL LÀM MỚI ---
        const showClearConfirmModal = () => {
            const MODAL_ID = 'xinhbot-confirm-modal';
            if (document.getElementById(MODAL_ID)) return;
            const overlay = document.createElement('div');
            overlay.id = MODAL_ID; 
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:2000000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;';
            overlay.innerHTML = `
                <div style="background:white;padding:30px;border-radius:20px;text-align:center;width:320px;box-shadow:0 15px 40px rgba(0,0,0,0.2);border:2px solid #FFB7C5;transform:translateY(20px);transition:transform 0.3s;">
                    <div style="font-size:40px;margin-bottom:15px;">🔄</div>
                    <h3 style="margin-bottom:20px;font-size:18px;color:#333;font-weight:700;">Bạn muốn làm mới đoạn chat?</h3>
                    <div style="display:flex;gap:15px;justify-content:center;">
                        <button id="xbtn-no" style="flex:1;padding:12px;border-radius:12px;border:2px solid #FFB7C5;background:white;color:#FF69B4;cursor:pointer;font-weight:700;font-size:15px;">Hủy</button>
                        <button id="xbtn-yes" style="flex:1;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg, #FFB7C5, #FF69B4);color:white;cursor:pointer;font-weight:700;font-size:15px;">Đồng ý</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => { overlay.style.opacity = '1'; (overlay.firstElementChild as HTMLElement).style.transform = 'translateY(0)'; });
            
            const close = () => { overlay.style.opacity = '0'; (overlay.firstElementChild as HTMLElement).style.transform = 'translateY(20px)'; setTimeout(() => overlay.remove(), 300); };
            overlay.querySelector('#xbtn-no')?.addEventListener('click', close);
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
            
            overlay.querySelector('#xbtn-yes')?.addEventListener('click', async () => {
                if (currentUserId) {
                    await supabase.from('n8n_chat_histories').delete().eq('session_id', currentUserId);
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem('n8n-chat-session');
                    setMessages([]); 
                    window.location.reload();
                } else {
                    close();
                }
            });
        };

        // SCAN SHADOW DOM FOR HEADER ALIGNMENT
        let ttIv: any, sdIv: any, syncIv: any;
        const animateTt = () => { if (tooltipEl) { tooltipEl.style.opacity = '1'; tooltipEl.classList.add('shake-animation'); setTimeout(() => { if (tooltipEl) { tooltipEl.style.opacity = '0'; tooltipEl.classList.remove('shake-animation'); } }, 3000); } };
        ttIv = setInterval(animateTt, 15000); setTimeout(animateTt, 1000);

        let isChatOpen = false;
        const scanSD = (node: Node) => {
            if (!node) return;
            if ((node as Element).shadowRoot) scanSD((node as Element).shadowRoot as any as Node);
            if (node.nodeType === 1 && (node as Element).classList) {
                const el = node as HTMLElement;
                if (el.classList.contains('chat-window')) { 
                    const c = window.getComputedStyle(el); 
                    if (c.display !== 'none' && c.opacity !== '0') isChatOpen = true; 
                    
                    if (!el.querySelector('.xinhbot-resize-handle-tl')) {
                        const createHandle = (className: string, cursor: string, isTop: boolean, isLeft: boolean, css: string) => {
                            const handle = document.createElement('div');
                            handle.className = className;
                            handle.style.cssText = `position: absolute; ${css} cursor: ${cursor}; z-index: 9999999; background: transparent;`;
                            
                            handle.onmousedown = (e) => {
                                e.preventDefault(); e.stopPropagation();
                                const startX = e.clientX, startY = e.clientY;
                                const rect = el.getBoundingClientRect();
                                const startWidth = rect.width, startHeight = rect.height;
                                
                                const onMouseMove = (moveEvent: MouseEvent) => {
                                    if (isLeft) {
                                        const newWidth = Math.max(350, startWidth - (moveEvent.clientX - startX));
                                        el.style.setProperty('width', newWidth + 'px', 'important');
                                        el.style.setProperty('max-width', '90vw', 'important');
                                    }
                                    if (isTop) {
                                        const newHeight = Math.max(500, startHeight - (moveEvent.clientY - startY));
                                        el.style.setProperty('height', newHeight + 'px', 'important');
                                        el.style.setProperty('max-height', '90vh', 'important');
                                    }
                                };
                                const onMouseUp = () => {
                                    document.removeEventListener('mousemove', onMouseMove);
                                    document.removeEventListener('mouseup', onMouseUp);
                                };
                                document.addEventListener('mousemove', onMouseMove);
                                document.addEventListener('mouseup', onMouseUp);
                            };
                            return handle;
                        };

                        el.appendChild(createHandle('xinhbot-resize-handle-tl', 'nwse-resize', true, true, 'top: 0; left: 0; width: 15px; height: 15px; border-top-left-radius: 20px;'));
                        el.appendChild(createHandle('xinhbot-resize-handle-t', 'ns-resize', true, false, 'top: 0; left: 15px; right: 0; height: 10px;'));
                        el.appendChild(createHandle('xinhbot-resize-handle-l', 'ew-resize', false, true, 'top: 15px; left: 0; width: 10px; bottom: 0;'));
                    }
                }
                
                if (el.classList.contains('chat-header')) {
                    const titleEl = el.querySelector('.chat-header-title');
                    // Ghi đè chữ XINHBOT bất chấp DOM update
                    if (titleEl && titleEl.textContent !== 'XINHBOT') {
                        titleEl.textContent = 'XINHBOT';
                    }
                    const subEl = el.querySelector('.chat-header-subtitle') as HTMLElement;
                    if (subEl) subEl.style.display = 'none';

                    // Căn phải nút close mặc định
                    const closeBtn = el.querySelector('button[aria-label*="close"], button:last-child') as HTMLElement;
                    if (closeBtn && !closeBtn.classList.contains('xinhbot-refresh-btn')) {
                        closeBtn.style.position = 'absolute';
                        closeBtn.style.right = '15px';
                    }

                    // Tích hợp Icon Làm mới
                    if (!el.querySelector('.xinhbot-refresh-btn')) {
                        const btn = document.createElement('button'); btn.className = 'xinhbot-refresh-btn';
                        btn.style.cssText = 'position:absolute; right:55px; background:none; border:none; color:#C2185B; cursor:pointer; padding:8px; display:flex; align-items:center; justify-content:center; transition:transform 0.2s; outline:none; border-radius:50%;';
                        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`; 
                        btn.title = 'Làm mới đoạn chat';
                        btn.onmouseover = () => { btn.style.transform = 'rotate(30deg) scale(1.1)'; };
                        btn.onmouseout = () => { btn.style.transform = 'rotate(0deg) scale(1)'; };
                        btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); showClearConfirmModal(); };
                        el.appendChild(btn);
                    }
                }

                // Ẩn các đoạn chữ "Start a chat..." rác nếu còn sót
                const headings = el.querySelectorAll('h1, h2, h3, p');
                headings.forEach(h => {
                    if (h.textContent?.includes('Start a chat')) {
                        (h as HTMLElement).style.display = 'none';
                    }
                });
            }
            node.childNodes.forEach(scanSD);
        };
        sdIv = setInterval(() => { isChatOpen = false; scanSD(chatContainer || document.body); if (tooltipEl) tooltipEl.style.opacity = isChatOpen ? '0' : tooltipEl.style.opacity; }, 500);

        syncIv = setInterval(() => {
            if (chatInstance.current && typeof chatInstance.current.getMessages === 'function') {
                const cur = chatInstance.current.getMessages();
                if (cur && cur.length > messages.length) setMessages(cur);
            }
        }, 3000);

        return () => {
            window.removeEventListener('n8n-chat-loaded', initChat);
            document.removeEventListener('click', handleInteractionCatch, true);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(ttIv); clearInterval(sdIv); clearInterval(syncIv); clearTimeout(redirectTimeout);
        };
    }, [currentUserId, currentUserEmail, navigate, messages.length, STORAGE_KEY]);

    return null;
}

