import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export function XinhBot() {
    const { user } = useAuth(); // Lấy thông tin user hiện tại từ hệ thống đăng nhập
    const chatInitialized = useRef(false);

    useEffect(() => {
        // LUÔN LUÔN CHẠY: KHÔNG ĐƯỢC return !user Ở ĐÂY ĐỂ TRÁNH MẤT NÚT CHAT
        
        // Container DOM cho chatbot
        const CHAT_TARGET_ID = 'xinhbot-container';
        let chatContainer = document.getElementById(CHAT_TARGET_ID);

        // Tạo container nếu chưa có
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
                /* GHI ĐÈ CSS CỦA N8N WIDGET THEO YÊU CẦU */
                :root {
                    /* Header: tông màu hồng hoa anh đào / pastel */
                    --chat--header--background: linear-gradient(135deg, #FFB7C5, #FF69B4) !important;
                    --chat--header--color: #ffffff !important;
                    
                    /* Nút bấm Bắt đầu chat màu hồng, bo góc 20px */
                    --chat--button--background--primary: #FF69B4 !important;
                    --chat--button--background--primary--hover: #ff85c2 !important;
                    --chat--button--border-radius: 20px !important;

                    /* Màu sắc bóng thoại User: Hồng đậm chữ trắng */
                    --chat--message--user--background: #FF69B4 !important;
                    --chat--message--user--color: #ffffff !important;

                    /* Màu sắc bóng thoại Bot: Hồng rất nhạt chữ xám đậm */
                    --chat--message--bot--background: #FFF0F5 !important;
                    --chat--message--bot--color: #333333 !important;
                    --chat--message--bot--border: 1px solid #FFD1E3 !important;
                    
                    /* Bo góc mềm mại cho bóng thoại chung */
                    --chat--message--border-radius: 20px !important;

                    /* Nút bong bóng chat (Toggle Button) */
                    --chat--toggle--background: #FF69B4 !important;
                    --chat--toggle--hover--background: #ff85c2 !important;
                    --chat--toggle--active--background: #ff85c2 !important;
                }
                .chat-header img, .chat-avatar {
                    border-radius: 50% !important;
                    object-fit: contain !important;
                }

                /* XÓA HOÀN TOÀN CHỮ "Powered by n8n" TẠI FOOTER */
                .chat-powered-by {
                    display: none !important;
                }

                /* YÊU CẦU MỚI: BẢNG SẢN PHẨM SHOPEE CARD STYLE */
                .chat-message-markdown table {
                    display: flex !important;
                    flex-direction: column !important;
                    width: 100% !important;
                    border: none !important;
                    gap: 12px !important;
                    background: transparent !important;
                }
                .chat-message-markdown thead {
                    display: none !important;
                }
                .chat-message-markdown tbody {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 10px !important;
                    width: 100% !important;
                }
                .chat-message-markdown tr {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    background: #ffffff !important;
                    border-radius: 12px !important;
                    padding: 10px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
                    border: 1px solid #f0f0f0 !important;
                    margin: 0 !important;
                    transition: transform 0.2s ease;
                }
                .chat-message-markdown tr:hover {
                    transform: translateY(-2px);
                }
                .chat-message-markdown td {
                    border: none !important;
                    padding: 0 !important;
                }
                .chat-message-markdown td:first-child {
                    width: 85px !important;
                    max-width: 85px !important;
                    flex-shrink: 0 !important;
                    margin-right: 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .chat-message-markdown td:first-child img {
                    width: 100% !important;
                    height: 85px !important;
                    border-radius: 8px !important;
                    object-fit: cover !important;
                    display: block !important;
                }
                .chat-message-markdown td:nth-child(2) {
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    font-size: 13px !important;
                    color: #333333 !important;
                    line-height: 1.4 !important;
                    word-break: break-word !important;
                }

                /* YÊU CẦU 3 Kế thừa: Tooltip bong bóng thoát CSS */
                #xinhbot-tooltip {
                    position: fixed;
                    bottom: 90px; /* Nằm ngay trên nút chat 60px */
                    right: 20px;
                    background-color: #FF69B4;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 10px rgba(255, 105, 180, 0.4);
                    z-index: 999999;
                    pointer-events: none; /* Không cản trở click nút đằng sau */
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out; /* Hiệu ứng mờ */
                }
                
                /* Đuôi bong bóng chỉ xuống nút chat */
                #xinhbot-tooltip::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    right: 25px; /* Để đuôi trỏ đúng vào nút chat hình tròn bên dưới */
                    border-width: 8px 8px 0;
                    border-style: solid;
                    border-color: #FF69B4 transparent transparent transparent;
                }

                /* Hiệu ứng rung (shake) */
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

        // Tải style CSS của n8n chat widget
        const CSS_ID = 'n8n-chat-css';
        if (!document.getElementById(CSS_ID)) {
            const link = document.createElement('link');
            link.id = CSS_ID;
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.13.1/dist/style.css';
            document.head.appendChild(link);
        }

        // Tải scripts JS của n8n chat
        const SCRIPT_ID = 'n8n-chat-script';
        if (!document.getElementById(SCRIPT_ID)) {
            const script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.type = 'module';
            script.innerHTML = `
                import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.13.1/dist/chat.bundle.es.js';
                window.createN8nChat = createChat;
                window.dispatchEvent(new CustomEvent('n8n-chat-loaded'));
            `;
            document.head.appendChild(script);
        }

        // Hàm Config & Khởi tạo Chatbot n8n
        const initChat = () => {
            if ((window as any).createN8nChat && !chatInitialized.current) {
                // Sử dụng guest-id nếu chưa đăng nhập để luôn hiện chatbot
                let sessionId = user?.id;
                if (!sessionId) {
                    sessionId = localStorage.getItem('xinhbot-guest-id') || '';
                    if (!sessionId) {
                        sessionId = 'guest-' + Math.random().toString(36).substring(2, 9);
                        localStorage.setItem('xinhbot-guest-id', sessionId);
                    }
                }

                (window as any).createN8nChat({
                    webhookUrl: 'https://phamhuucuong231.app.n8n.cloud/webhook/004eb129-66fb-431c-9f64-2fa8df0954dd/chat',
                    target: '#xinhbot-container',
                    mode: 'window',
                    showWelcomeScreen: true,
                    initialMessages: [
                        'Xin chào! Mình là XINHBOT 🌸',
                        'Mình có thể giúp gì cho bạn hôm nay?'
                    ],
                    // YÊU CẦU 1: Xử lý lỗi n8n bằng i18n
                    i18n: {
                        en: {
                            title: 'XINHBOT',
                            subtitle: 'Hỗ trợ trực tuyến',
                            getStarted: 'Bắt đầu chat',
                            inputPlaceholder: 'Nhập tin nhắn...',
                            // Đổi thông báo lỗi thành câu vui vẻ
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
            }
        };

        // Kích hoạt
        if ((window as any).createN8nChat) {
            initChat();
        } else {
            window.addEventListener('n8n-chat-loaded', initChat);
        }

        // --- LOGIC XÓA LỊCH SỬ ---
        const showClearConfirmModal = () => {
            const MODAL_ID = 'xinhbot-confirm-modal';
            if (document.getElementById(MODAL_ID)) return;

            const overlay = document.createElement('div');
            overlay.id = MODAL_ID;
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;';
            
            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;padding:24px;border-radius:16px;text-align:center;width:300px;box-shadow:0 10px 25px rgba(0,0,0,0.1);border:2px solid #FFB7C5;';
            modal.innerHTML = `
                <h3 style="margin-bottom:20px;font-size:16px;color:#333;">Bạn muốn làm mới cuộc trò chuyện?</h3>
                <div style="display:flex;gap:12px;justify-content:center;">
                    <button id="xbtn-no" style="padding:8px 20px;border-radius:10px;border:1px solid #ddd;background:white;cursor:pointer;font-weight:500;">Hủy</button>
                    <button id="xbtn-yes" style="padding:8px 20px;border-radius:10px;border:none;background:linear-gradient(135deg, #FFB7C5, #FF69B4);color:white;cursor:pointer;font-weight:600;">Đồng ý</button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            requestAnimationFrame(() => overlay.style.opacity = '1');

            const close = () => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 200);
            };

            overlay.querySelector('#xbtn-no')?.addEventListener('click', close);
            overlay.querySelector('#xbtn-yes')?.addEventListener('click', async () => {
                try {
                    close();
                    const sessionId = user?.id || localStorage.getItem('xinhbot-guest-id');
                    if (!sessionId) return;

                    // 1. Xóa trên Supabase
                    const { error } = await supabase
                        .from('n8n_chat_histories')
                        .delete()
                        .eq('session_id', sessionId);
                    
                    if (error) throw error;

                    // 2. Xóa trên UI (Reload là cách sạch nhất để reset n8n widget)
                    localStorage.removeItem('n8n-chat-session');
                    window.location.reload();
                } catch (err) {
                    console.error('Lỗi khi xóa lịch sử:', err);
                    alert('Có lỗi xảy ra khi xóa lịch sử. Vui lòng thử lại!');
                }
            });
        };

        // --- YÊU CẦU 3: LOGIC ANIMATION TOOLTIP ---
        let tooltipInterval: any;

        const animateTooltip = () => {
            if (tooltipEl) {
                // Bước 1: Hiện tooltip lên và bắt đầu rung
                tooltipEl.style.opacity = '1';
                tooltipEl.classList.add('shake-animation');
                
                // Bước 2: Sau 3 giây, mờ đi và dừng rung
                setTimeout(() => {
                    if (tooltipEl) {
                        tooltipEl.style.opacity = '0';
                        tooltipEl.classList.remove('shake-animation');
                    }
                }, 3000);
            }
        };

        // Bật ngay tooltip lần đầu tiên sau khi load trang (delay 1s)
        setTimeout(animateTooltip, 1000);

        // Lặp lại chu kỳ cứ mỗi 15 giây
        tooltipInterval = setInterval(animateTooltip, 15000);

        // --- YÊU CẦU MỚI: HACK SHADOW DOM ĐỂ XÓA HARDCODE LỖI NHẬN TIN NHẮN ---
        // Sử dụng đệ quy để tìm Text Node ở mọi ngóc ngách, bao gồm cả các phần tử bị bọc bởi shadowRoot.
        const EXPECTED_ERROR_TEXT = "Error: Failed to receive response";
        const CUSTOM_ERROR_TEXT = "Hệ thống đang quá tải hãy đợi chút nha! 😭";

        let isChatWindowOpen = false;

        const processShadowDOM = (node: Node) => {
            if (!node) return;
            
            // 1. Phá Shadow DOM để chọc vào trong bằng đệ quy
            if ((node as Element).shadowRoot) {
                processShadowDOM((node as Element).shadowRoot as any as Node);
            }

            // 2. Xóa lỗi hardcode
            if (node.nodeType === 3) { // 3 là Node.TEXT_NODE
                if (node.nodeValue && node.nodeValue.includes(EXPECTED_ERROR_TEXT)) {
                    node.nodeValue = node.nodeValue.replace(EXPECTED_ERROR_TEXT, CUSTOM_ERROR_TEXT);
                }
            } 
            
            // 3. Theo dõi trạng thái bật tắt của Khung Chat window
            if (node.nodeType === 1 && (node as Element).classList) {
                const el = node as HTMLElement;
                if (el.classList.contains('chat-window')) {
                    const computedStyle = window.getComputedStyle(el);
                    if (computedStyle.display !== 'none' && computedStyle.opacity !== '0') {
                        isChatWindowOpen = true;
                    }
                }

                // --- INJECT NÚT LÀM MỚI VÀO HEADER ---
                if (el.classList.contains('chat-header')) {
                    if (!el.querySelector('.xinhbot-refresh-btn')) {
                        const refreshBtn = document.createElement('button');
                        refreshBtn.className = 'xinhbot-refresh-btn';
                        refreshBtn.title = 'Làm mới cuộc trò chuyện';
                        refreshBtn.style.cssText = 'background:none;border:none;color:white;cursor:pointer;padding:8px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;opacity:0.9;margin-left: auto;';
                        refreshBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';
                        refreshBtn.onmouseover = () => refreshBtn.style.transform = 'scale(1.2)';
                        refreshBtn.onmouseout = () => refreshBtn.style.transform = 'scale(1)';
                        refreshBtn.onclick = (e) => {
                            e.stopPropagation();
                            showClearConfirmModal();
                        };
                        el.appendChild(refreshBtn);
                        el.style.justifyContent = 'space-between';
                    }
                }
            }

            // 4. Quét đệ quy con
            const children = node.childNodes;
            for (let i = 0; i < children.length; i++) {
                processShadowDOM(children[i]);
            }
        };

        const shadowDomInterval = setInterval(() => {
            isChatWindowOpen = false;
            const chatWrapper = document.getElementById(CHAT_TARGET_ID) || document.body;
            processShadowDOM(chatWrapper);

            // Ẩn/Hiện Tooltip logic
            if (tooltipEl) {
                if (isChatWindowOpen) {
                    // Chat đang mở -> Tắt tooltip hoàn toàn
                    tooltipEl.style.opacity = '0';
                    tooltipEl.style.pointerEvents = 'none';
                } else {
                    // Chat đóng -> Trả lại chức năng (opacity mờ hiện do interval gốc kiểm soát)
                    tooltipEl.style.pointerEvents = 'auto';
                }
            }
        }, 400);

        // Hủy Chatbot và Tooltip nếu người dùng đăng xuất (Unmount component)
        return () => {
            window.removeEventListener('n8n-chat-loaded', initChat);
            clearInterval(tooltipInterval); // Dọn dẹp bộ đếm rung
            clearInterval(shadowDomInterval); // Dọn dẹp bộ đếm quét lỗi
            if (chatContainer) chatContainer.remove(); 
            if (tooltipEl) tooltipEl.remove(); // Gỡ tooltip khỏi DOM
        };
    }, [user?.id]); // Re-run if user ID changes, but don't return null if missing

    return null;
}
