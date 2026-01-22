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
    const searchBtn = document.querySelector('#search-ask-ai');
    const aiResultContainer = document.querySelector('#ai-search-result');
    const aiResultContent = document.querySelector('#ai-result-content');
    const closeAiResult = document.querySelector('#close-ai-result');

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

        // Trigger AI search on Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                handleInlineAiSearch();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput.value.trim()) {
                handleInlineAiSearch();
            }
        });
    }

    if (closeAiResult) {
        closeAiResult.addEventListener('click', () => {
            aiResultContainer.classList.add('hidden');
        });
    }

    function handleInlineAiSearch() {
        const query = searchInput.value.trim();
        aiResultContainer.classList.remove('hidden');
        aiResultContent.innerHTML = '<div class="flex items-center gap-2"><span class="h-2 w-2 animate-bounce rounded-full bg-brand-500"></span><span class="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:0.2s]"></span><span class="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:0.4s]"></span></div>';

        if (typeof window.sendDataToGoogle === 'function') {
            window.sendDataToGoogle(
                'askAiFAQ',
                { question: query },
                (response) => {
                    if (response.status === 'success') {
                        typeEffect(aiResultContent, response.answer);
                    } else {
                        aiResultContent.innerHTML = '<span class="text-red-500">Gagal mendapatkan jawaban: ' + (response.message || "Error server") + '</span>';
                    }
                },
                (error) => {
                    aiResultContent.innerHTML = '<span class="text-red-500">Gangguan koneksi sistem.</span>';
                }
            );
        }
    }

    function typeEffect(element, text, speed = 15, callback = null) {
        if (!text) return;
        element.innerHTML = "";

        // Convert Markdown-like syntax to HTML
        const formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded font-mono text-xs text-brand-600 dark:text-brand-400">$1</code>')
            .replace(/\[([^\]]+)\]\((#[^\)]+)\)/g, '<a href="$2" class="text-brand-500 font-extrabold hover:underline">$1</a>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedText;
        const nodes = Array.from(tempDiv.childNodes);

        let nodeIndex = 0;
        let charIndex = 0;

        function type() {
            if (nodeIndex < nodes.length) {
                const node = nodes[nodeIndex];
                if (node.nodeType === Node.TEXT_NODE) {
                    if (charIndex < node.textContent.length) {
                        element.innerHTML += node.textContent.charAt(charIndex);
                        charIndex++;
                        if (callback) callback();
                        setTimeout(type, speed);
                    } else {
                        nodeIndex++;
                        charIndex = 0;
                        type();
                    }
                } else {
                    // Element node (br, strong, a, etc)
                    element.appendChild(node.cloneNode(true));
                    nodeIndex++;
                    if (callback) callback();
                    type();
                }
            } else if (callback) {
                callback();
            }
        }
        type();
    }

    // --- AI Chat Modal Logic ---
    const modalTrigger = document.querySelector('#ask-ai-trigger');
    const modal = document.querySelector('#aiChatModal');
    const closeBtns = document.querySelectorAll('.modal-close-btn');

    const openModal = () => {
        if (modal) {
            modal.classList.add('flex');
            modal.classList.remove('hidden');
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

    // --- AI Chat Logic ---
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

            if (typeof window.sendDataToGoogle === 'function') {
                window.sendDataToGoogle(
                    'askAiFAQ',
                    { question: message },
                    (response) => {
                        const thinkingMsg = document.getElementById(thinkingId);
                        if (thinkingMsg) {
                            if (response.status === 'success') {
                                // Enable typing effect for chat modal
                                typeEffect(thinkingMsg, response.answer, 15, () => {
                                    chatBody.scrollTop = chatBody.scrollHeight;
                                });
                            } else {
                                thinkingMsg.textContent = "Maaf: " + (response.message || "Gagal mendapatkan jawaban.");
                                thinkingMsg.classList.add('text-red-500');
                                chatBody.scrollTop = chatBody.scrollHeight;
                            }
                        }
                    },
                    (error) => {
                        const thinkingMsg = document.getElementById(thinkingId);
                        if (thinkingMsg) {
                            thinkingMsg.textContent = "Terjadi gangguan koneksi.";
                            thinkingMsg.classList.add('text-red-500');
                        }
                        chatBody.scrollTop = chatBody.scrollHeight;
                    }
                );
            }
        });
    }

    function addChatMessage(text, sender, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'flex gap-3 mb-4 ' + (sender === 'user' ? 'flex-row-reverse' : '');

        const avatar = document.createElement('div');
        avatar.className = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-sm ' +
            (sender === 'user' ? 'bg-gray-200 text-gray-700' : 'bg-brand-500 text-white');
        avatar.textContent = sender === 'user' ? 'ME' : 'AI';

        const content = document.createElement('div');
        content.className = 'rounded-2xl p-4 text-sm max-w-[85%] leading-relaxed ' +
            (sender === 'user' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/10 rounded-tr-none' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-tl-none');
        if (id) content.id = id;
        content.textContent = text;

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
};
