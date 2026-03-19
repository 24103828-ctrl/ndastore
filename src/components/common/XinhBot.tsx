import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export function XinhBot() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const chatInitialized = useRef(false);
    const chatInstance = useRef<any>(null);

    useEffect(() => {
        // --- 1. DỌN DẸP CACHE KHI THAY ĐỔI USER ---
        if (user) {
            localStorage.removeItem('n8n-chat-session');
        }

        // --- 2. CƠ CHẾ DOM & STYLE ---
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

        const STYLE_ID = 'xinhbot-custom-style';
        if (!document.getElementById(STYLE_ID)) {
            const styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            styleEl.innerHTML = `
                :root {
                    --chat--header--background: linear-gradient(135deg, #FFB7C5, #FF69B4) !important;
                    --chat--header--color: #ffffff !important;
                    --chat--button--background--primary: #FF69B4 !important;
                    --chat--button--background--primary--hover: #ff85c2 !important;
                    --chat--button--border-radius: 20px !important;
                    --chat--message--user--background: #FF69B4 !important;
                    --chat--message--user--color: #ffffff !important;
                    --chat--message--bot--background: #FFF0F5 !important;
                    --chat--message--bot--color: #333333 !important;
                    --chat--message--bot--border: 1px solid #FFD1E3 !important;
                    --chat--message--border-radius: 20px !important;
                    --chat--toggle--background: #FF69B4 !important;
                    --chat--toggle--hover--background: #ff85c2 !important;
                    --chat--toggle--active--background: #ff85c2 !important;
                }
                .chat-header img, .chat-avatar { border-radius: 50% !important; object-fit: contain !important; }
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
                #xinhbot-tooltip::after {
                    content: ''; position: absolute; bottom: -8px; right: 25px;
                    border-width: 8px 8px 0; border-style: solid;
                    border-color: #FF69B4 transparent transparent transparent;
                }
                @keyframes tooltipShake {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-3deg); }
                    50% { transform: translateX(5px) rotate(3deg); }
                    75% { transform: translateX(-5px) rotate(-3deg); }
                    100% { transform: translateX(0); }
                }
                .shake-animation { animation: tooltipShake 0.5s ease-in-out infinite; }
            `;
            document.head.appendChild(styleEl);
        }

        // Tải Assets n8n-chat
        if (!document.getElementById('n8n-chat-css')) {
            const link = document.createElement('link'); link.id = 'n8n-chat-css';
            link.rel = 'stylesheet'; link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.13.1/dist/style.css';
            document.head.appendChild(link);
        }
        if (!document.getElementById('n8n-chat-script')) {
            const script = document.createElement('script'); script.id = 'n8n-chat-script';
            script.type = 'module';
            script.innerHTML = `
                import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.13.1/dist/chat.bundle.es.js';
                window.createN8nChat = createChat;
                window.dispatchEvent(new CustomEvent('n8n-chat-loaded'));
            `;
            document.head.appendChild(script);
        }

        // --- 3. FETCH & HYDRATE LOGIC ---
        const fetchChatHistory = async () => {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('n8n_chat_histories')
                    .select('message')
                    .eq('session_id', user.id)
                    .order('id', { ascending: true });

                if (error) throw error;
                if (data && data.length > 0) {
                    const messages = data.map(item => item.message);
                    
                    // Polling: Đợi widget thực sự sẵn sàng với phương thức setMessages
                    let retryCount = 0;
                    const injectInterval = setInterval(() => {
                        if (chatInstance.current && typeof chatInstance.current.setMessages === 'function') {
                            chatInstance.current.setMessages(messages);
                            clearInterval(injectInterval);
                        } else if (++retryCount > 20) { // Timeout sau 10s (500ms * 20)
                            clearInterval(injectInterval);
                            console.warn('XinhBot: Timeout waiting for setMessages');
                        }
                    }, 500);
                }
            } catch (err) {
                console.error('XinhBot Hydration Error:', err);
            }
        };

        // --- 4. MODAL LOGIN (MỜI ĐĂNG NHẬP) ---
        let redirectTimeout: any;
        const showLoginModal = () => {
            const MODAL_ID = 'xinhbot-login-modal';
            if (document.getElementById(MODAL_ID)) return;
            const overlay = document.createElement('div');
            overlay.id = MODAL_ID;
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:2000000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;';
            overlay.innerHTML = `
                <div style="background:white;padding:30px;border-radius:20px;text-align:center;max-width:340px;box-shadow:0 15px 40px rgba(0,0,0,0.15);border:3px solid #FFB7C5;transform:scale(0.8);transition:transform 0.3s;">
                    <div style="font-size:40px;margin-bottom:15px;">🌸</div>
                    <h3 style="margin-bottom:15px;font-size:18px;color:#333;line-height:1.5;">Bạn yêu ơi, vui lòng <b>Đăng nhập</b> để được XinhBot hỗ trợ tư vấn và nhận ưu đãi riêng nhé!</h3>
                    <p style="font-size:12px;color:#888;margin-bottom:20px;">Bạn sẽ được chuyển hướng sau 2 giây...</p>
                    <button id="xlogin-btn" style="width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg, #FFB7C5, #FF69B4);color:white;cursor:pointer;font-weight:700;font-size:16px;box-shadow:0 4px 10px rgba(255, 105, 180, 0.3);">Đồng ý ngay 💖</button>
                </div>
            `;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                (overlay.firstElementChild as HTMLElement).style.transform = 'scale(1)';
            });
            const goToLogin = () => {
                clearTimeout(redirectTimeout);
                overlay.style.opacity = '0';
                setTimeout(() => { if (overlay) overlay.remove(); navigate('/login'); }, 300);
            };
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

        // --- 5. INITIALIZATION ---
        const initChat = async () => {
            if ((window as any).createN8nChat && !chatInitialized.current) {
                const sessionId = user?.id || 'guest-session-placeholder';

                chatInstance.current = (window as any).createN8nChat({
                    webhookUrl: 'https://phamhuucuong231.app.n8n.cloud/webhook/004eb129-66fb-431c-9f64-2fa8df0954dd/chat',
                    target: '#xinhbot-container', mode: 'window', showWelcomeScreen: true,
                    initialMessages: ['Xin chào! Mình là XINHBOT 🌸', 'Mình có thể giúp gì cho bạn hôm nay?'],
                    i18n: {
                        en: {
                            title: 'XINHBOT', subtitle: 'Hỗ trợ trực tuyến', getStarted: 'Bắt đầu chat',
                            inputPlaceholder: 'Nhập tin nhắn...', error: 'Hệ thống đang quá tải hãy đợi chút nha! 😭',
                        }
                    },
                    metadata: {
                        user_id: sessionId, email: user?.email || 'guest@ndastore.vn',
                        fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Khách hàng'
                    }
                });
                chatInitialized.current = true;
                if (user?.id) fetchChatHistory();
            }
        };

        if ((window as any).createN8nChat) initChat();
        else window.addEventListener('n8n-chat-loaded', initChat);

        // --- 6. HỖ TRỢ LÀM MỚI (REFRESH) ---
        const showClearConfirmModal = () => {
            const MODAL_ID = 'xinhbot-confirm-modal';
            if (document.getElementById(MODAL_ID)) return;
            const overlay = document.createElement('div');
            overlay.id = MODAL_ID;
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;';
            overlay.innerHTML = `
                <div style="background:white;padding:24px;border-radius:16px;text-align:center;width:300px;box-shadow:0 10px 25px rgba(0,0,0,0.1);border:2px solid #FFB7C5;">
                    <h3 style="margin-bottom:20px;font-size:16px;color:#333;">Bạn muốn làm mới cuộc trò chuyện?</h3>
                    <div style="display:flex;gap:12px;justify-content:center;">
                        <button id="xbtn-no" style="padding:8px 20px;border-radius:10px;border:1px solid #ddd;background:white;cursor:pointer;font-weight:500;">Hủy</button>
                        <button id="xbtn-yes" style="padding:8px 20px;border-radius:10px;border:none;background:linear-gradient(135deg, #FFB7C5, #FF69B4);color:white;cursor:pointer;font-weight:600;">Đồng ý</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.style.opacity = '1');
            overlay.querySelector('#xbtn-no')?.addEventListener('click', () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 200); });
            overlay.querySelector('#xbtn-yes')?.addEventListener('click', async () => {
                try {
                    if (!user) return;
                    close();
                    await supabase.from('n8n_chat_histories').delete().eq('session_id', user.id);
                    localStorage.removeItem('n8n-chat-session');
                    window.location.reload();
                } catch (err) { console.error(err); }
            });
        };

        // --- 7. TOOLTIP & SHADOW DOM ---
        let tooltipInterval: any, shadowInterval: any;
        const animateTooltip = () => {
            if (tooltipEl) {
                tooltipEl.style.opacity = '1'; tooltipEl.classList.add('shake-animation');
                setTimeout(() => { if (tooltipEl) { tooltipEl.style.opacity = '0'; tooltipEl.classList.remove('shake-animation'); } }, 3000);
            }
        };
        tooltipInterval = setInterval(animateTooltip, 15000); setTimeout(animateTooltip, 1000);

        let isChatOpen = false;
        const processShadowDOM = (node: Node) => {
            if (!node) return;
            if ((node as Element).shadowRoot) processShadowDOM((node as Element).shadowRoot as any as Node);
            if (node.nodeType === 3 && node.nodeValue?.includes("Error: Failed to receive response")) {
                node.nodeValue = node.nodeValue.replace("Error: Failed to receive response", "Hệ thống đang quá tải hãy đợi chút nha! 😭");
            } 
            if (node.nodeType === 1 && (node as Element).classList) {
                const el = node as HTMLElement;
                if (el.classList.contains('chat-window')) {
                    const comp = window.getComputedStyle(el); if (comp.display !== 'none' && comp.opacity !== '0') isChatOpen = true;
                }
                if (el.classList.contains('chat-header') && !el.querySelector('.xinhbot-refresh-btn')) {
                    const btn = document.createElement('button'); btn.className = 'xinhbot-refresh-btn';
                    btn.style.cssText = 'background:none;border:none;color:white;cursor:pointer;padding:8px;margin-left:auto;display:flex;align-items:center;';
                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';
                    btn.onclick = (e) => { e.stopPropagation(); showClearConfirmModal(); };
                    el.appendChild(btn); el.style.justifyContent = 'space-between';
                }
            }
            node.childNodes.forEach(processShadowDOM);
        };
        shadowInterval = setInterval(() => {
            isChatOpen = false; processShadowDOM(chatContainer || document.body);
            if (tooltipEl) tooltipEl.style.opacity = isChatOpen ? '0' : tooltipEl.style.opacity;
        }, 500);

        // --- 8. CLEANUP ---
        return () => {
            window.removeEventListener('n8n-chat-loaded', initChat);
            document.removeEventListener('click', handleInteractionCatch, true);
            clearInterval(tooltipInterval); clearInterval(shadowInterval); clearTimeout(redirectTimeout);
            if (chatContainer) chatContainer.remove(); if (tooltipEl) tooltipEl.remove();
            const lm = document.getElementById('xinhbot-login-modal'); if (lm) lm.remove();
            const cm = document.getElementById('xinhbot-confirm-modal'); if (cm) cm.remove();
            chatInitialized.current = false; chatInstance.current = null;
        };
    }, [user, navigate]);

    return null;
}
