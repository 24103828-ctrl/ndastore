import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export function XinhBot() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const chatInitialized = useRef(false);
    const chatInstance = useRef<any>(null); // Lưu trữ instance của chat widget

    useEffect(() => {
        // Container DOM cho chatbot
        const CHAT_TARGET_ID = 'xinhbot-container';
        let chatContainer = document.getElementById(CHAT_TARGET_ID);

        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.id = CHAT_TARGET_ID;
            document.body.appendChild(chatContainer);
        }

        // Tạo Tooltip gọi khách hàng
        const TOOLTIP_ID = 'xinhbot-tooltip';
        let tooltipEl = document.getElementById(TOOLTIP_ID);

        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = TOOLTIP_ID;
            tooltipEl.innerText = '🤖 Hi bạn, cần hỗ trợ thì tới đây nha!!';
            document.body.appendChild(tooltipEl);
        }

        // Tạo style override
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
                .chat-header img, .chat-avatar {
                    border-radius: 50% !important;
                    object-fit: contain !important;
                }
                .chat-powered-by {
                    display: none !important;
                }
                #xinhbot-tooltip {
                    position: fixed;
                    bottom: 90px;
                    right: 20px;
                    background-color: #FF69B4;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 10px rgba(255, 105, 180, 0.4);
                    z-index: 999999;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                }
                #xinhbot-tooltip::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    right: 25px;
                    border-width: 8px 8px 0;
                    border-style: solid;
                    border-color: #FF69B4 transparent transparent transparent;
                }
                @keyframes tooltipShake {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-3deg); }
                    50% { transform: translateX(5px) rotate(3deg); }
                    75% { transform: translateX(-5px) rotate(-3deg); }
                    100% { transform: translateX(0); }
                }
                .shake-animation {
                    animation: tooltipShake 0.5s ease-in-out infinite;
                }
            `;
            document.head.appendChild(styleEl);
        }

        if (!document.getElementById('n8n-chat-css')) {
            const link = document.createElement('link');
            link.id = 'n8n-chat-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.13.1/dist/style.css';
            document.head.appendChild(link);
        }

        if (!document.getElementById('n8n-chat-script')) {
            const script = document.createElement('script');
            script.id = 'n8n-chat-script';
            script.type = 'module';
            script.innerHTML = `
                import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.13.1/dist/chat.bundle.es.js';
                window.createN8nChat = createChat;
                window.dispatchEvent(new CustomEvent('n8n-chat-loaded'));
            `;
            document.head.appendChild(script);
        }

        // --- FETCH LỊCH SỬ TỪ SUPABASE (MỚI) ---
        const fetchHistory = async () => {
            if (!user || !chatInstance.current) return;
            
            try {
                const { data, error } = await supabase
                    .from('n8n_chat_histories')
                    .select('message')
                    .eq('session_id', user.id)
                    .order('id', { ascending: true });

                if (error) {
                    console.error('Lỗi khi tải lịch sử chat:', error.message);
                    return;
                }

                if (data && data.length > 0) {
                    const messages = data.map(d => d.message);
                    // Sử dụng setMessages của widget để hiển thị lịch sử
                    if (typeof chatInstance.current.setMessages === 'function') {
                        chatInstance.current.setMessages(messages);
                    }
                }
            } catch (err) {
                console.error('Lỗi ngoại lệ khi tải lịch sử chat:', err);
            }
        };

        // --- MODAL THÔNG BÁO LOGIN (MỜI ĐĂNG NHẬP) ---
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
                setTimeout(() => {
                    overlay.remove();
                    navigate('/login');
                }, 300);
            };

            overlay.querySelector('#xlogin-btn')?.addEventListener('click', goToLogin);
            redirectTimeout = setTimeout(goToLogin, 2500);
        };

        // --- HIJACK CLICK CHO KHÁCH VÃNG LAI ---
        const handleInteractionCatch = (e: MouseEvent) => {
            if (!user) {
                const container = document.getElementById(CHAT_TARGET_ID);
                if (container && container.contains(e.target as Node)) {
                    e.preventDefault();
                    e.stopPropagation();
                    showLoginModal();
                }
            }
        };
        document.addEventListener('click', handleInteractionCatch, true);

        const initChat = async () => {
            if ((window as any).createN8nChat && !chatInitialized.current) {
                const sessionId = user?.id || 'guest-session-placeholder';

                chatInstance.current = (window as any).createN8nChat({
                    webhookUrl: 'https://phamhuucuong231.app.n8n.cloud/webhook/004eb129-66fb-431c-9f64-2fa8df0954dd/chat',
                    target: '#xinhbot-container',
                    mode: 'window',
                    showWelcomeScreen: true,
                    initialMessages: [
                        'Xin chào! Mình là XINHBOT 🌸',
                        'Mình có thể giúp gì cho bạn hôm nay?'
                    ],
                    i18n: {
                        en: {
                            title: 'XINHBOT',
                            subtitle: 'Hỗ trợ trực tuyến',
                            getStarted: 'Bắt đầu chat',
                            inputPlaceholder: 'Nhập tin nhắn...',
                            error: 'Hệ thống đang quá tải hãy đợi chút nha! 😭',
                            serverError: 'Hệ thống đang quá tải hãy đợi chút nha! 😭',
                            networkError: 'Hệ thống đang quá tải hãy đợi chút nha! 😭',
                            errorMessages: {
                                default: 'Hệ thống đang quá tải hãy đợi chút nha! 😭',
                                serverError: 'Hệ thống đang quá tải hãy đợi chút nha! 😭',
                                networkError: 'Hệ thống đang quá tải hãy đợi chút nha! 😭'
                            }
                        }
                    },
                    metadata: {
                        user_id: sessionId, 
                        email: user?.email || 'guest@ndastore.vn',
                        fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Khách hàng'
                    }
                });
                chatInitialized.current = true;
                
                // Sau khi init, tải lịch sử ngay
                if (user) {
                    await fetchHistory();
                }
            }
        };

        if ((window as any).createN8nChat) {
            initChat();
        } else {
            window.addEventListener('n8n-chat-loaded', initChat);
        }

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
            overlay.querySelector('#xbtn-no')?.addEventListener('click', () => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 200);
            });
            overlay.querySelector('#xbtn-yes')?.addEventListener('click', async () => {
                try {
                    if (!user) return;
                    await supabase.from('n8n_chat_histories').delete().eq('session_id', user.id);
                    localStorage.removeItem('n8n-chat-session');
                    window.location.reload();
                } catch (err) {
                    console.error('Lỗi khi xóa lịch sử:', err);
                }
            });
        };

        let tooltipInterval: any;
        const animateTooltip = () => {
            if (tooltipEl) {
                tooltipEl.style.opacity = '1';
                tooltipEl.classList.add('shake-animation');
                setTimeout(() => {
                    if (tooltipEl) {
                        tooltipEl.style.opacity = '0';
                        tooltipEl.classList.remove('shake-animation');
                    }
                }, 3000);
            }
        };
        setTimeout(animateTooltip, 1000);
        tooltipInterval = setInterval(animateTooltip, 15000);

        let isChatWindowOpen = false;
        const processShadowDOM = (node: Node) => {
            if (!node) return;
            if ((node as Element).shadowRoot) {
                processShadowDOM((node as Element).shadowRoot as any as Node);
            }
            if (node.nodeType === 3) {
                if (node.nodeValue && node.nodeValue.includes("Error: Failed to receive response")) {
                    node.nodeValue = node.nodeValue.replace("Error: Failed to receive response", "Hệ thống đang quá tải hãy đợi chút nha! 😭");
                }
            } 
            if (node.nodeType === 1 && (node as Element).classList) {
                const el = node as HTMLElement;
                if (el.classList.contains('chat-window')) {
                    const computedStyle = window.getComputedStyle(el);
                    if (computedStyle.display !== 'none' && computedStyle.opacity !== '0') isChatWindowOpen = true;
                }
                if (el.classList.contains('chat-header') && !el.querySelector('.xinhbot-refresh-btn')) {
                    const refreshBtn = document.createElement('button');
                    refreshBtn.className = 'xinhbot-refresh-btn';
                    refreshBtn.title = 'Làm mới cuộc trò chuyện';
                    refreshBtn.style.cssText = 'background:none;border:none;color:white;cursor:pointer;padding:8px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;opacity:0.9;margin-left: auto;';
                    refreshBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';
                    refreshBtn.onclick = (e) => { e.stopPropagation(); showClearConfirmModal(); };
                    el.appendChild(refreshBtn);
                    el.style.justifyContent = 'space-between';
                }
            }
            const children = node.childNodes;
            for (let i = 0; i < children.length; i++) processShadowDOM(children[i]);
        };

        const shadowDomInterval = setInterval(() => {
            isChatWindowOpen = false;
            const chatWrapper = document.getElementById(CHAT_TARGET_ID) || document.body;
            processShadowDOM(chatWrapper);
            if (tooltipEl) {
                if (isChatWindowOpen) {
                    tooltipEl.style.opacity = '0';
                    tooltipEl.style.pointerEvents = 'none';
                } else {
                    tooltipEl.style.pointerEvents = 'auto';
                }
            }
        }, 400);

        return () => {
            window.removeEventListener('n8n-chat-loaded', initChat);
            document.removeEventListener('click', handleInteractionCatch, true);
            clearInterval(tooltipInterval);
            clearInterval(shadowDomInterval);
            clearTimeout(redirectTimeout);
            if (chatContainer) chatContainer.remove(); 
            if (tooltipEl) tooltipEl.remove();
            const loginModal = document.getElementById('xinhbot-login-modal');
            if (loginModal) loginModal.remove();
            const confirmModal = document.getElementById('xinhbot-confirm-modal');
            if (confirmModal) confirmModal.remove();
            chatInitialized.current = false;
            chatInstance.current = null;
        };
    }, [user, navigate]);

    return null;
}
