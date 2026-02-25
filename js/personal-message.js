/**
 * Personal Messaging Plugin Logic
 * Handles 1-on-1 cross-tenant messaging via Gateway Relay.
 */

window.initPersonalMessagePage = function () {
    console.log("Personal Message Page Initialized");
    // Component is initialized via Alpine.data in the background
};

const registerPersonalMessage = () => {
    if (window.Alpine) {
        window.Alpine.data('personalMessagePage', () => ({
            contacts: [],
            searchResults: [],
            activeContact: null,
            newMessage: '',
            searchQuery: '',
            isSearching: false,
            isSearchOpen: false,
            isSending: false,
            pollingInterval: null,

            async init() {
                console.log("Personal Message Component Init");
                await this.fetchContacts();

                // Start Polling for new messages every 5 seconds
                this.pollingInterval = setInterval(() => {
                    this.fetchContacts();
                    if (this.activeContact) {
                        this.fetchCurrentMessages();
                    }
                }, 5000);
            },

            get apiUrl() {
                return window.EzyApi ? window.EzyApi.url : '';
            },

            get gatewayUrl() {
                // Try to find Gateway URL from global config or app state
                return (typeof CONFIG !== 'undefined') ? CONFIG.WEBAPP_URL_DEV : '';
            },

            get currentMessages() {
                return this.messages || [];
            },

            messages: [],

            async fetchContacts() {
                if (!this.apiUrl) return;
                try {
                    const res = await window.app.fetchJsonp(this.apiUrl, {
                        action: 'get_chat_contacts'
                    });
                    if (res && res.status === 'success') {
                        // Sort by last interaction
                        this.contacts = (res.data || []).sort((a, b) =>
                            new Date(b.LastInteraction) - new Date(a.LastInteraction)
                        );
                    }
                } catch (e) {
                    console.error("Fetch contacts error:", e);
                }
            },

            async fetchCurrentMessages() {
                if (!this.apiUrl || !this.activeContact) return;
                try {
                    const res = await window.app.fetchJsonp(this.apiUrl, {
                        action: 'get_chat_history',
                        targetEmail: this.activeContact.Email
                    });
                    if (res && res.status === 'success') {
                        this.messages = (res.data || []).sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));

                        // Auto scroll to bottom
                        setTimeout(() => {
                            const scroller = document.getElementById('chat-scroller');
                            if (scroller) scroller.scrollTop = scroller.scrollHeight;
                        }, 100);
                    }
                } catch (e) {
                    console.error("Fetch messages error:", e);
                }
            },

            async searchTenants() {
                if (!this.searchQuery.trim() || !this.gatewayUrl) {
                    this.searchResults = [];
                    return;
                }
                this.isSearching = true;
                try {
                    const res = await window.app.fetchJsonp(this.apiUrl, {
                        action: 'search_tenants',
                        gatewayUrl: this.gatewayUrl, // Pass gatewayUrl to plugin
                        query: this.searchQuery
                    });
                    if (res && res.status === 'success') {
                        this.searchResults = res.tenants || [];
                    }
                } catch (e) {
                    console.error("Search error:", e);
                } finally {
                    this.isSearching = false;
                }
            },

            async selectContact(result) {
                // Check if contact already exists in list
                let contact = this.contacts.find(c => c.Email === result.email);
                if (!contact) {
                    // Plugin's receive_personal_message or internal updateContact_ can handle this, 
                    // but for starting a NEW chat from search, we use current active mechanism or just start chat.
                    contact = {
                        Email: result.email,
                        Name: result.name,
                        Avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.name)}&background=random`,
                        UnreadCount: 0,
                        LastMessage: '',
                        LastInteraction: new Date().toISOString()
                    };
                    // Selecting a contact from search doesn't necessarily need a DB write yet until first message,
                    // but we'll let the send mechanism handle it or create placeholder.
                }
                this.activeContact = contact;
                this.isSearchOpen = false;
                this.searchQuery = '';
                this.searchResults = [];
                await this.fetchCurrentMessages();
            },

            async send() {
                if (!this.newMessage.trim() || !this.activeContact || !this.gatewayUrl) return;

                const message = this.newMessage;
                this.newMessage = '';
                this.isSending = true;

                try {
                    const sender = {
                        email: window.app.user?.email || 'unknown',
                        name: (window.app.user?.firstName || 'User') + ' ' + (window.app.user?.lastName || '')
                    };

                    const res = await window.app.fetchJsonp(this.apiUrl, {
                        action: 'send_personal_message',
                        gatewayUrl: this.gatewayUrl,
                        targetEmail: this.activeContact.Email,
                        message: message,
                        senderInfo: JSON.stringify(sender)
                    });

                    if (res.status === 'success') {
                        await this.fetchCurrentMessages();
                        await this.fetchContacts();
                    } else {
                        window.showToast(res.message, "error");
                    }
                } catch (e) {
                    console.error("Send error:", e);
                    window.showToast("Failed to send message", "error");
                } finally {
                    this.isSending = false;
                }
            },

            async markAsRead(contact) {
                if (contact.UnreadCount > 0) {
                    try {
                        await window.app.fetchJsonp(this.apiUrl, {
                            action: 'mark_as_read',
                            targetEmail: contact.Email
                        });
                        contact.UnreadCount = 0;
                    } catch (e) {
                        console.error("Mark as read error:", e);
                    }
                }
            },

            formatTime(timestamp) {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            },

            destroy() {
                if (this.pollingInterval) clearInterval(this.pollingInterval);
            }
        }));
    }
};

if (window.Alpine) {
    registerPersonalMessage();
} else {
    document.addEventListener('alpine:init', registerPersonalMessage);
}
