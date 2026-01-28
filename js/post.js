/**
 * Post Editor Page Logic
 * Handles simple classic text editing interactions.
 */

window.initPostEditorPage = function () {
    console.log("Post Editor Page Initialized");
    registerPostEditor();
};

const registerPostEditor = () => {
    if (window.Alpine && !window.Alpine.data('postEditor')) {
        window.Alpine.data('postEditor', () => ({
            activeTab: 'list', // 'list' or 'editor'
            savedRange: null,
            defaultPost: {
                id: null,
                title: '',
                slug: '',
                content: '<p>Start telling your story...</p>',
                status: 'Draft',
                category: [],
                tags: '',
                image: '',
                location: '',
                commentOption: 'allow',
                dateMode: 'auto',
                publishDate: '',
                permalinkMode: 'auto'
            },
            post: {},
            posts: [],
            isLoading: false,
            publicBlogUrl: window.app?.publicBlogUrl || '',
            siteKey: window.app?.siteKey || '',
            categories: [],
            formattingTools: [
                { icon: 'bold', cmd: 'bold', label: 'Bold' },
                { icon: 'italic', cmd: 'italic', label: 'Italic' },
                { icon: 'underline', cmd: 'underline', label: 'Underline' },
                { icon: 'strikethrough', cmd: 'strikethrough', label: 'Strikethrough' },
                { icon: 'eraser', cmd: 'removeFormat', label: 'Clear Formatting' },
                { icon: 'list-bullet', cmd: 'insertUnorderedList', label: 'Bullet List' },
                { icon: 'list-number', cmd: 'insertOrderedList', label: 'Numbered List' },
                { icon: 'outdent', cmd: 'outdent', label: 'Decrease Indent' },
                { icon: 'indent', cmd: 'indent', label: 'Increase Indent' },
                { icon: 'quote', cmd: 'formatBlock:blockquote', label: 'Quote' },
                { icon: 'code', cmd: 'formatBlock:pre', label: 'Code Block' },
                { icon: 'minus', cmd: 'insertHorizontalRule', label: 'Horizontal Line' }
            ],

            async init() {
                this.post = JSON.parse(JSON.stringify(this.defaultPost));
                this.$watch('post.title', value => {
                    // Guard clause to prevent error on reset
                    if (value) {
                        // Only auto-generate slug if in auto mode
                        if (this.post.permalinkMode === 'auto') {
                            this.post.slug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                        }
                    } else {
                        if (this.post.permalinkMode === 'auto') this.post.slug = '';
                    }
                });
                this.fetchCategories();
                await this.fetchPosts();
            },

            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
            },

            async fetchCategories() {
                window.sendDataToGoogle('get_categories', {}, (res) => {
                    if (res.status === 'success' && Array.isArray(res.data)) {
                        this.categories = res.data.map(item => {
                            if (typeof item === 'object') {
                                return item.name || item.Name || item.Category || item.value;
                            }
                            return item;
                        }).filter(Boolean);
                    }
                });
            },

            addCategory() {
                const name = prompt("Nama Label Baru:");
                if (name) {
                    if (!this.categories.includes(name)) {
                        this.categories.push(name);
                    }
                    if (!this.post.category.includes(name)) {
                        this.post.category.push(name);
                    }
                }
            },

            async fetchPosts() {
                this.isLoading = true;
                window.sendDataToGoogle('get_posts', {}, (res) => {
                    this.isLoading = false;
                    if (res.status === 'success') {
                        // Normalize keys to lowercase for frontend consistency
                        this.posts = (res.data || []).map(p => ({
                            id: p.ID,
                            title: p.Title,
                            slug: p.Slug,
                            content: p.Content,
                            status: p.Status,
                            category: p.Category,
                            tags: p.Tags,
                            date: this.formatDate(p.DateCreated),
                            lastModified: p.LastModified
                        }));
                    } else {
                        console.error("Fetch posts failed:", res.message);
                    }
                }, (err) => {
                    this.isLoading = false;
                    console.error("API Error fetching posts:", err);
                });
            },

            execCommand(command, value = null) {
                if (command.startsWith('formatBlock:')) {
                    const tag = command.split(':')[1];
                    document.execCommand('formatBlock', false, tag);
                } else {
                    document.execCommand(command, false, value);
                }
                // Maintain focus on editor
                document.getElementById('classic-editor-body').focus();
            },

            insertLink() {
                this.saveSelection();
                const url = prompt("Enter URL:");
                if (url) {
                    this.restoreSelection();
                    document.execCommand('createLink', false, url);
                }
            },

            triggerImageUpload() {
                this.saveSelection();
                this.$refs.imageInput.click();
            },

            saveSelection() {
                const sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    this.savedRange = sel.getRangeAt(0);
                }
            },

            restoreSelection() {
                const editor = document.getElementById('classic-editor-body');
                editor.focus();
                if (this.savedRange) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(this.savedRange);
                }
            },

            handleImageUpload(event) {
                const file = event.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    window.showToast("Image too large (max 5MB)", "error");
                    return;
                }

                window.showToast("Uploading image...", "info");

                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Data = e.target.result.split(',')[1];
                    const payload = {
                        fileName: file.name,
                        fileData: base64Data,
                        mimeType: file.type
                    };

                    window.sendDataToGoogle('uploadImageAndGetUrl', payload, (res) => {
                        if (res.status === 'success') {
                            this.insertImageAtCursor(res.url);
                            window.showToast("Image uploaded!", "success");
                        } else {
                            window.showToast("Upload failed: " + res.message, "error");
                        }
                    });
                };
                reader.readAsDataURL(file);
                event.target.value = ''; // Reset input
            },

            insertImageAtCursor(url) {
                this.restoreSelection();
                const imgHtml = `<img src="${url}" class="max-w-full h-auto rounded-lg my-4" alt="Image" />`;
                document.execCommand('insertHTML', false, imgHtml);
            },

            async saveDraft() {
                this.post.status = 'Draft';
                await this.savePost();
            },

            async publishPost() {
                if (!this.post.title) {
                    window.showToast("Please enter a title before publishing", "warning");
                    return;
                }
                this.post.status = 'Published';
                await this.savePost();
            },

            async savePost() {
                const editorBody = document.getElementById('classic-editor-body');
                if (editorBody) this.post.content = editorBody.innerHTML;

                if (!this.post.id) this.post.dateCreated = new Date().toISOString();

                window.showToast("Saving post...", "info");

                // Prepare payload (convert array to string for category if needed)
                const payload = { ...this.post };
                if (Array.isArray(payload.category)) {
                    payload.category = payload.category.join(',');
                }

                window.sendDataToGoogle('save_post', payload, (res) => {
                    if (res.status === 'success') {
                        window.showToast("Post saved successfully!", "success");
                        this.fetchPosts();
                        this.activeTab = 'list';
                    } else {
                        window.showToast("Error saving: " + res.message, "error");
                    }
                });
            },

            async deletePost(id) {
                if (!confirm("Are you sure you want to delete this post?")) return;

                window.showToast("Deleting...", "info");
                window.sendDataToGoogle('delete_post', { id: id }, (res) => {
                    if (res.status === 'success') {
                        window.showToast("Post removed", "success");
                        this.fetchPosts();
                    } else {
                        window.showToast("Delete failed", "error");
                    }
                });
            },

            editPost(item) {
                // Normalize incoming data (from DB, likely PascalCase) to our component's model (lowercase)
                const categories = item.category || item.Category || '';
                this.post = {
                    id: item.id || item.ID,
                    title: item.title || item.Title,
                    slug: item.slug || item.Slug,
                    content: item.content || item.Content,
                    status: item.status || item.Status,
                    category: Array.isArray(categories) ? [...categories] : categories.split(',').map(c => c.trim()).filter(Boolean),
                    tags: item.tags || item.Tags || '',
                    dateCreated: item.dateCreated || item.DateCreated,
                    location: item.location || item.Location || '',
                    commentOption: item.commentOption || item.CommentOption || 'allow',
                    dateMode: (item.publishDate || item.PublishDate) ? 'custom' : 'auto',
                    publishDate: item.publishDate || item.PublishDate || '',
                    permalinkMode: (item.slug || item.Slug) ? 'custom' : 'auto'
                };
                this.activeTab = 'editor';
                // Small delay to ensure editor DOM is ready if needed
                setTimeout(() => {
                    const editorBody = document.getElementById('classic-editor-body');
                    if (editorBody) editorBody.innerHTML = this.post.content || this.defaultPost.content;
                }, 50);
            },
            newPost() {
                this.activeTab = 'editor';
                this.isLoading = false;
                // Reset the post object to a clean, deep copy of the default post
                // Ini memastikan tidak ada data lama yang terbawa.
                this.post = JSON.parse(JSON.stringify(this.defaultPost));

                // Pastikan konten visual di editor juga di-reset
                setTimeout(() => {
                    const editorBody = this.$refs.editor || document.getElementById('classic-editor-body');
                    if (editorBody) {
                        editorBody.innerHTML = this.post.content;
                        editorBody.focus();
                    }
                }, 100);
            }
        }));
    }
};

// Immediate registration or wait for Alpine
if (window.Alpine) {
    registerPostEditor();
} else {
    document.addEventListener('alpine:init', registerPostEditor);
}
