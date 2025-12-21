/*======== FAQ AI JS =========*/

window.initFaqAiPage = function () {
    console.log('Initializing FAQ AI Page...');

    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('FAQ AI Assistant');
    }

    // --- Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // --- Search Logic ---
    const searchInput = document.querySelector('#faq-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            faqItems.forEach(item => {
                const questionText = item.querySelector('.faq-question span').textContent.toLowerCase();
                const answerText = item.querySelector('.faq-answer').textContent.toLowerCase();

                if (questionText.includes(term) || answerText.includes(term)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            // Show/Hide titles based on visible items
            const categories = document.querySelectorAll('.grid > div');
            categories.forEach(cat => {
                const hasVisibleItems = Array.from(cat.querySelectorAll('.faq-item')).some(item => item.style.display !== 'none');
                cat.style.display = hasVisibleItems ? 'flex' : 'none';
            });
        });
    }

    // --- AI Chat Modal Logic ---
    const modalTrigger = document.querySelector('#ask-ai-trigger');
    const modal = document.querySelector('#aiChatModal');
    const closeBtns = document.querySelectorAll('.modal-close-btn');

    const openModal = () => {
        if (modal) {
            modal.classList.add('flex');
            modal.classList.remove('hidden');
            // Reset chat if needed
        }
    };

    const closeModal = () => {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    if (modalTrigger) modalTrigger.addEventListener('click', openModal);
    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

    // --- AI Chat Simulation ---
    const chatForm = document.querySelector('#ai-chat-form');
    const chatInput = document.querySelector('#ai-chat-input');
    const chatBody = document.querySelector('#ai-chat-body');

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            // Add user message
            addChatMessage(message, 'user');
            chatInput.value = '';

            // AI "Thinking" state
            const thinkingId = 'thinking-' + Date.now();
            addChatMessage('...', 'ai', thinkingId);

            // Simulate AI delay
            setTimeout(() => {
                const thinkingMsg = document.getElementById(thinkingId);
                if (thinkingMsg) {
                    thinkingMsg.innerHTML = getAIResponse(message);
                }
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 1500);
        });
    }

    function addChatMessage(text, sender, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'flex gap-3 ' + (sender === 'user' ? 'flex-row-reverse' : '');

        const avatar = document.createElement('div');
        avatar.className = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ' +
            (sender === 'user' ? 'bg-gray-200 text-gray-700' : 'bg-brand-500 text-white');
        avatar.textContent = sender === 'user' ? 'ME' : 'AI';

        const content = document.createElement('div');
        content.className = 'rounded-2xl p-4 text-sm max-w-[80%] ' +
            (sender === 'user' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/10' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300');
        if (id) content.id = id;
        content.textContent = text;

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function getAIResponse(query) {
        query = query.toLowerCase();
        if (query.includes('resi') || query.includes('track') || query.includes('lacaka')) {
            return "Untuk melacak pesanan, silakan buka menu Dashboard > Pesanan, lalu klik nomor resi yang tersedia. Apakah ada nomor pesanan spesifik yang ingin saya bantu cek?";
        } else if (query.includes('bayar') || query.includes('pembayaran') || query.includes('metode')) {
            return "Kami menerima Transfer Bank (VA), Kartu Kredit, serta dompet digital (OVO, GoPay, Dana). Klik ikon Keranjang di pojok kanan atas untuk melihat detail pembayaran Anda.";
        } else if (query.includes('halo') || query.includes('hi')) {
            return "Halo! Saya asisten AI Ezyparts. Saya siap membantu menjawab pertanyaan Anda seputar pesanan, pembayaran, atau fitur dashboard ini.";
        } else {
            return "Pertanyaan yang bagus! Saya sedang mencari informasi lebih detail tentang '" + query + "'. Secara umum, Anda dapat menemukan informasi tersebut di halaman dokumentasi kami atau hubungi bantuan teknis jika sangat mendesak.";
        }
    }
};
