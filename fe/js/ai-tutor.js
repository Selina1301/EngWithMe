/**
 * EngWithMe AI Tutor Client Widget (Cloudflare Workers AI Edge)
 * Version: 2.0.1-vercel-force-build
 * High-performance, isolated, zero side-effects module.
 */
(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__engWithMeAITutorLoaded) return;
  window.__engWithMeAITutorLoaded = true;

  const STORAGE_KEY = 'engwithme_ai_session_chat';
  const MAX_HISTORY = 15; // Giới hạn 15 câu thoại gần nhất để bảo vệ dung lượng

  // State local cách ly hoàn toàn
  let chatHistory = [];
  let isRequesting = false;

  // Dynamically load CSS if not already present
  function ensureCSSLoaded() {
    if (document.querySelector('link[href*="ai-tutor.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/components/ai-tutor.css';
    document.head.appendChild(link);
  }

  // Load chat history from sessionStorage
  function loadSessionHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) chatHistory = JSON.parse(raw);
    } catch (e) {
      chatHistory = [];
    }
  }

  // Save chat history to sessionStorage
  function saveSessionHistory() {
    try {
      if (chatHistory.length > MAX_HISTORY) {
        chatHistory = chatHistory.slice(-MAX_HISTORY);
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Init DOM UI Widget
  function initWidget() {
    ensureCSSLoaded();
    loadSessionHistory();

    if (document.getElementById('engwithme-ai-tutor')) return;

    const container = document.createElement('div');
    container.id = 'engwithme-ai-tutor';
    container.innerHTML = `
      <button class="ai-toggle-btn" id="ai-toggle-trigger" type="button">
        <span class="badge-pulse"></span>
        <span>🤖 Trợ Lý AI</span>
      </button>
      <div class="ai-chat-window" id="ai-chat-box">
        <div class="ai-header">
          <div class="ai-header-info">
            <div class="ai-avatar">🎓</div>
            <div class="ai-title-wrap">
              <h4>EngWithMe AI Tutor</h4>
              <p>Hỗ trợ từ vựng, ngữ pháp & TOEIC</p>
            </div>
          </div>
          <button class="ai-close-btn" id="ai-close-trigger" type="button" title="Đóng">&times;</button>
        </div>
        <div class="ai-messages-body" id="ai-msg-body">
          <div class="ai-msg assistant">
            Xin chào! Tôi là Trợ Lý AI EngWithMe (Qwen2.5-3B). Bạn có thắc mắc gì về ngữ pháp, từ vựng hay bài đọc TOEIC hôm nay không?
          </div>
        </div>
        <div class="ai-input-footer">
          <input type="text" class="ai-input-field" id="ai-user-input" placeholder="Nhập câu hỏi tiếng Anh..." autocomplete="off" />
          <button class="ai-send-btn" id="ai-send-trigger" type="button" title="Gửi">➤</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const toggleBtn = document.getElementById('ai-toggle-trigger');
    const closeBtn = document.getElementById('ai-close-trigger');
    const chatBox = document.getElementById('ai-chat-box');
    const sendBtn = document.getElementById('ai-send-trigger');
    const inputField = document.getElementById('ai-user-input');
    const msgBody = document.getElementById('ai-msg-body');

    // Restore previous session messages to UI
    if (chatHistory.length > 0) {
      chatHistory.forEach(item => {
        appendMessageUI(item.role, item.content, false);
      });
    }

    // Toggle Chat Window
    toggleBtn?.addEventListener('click', () => {
      chatBox?.classList.toggle('active');
      if (chatBox?.classList.contains('active')) {
        inputField?.focus();
        scrollToBottom();
      }
    });

    closeBtn?.addEventListener('click', () => {
      chatBox?.classList.remove('active');
    });

    // Send handlers
    sendBtn?.addEventListener('click', handleSend);
    inputField?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    async function handleSend() {
      if (isRequesting) return;
      const text = inputField.value.trim();
      if (!text) return;

      inputField.value = '';
      appendMessageUI('user', text, true);
      scrollToBottom();

      isRequesting = true;
      showTypingIndicator();

      try {
        const endpoint = typeof window.resolveApiUrl === 'function'
          ? window.resolveApiUrl('ai/chat')
          : 'https://api.tungf.io.vn/v1/ai/chat';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: chatHistory.map(h => ({ role: h.role, content: h.content }))
          })
        });

        removeTypingIndicator();

        if (res.ok) {
          const data = await res.json();
          const reply = data?.reply || 'Tôi đã tiếp nhận thông tin, bạn có cần giải thích chi tiết hơn không?';
          appendMessageUI('assistant', reply, true);
        } else {
          appendMessageUI('assistant', 'Hệ thống AI đang phản hồi chậm. Bạn thử gửi lại câu hỏi nhé!', false);
        }
      } catch (err) {
        removeTypingIndicator();
        appendMessageUI('assistant', 'Trợ lý AI EngWithMe đang kết nối máy chủ local. Bài học TOEIC của bạn vẫn hoạt động bình thường!', false);
      } finally {
        isRequesting = false;
        scrollToBottom();
      }
    }

    function appendMessageUI(role, content, saveToState = true) {
      const div = document.createElement('div');
      div.className = `ai-msg ${role}`;
      div.textContent = content;
      msgBody?.appendChild(div);

      if (saveToState) {
        chatHistory.push({ role, content });
        saveSessionHistory();
      }
    }

    function showTypingIndicator() {
      removeTypingIndicator();
      const indicator = document.createElement('div');
      indicator.className = 'ai-msg assistant typing';
      indicator.id = 'ai-typing-indicator';
      indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      `;
      msgBody?.appendChild(indicator);
      scrollToBottom();
    }

    function removeTypingIndicator() {
      document.getElementById('ai-typing-indicator')?.remove();
    }

    function scrollToBottom() {
      if (msgBody) {
        msgBody.scrollTop = msgBody.scrollHeight;
      }
    }
  }

  // Safe Load Initializer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
