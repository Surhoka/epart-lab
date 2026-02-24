const registerAiAssistantPage = () => {
    console.log("AI Assistant: Checking registration...");
    if (window.Alpine && !window.Alpine.data('aiAssistantPage')) {
        console.log("AI Assistant: Registering alpine component...");
        window.Alpine.data('aiAssistantPage', () => ({
            // --- STATE ---
            activeTab: 'chat',
            showModal: false,
            modalMode: 'add',

            // Chat State
            chatQuery: '',
            messages: [], // Array of { role: 'user'|'assistant', text: '', isTyping: false }
            isChatLoading: false,

            // Config State
            aiConfig: {
                model: 'gemini-flash-latest',
                apiKey: '',
                hasKey: false
            },

            // Rules State
            rules: [],
            editingRule: {
                id: null,
                prompt: '',
                active: true,
                category: 'Trigger'
            },

            // --- LIFECYCLE & ACTIONS ---
            async init() {
                console.log("AI Assistant: init() starting...");
                try {
                    await this.loadAiConfig();
                    await this.fetchRules();
                    console.log("AI Assistant: init() completed (Config & Rules fetched).");
                } catch (e) {
                    console.error("AI Assistant: init() failed", e);
                }

                // Watch for modal state changes
                this.$watch('showModal', value => {
                    console.log(`AI Assistant: showModal changed to: ${value}`);
                });

                // Add welcome message with typing effect
                if (this.messages.length === 0) {
                    // First show typing indicator
                    this.messages.push({
                        role: 'assistant',
                        text: '',
                        isTyping: true
                    });

                    // After 1 second, start typing the welcome message
                    setTimeout(() => {
                        const welcomeText = 'Halo! Saya asisten pakar Ezyparts. Ada yang bisa saya bantu hari ini?';
                        this.typeEffect(welcomeText, 0, 15);
                    }, 1000);
                }
            },

            // --- CHAT LOGIC ---
            async askAi() {
                const query = this.chatQuery.trim();
                if (!query || this.isChatLoading) return;

                // 1. Add User Message
                this.messages.push({
                    role: 'user',
                    text: query,
                    isTyping: false
                });

                this.chatQuery = '';
                this.isChatLoading = true;
                this.scrollToBottom();

                // 2. Add AI Placeholder
                const aiMsgIndex = this.messages.length;
                this.messages.push({
                    role: 'assistant',
                    text: '',
                    isTyping: true
                });

                window.sendDataToGoogle('askAi', { question: query }, (res) => {
                    if (res.status === 'success') {
                        this.typeEffect(res.answer, aiMsgIndex);
                    } else {
                        this.messages[aiMsgIndex].text = `<span class="text-red-500 font-medium">Error: ${res.message || 'Gagal mendapatkan respon.'}</span>`;
                        this.messages[aiMsgIndex].isTyping = false;
                        this.isChatLoading = false;
                    }
                }, (err) => {
                    this.messages[aiMsgIndex].text = '<span class="text-red-500 font-medium">Koneksi gagal. Silakan coba lagi.</span>';
                    this.messages[aiMsgIndex].isTyping = false;
                    this.isChatLoading = false;
                });
            },

            typeEffect(text, index, speed = 10) {
                if (!text) {
                    this.messages[index].isTyping = false;
                    this.isChatLoading = false;
                    return;
                }

                const formattedText = text
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono text-sm text-red-500">$1</code>');

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = formattedText;
                const nodes = Array.from(tempDiv.childNodes);
                let nodeIndex = 0;
                let charIndex = 0;

                const type = () => {
                    if (nodeIndex >= nodes.length) {
                        this.messages[index].isTyping = false;
                        this.isChatLoading = false;
                        this.scrollToBottom();
                        return;
                    }

                    const node = nodes[nodeIndex];
                    if (node.nodeType === Node.TEXT_NODE) {
                        const chars = node.textContent;
                        if (charIndex < chars.length) {
                            this.messages[index].text += chars.charAt(charIndex);
                            charIndex++;
                            setTimeout(type, speed);
                        } else {
                            nodeIndex++;
                            charIndex = 0;
                            setTimeout(type, speed);
                        }
                    } else {
                        this.messages[index].text += node.outerHTML;
                        nodeIndex++;
                        setTimeout(type, speed);
                    }
                    this.scrollToBottom();
                };
                type();
            },

            scrollToBottom() {
                this.$nextTick(() => {
                    const container = document.getElementById('chat-messages-container');
                    if (container) {
                        container.scrollTo({
                            top: container.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                });
            },

            closeAiResult() {
                this.messages = this.messages.slice(0, 1); // Reset to welcome message
                this.isChatLoading = false;
            },

            // --- CONFIG LOGIC ---
            async loadAiConfig() {
                window.sendDataToGoogle('getAiConfig', {}, (res) => {
                    if (res.status === 'success' && res.data) {
                        this.aiConfig.model = res.data.model || 'gemini-flash-latest';
                        this.aiConfig.hasKey = res.data.hasKey || false;
                    }
                });
            },

            async saveAiConfig(button) {
                window.setButtonLoading(button, true);
                const payload = {
                    model: this.aiConfig.model,
                    apiKey: this.aiConfig.apiKey // Send only the new key
                };
                window.sendDataToGoogle('saveAiConfigToSpreadsheet', payload, (res) => {
                    window.setButtonLoading(button, false);
                    if (res.status === 'success') {
                        window.showToast('Konfigurasi AI berhasil disimpan', 'success');
                        if (this.aiConfig.apiKey) {
                            this.aiConfig.apiKey = ''; // Clear the input
                            this.aiConfig.hasKey = true; // Update placeholder state
                        }
                    } else {
                        window.showToast('Gagal menyimpan: ' + res.message, 'error');
                    }
                });
            },

            // --- RULES LOGIC ---
            async fetchRules() {
                this.rules = [];
                window.sendDataToGoogle('getAiRules', {}, (res) => {
                    if (res.status === 'success' && Array.isArray(res.data)) {
                        this.rules = res.data;
                    }
                });
            },

            openAddRuleModal() {
                console.log("Opening Add Rule Modal...");
                this.modalMode = 'add';
                this.editingRule = { id: null, prompt: '', active: true, category: 'Trigger' };
                this.showModal = true;
            },

            openEditRuleModal(rule) {
                this.modalMode = 'edit';
                this.editingRule = JSON.parse(JSON.stringify(rule)); // Deep copy
                this.showModal = true;
            },

            closeRuleModal() {
                this.showModal = false;
            },

            async saveRule(button) {
                if (!this.editingRule.prompt.trim()) {
                    window.showToast('Prompt is required.', 'warning');
                    return;
                }
                window.setButtonLoading(button, true);
                const action = this.editingRule.id ? 'updateAiRule' : 'createAiRule';
                window.sendDataToGoogle(action, this.editingRule, (res) => {
                    window.setButtonLoading(button, false);
                    if (res.status === 'success') {
                        window.showToast('Rule saved successfully!', 'success');
                        this.fetchRules();
                        this.closeRuleModal();
                    } else {
                        window.showToast(`Error: ${res.message}`, 'error');
                    }
                });
            },

            async deleteRule(ruleId) {
                if (!confirm('Are you sure you want to delete this rule?')) return;
                window.sendDataToGoogle('deleteAiRule', { id: ruleId }, (res) => {
                    if (res.status === 'success') {
                        window.showToast('Rule deleted.', 'success');
                        this.fetchRules();
                    } else {
                        window.showToast(`Error: ${res.message}`, 'error');
                    }
                });
            }
        }));
    }
};

// Registration
if (window.Alpine) {
    registerAiAssistantPage();
} else {
    document.addEventListener('alpine:init', registerAiAssistantPage);
}
