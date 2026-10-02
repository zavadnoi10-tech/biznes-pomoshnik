class BusinessChat {
  constructor() {
    this.messages = [];
    this.systemPrompt = '';
    this.isLoading = false;

    this.els = {
      messages: document.getElementById('chatMessages'),
      input:    document.getElementById('chatInput'),
      sendBtn:  document.getElementById('sendBtn'),
      clearBtn: document.getElementById('clearChat'),
    };

    this.init();
  }

  async init() {
    await this.loadContext();
    this.bindEvents();
  }

  async loadContext() {
    try {
      const res = await fetch(CONFIG.CONTEXT_FILE);
      if (!res.ok) throw new Error('context not found');
      const md = await res.text();
      this.systemPrompt = md;
    } catch {
      this.systemPrompt = `Ты — консультант по малому бизнесу в России. Отвечай на русском языке,
структурированно, с конкретными цифрами и ссылками на законы. Помогай предпринимателям
с регистрацией, налогами, кадрами, финансами и развитием бизнеса.`;
    }

    if (CONFIG.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      this.showApiNotice();
    }
  }

  showApiNotice() {
    const notice = document.createElement('div');
    notice.className = 'api-notice';
    notice.innerHTML = `⚠️ <strong>Укажите API-ключ:</strong> откройте файл <code>js/config.js</code>
и замените <code>YOUR_GROQ_API_KEY_HERE</code> на ваш ключ с
<a href="https://console.groq.com" target="_blank" rel="noopener">console.groq.com</a>.
Бесплатный ключ выдаётся мгновенно.`;
    this.els.messages.parentNode.insertBefore(notice, this.els.messages);
  }

  bindEvents() {
    this.els.sendBtn.addEventListener('click', () => this.handleSend());

    this.els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.els.input.addEventListener('input', () => this.autoResize());

    this.els.clearBtn.addEventListener('click', () => this.clearChat());

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-btn')) {
        const prompt = e.target.dataset.prompt;
        if (prompt) {
          this.els.input.value = prompt;
          this.autoResize();
          this.handleSend();
        }
      }
    });
  }

  autoResize() {
    const el = this.els.input;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  handleSend() {
    const text = this.els.input.value.trim();
    if (!text || this.isLoading) return;

    this.addUserMessage(text);
    this.els.input.value = '';
    this.els.input.style.height = 'auto';
    this.sendToGroq(text);
  }

  addUserMessage(text) {
    this.messages.push({ role: 'user', content: text });
    this.renderMessage('user', text);
  }

  renderMessage(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `message message--${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message__avatar';
    avatar.textContent = role === 'user' ? 'Вы' : 'AI';

    const body = document.createElement('div');
    body.className = 'message__body';
    body.innerHTML = this.formatText(text);

    wrap.appendChild(avatar);
    wrap.appendChild(body);
    this.els.messages.appendChild(wrap);
    this.scrollToBottom();
    return wrap;
  }

  formatText(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/### (.+)/g, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\* (.+)/gm, '<li>$1</li>')
      .replace(/^- (.+)/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)/gm, '<li>$2</li>')
      .replace(/(<li>.*<\/li>)/gs, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(?!<)(.+)/, '<p>$1</p>');
  }

  showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'typing-indicator';
    wrap.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message__avatar';
    avatar.textContent = 'AI';

    const body = document.createElement('div');
    body.className = 'message__body';
    body.innerHTML = `<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>`;

    wrap.appendChild(avatar);
    wrap.appendChild(body);
    this.els.messages.appendChild(wrap);
    this.scrollToBottom();
  }

  hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  async sendToGroq(userText) {
    this.isLoading = true;
    this.els.sendBtn.disabled = true;
    this.showTyping();

    const payload = {
      model: CONFIG.MODEL,
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE,
      messages: [
        { role: 'system', content: this.systemPrompt },
        ...this.messages,
      ],
    };

    try {
      const res = await fetch(CONFIG.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'HTTP-Referer': 'https://zavadnoi10-tech.github.io/biznes-pomoshnik/',
          'X-Title': 'БизнесПомощник',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Не удалось получить ответ.';

      this.messages.push({ role: 'assistant', content: reply });
      this.hideTyping();
      this.renderMessage('bot', reply);

    } catch (err) {
      this.hideTyping();
      this.renderErrorMessage(err.message);
    } finally {
      this.isLoading = false;
      this.els.sendBtn.disabled = false;
      this.els.input.focus();
    }
  }

  renderErrorMessage(errText) {
    const wrap = document.createElement('div');
    wrap.className = 'message message--bot message--error';

    const avatar = document.createElement('div');
    avatar.className = 'message__avatar';
    avatar.textContent = 'AI';

    const body = document.createElement('div');
    body.className = 'message__body';
    body.innerHTML = `<strong>Ошибка:</strong> ${this.escapeHtml(errText)}<br><small>Проверьте API-ключ в файле js/config.js</small>`;

    wrap.appendChild(avatar);
    wrap.appendChild(body);
    this.els.messages.appendChild(wrap);
    this.scrollToBottom();
  }

  escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  clearChat() {
    this.messages = [];
    this.els.messages.innerHTML = '';
    this.renderWelcome();
  }

  renderWelcome() {
    const wrap = document.createElement('div');
    wrap.className = 'message message--bot';

    const avatar = document.createElement('div');
    avatar.className = 'message__avatar';
    avatar.textContent = 'AI';

    const body = document.createElement('div');
    body.className = 'message__body';
    body.innerHTML = `
      <p>Здравствуйте! Я AI-консультант по вопросам малого бизнеса.</p>
      <p>Спрашивайте о регистрации, налогах, кадрах, финансах или развитии вашего бизнеса — отвечу подробно и на конкретных примерах.</p>
      <div class="quick-prompts">
        <button class="quick-btn" data-prompt="Как зарегистрировать ИП?">Как зарегистрировать ИП?</button>
        <button class="quick-btn" data-prompt="Какой налоговый режим выбрать?">Какой налог выбрать?</button>
        <button class="quick-btn" data-prompt="Как оформить первого сотрудника?">Первый сотрудник</button>
        <button class="quick-btn" data-prompt="Как получить кредит для малого бизнеса?">Кредит для бизнеса</button>
      </div>`;

    wrap.appendChild(avatar);
    wrap.appendChild(body);
    this.els.messages.appendChild(wrap);
  }

  scrollToBottom() {
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BusinessChat();
});
