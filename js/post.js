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
                content: '',
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
                await this.fetchPosts();
            },

            get selectedPostIds() {
                return this.posts.filter(p => p.selected).map(p => p.id);
            },

            selectAll(event) {
                const checked = event.target.checked;
                this.posts.forEach(p => p.selected = checked);
            },

            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
            },

            async fetchCategories() {
                // This function is disabled to avoid calling the 'Categories' sheet.
                // Categories are now populated from existing posts in fetchPosts().
                // The call in init() has been removed.
            },

            addCategory() {
                const name = prompt("Nama Label Baru:");
                if (name && name.trim()) {
                    // Optimistically update UI
                    if (!this.categories.includes(name)) {
                        this.categories.push(name);
                        this.categories.sort(); // Keep the list sorted
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
                        const allCategories = new Set();
                        // Normalize keys to lowercase for frontend consistency
                        this.posts = (res.data || []).map(p => {
                            const postData = {
                                id: p.ID,
                                title: p.Title,
                                slug: p.Slug,
                                content: p.Content,
                                status: p.Status,
                                category: p.Category,
                                tags: p.Tags,
                                image: p.Image,
                                location: p.Location,
                                publishDate: p.PublishDate,
                                commentOption: p.CommentOption,
                                permalinkMode: p.PermalinkMode,
                                date: this.formatDate(p.DateCreated),
                                lastModified: p.LastModified,
                                selected: false
                            };
                            if (Array.isArray(postData.category)) {
                                postData.category.forEach(cat => allCategories.add(cat));
                            }
                            return postData;
                        });
                        this.categories = Array.from(allCategories).sort();
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
                        // Sync back the new ID if it was a new post.
                        // This prevents creating a duplicate on the next save.
                        if (res.id && !this.post.id) {
                            this.post.id = res.id;
                        }
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

            async bulkDelete() {
                const ids = this.selectedPostIds;
                if (ids.length === 0) return;
                if (!confirm(`Are you sure you want to delete ${ids.length} selected posts?`)) return;

                window.showToast(`Deleting ${ids.length} posts...`, "info");

                // Create an array of promises, one for each delete request.
                const deletePromises = ids.map(id => {
                    return new Promise((resolve, reject) => {
                        window.sendDataToGoogle('delete_post', { id: id }, (res) => {
                            if (res.status === 'success') {
                                resolve(res);
                            } else {
                                reject(res);
                            }
                        }, (err) => reject(err));
                    });
                });

                try {
                    await Promise.all(deletePromises);
                    window.showToast(`${ids.length} post(s) deleted successfully!`, "success");
                    this.fetchPosts(); // Refresh the list
                } catch (error) {
                    console.error("Bulk delete failed:", error);
                    window.showToast("Bulk delete failed: " + (error.message || 'Some items could not be deleted.'), "error");
                    this.fetchPosts(); // Refresh even on partial failure
                }
            },

            // NEW: Centralized function to handle switching to the editor view
            _switchToEditor(postData) {
                this.isLoading = false; // Explicitly turn off loading
                this.post = postData;

                // Use nextTick to ensure data is ready before switching view
                this.$nextTick(() => {
                    this.activeTab = 'editor';
                });

                // Use setTimeout to ensure the x-show transition is complete before DOM manipulation
                setTimeout(() => {
                    const editorBody = this.$refs.editor || document.getElementById('classic-editor-body');
                    if (editorBody) {
                        editorBody.innerHTML = this.post.content || ''; // Use empty string as a safe fallback
                        editorBody.focus();
                    }
                }, 150); // A slightly longer delay for robustness
            },

            editPost(item) {
                // Normalize incoming data (from DB, likely PascalCase) to our component's model (lowercase)
                const categories = item.category || item.Category || []; // Default to empty array
                const normalizedPost = {
                    id: item.id || item.ID,
                    title: item.title || item.Title || '',
                    slug: item.slug || item.Slug || '',
                    content: item.content || item.Content || '',
                    status: item.status || item.Status || 'Draft',
                    category: Array.isArray(categories) ? [...categories] : String(categories).split(',').map(c => c.trim()).filter(Boolean),
                    tags: item.tags || item.Tags || '',
                    image: item.image || item.Image || '',
                    dateCreated: item.dateCreated || item.DateCreated,
                    location: item.location || item.Location || '',
                    commentOption: item.commentOption || item.CommentOption || 'allow',
                    dateMode: (item.publishDate || item.PublishDate) ? 'custom' : 'auto',
                    publishDate: item.publishDate || item.PublishDate || '',
                    permalinkMode: item.permalinkMode || item.PermalinkMode || 'auto'
                };
                this._switchToEditor(normalizedPost);
            },
            newPost() {
                // Reset the post object to a clean, deep copy of the default post
                const newPostObject = JSON.parse(JSON.stringify(this.defaultPost));
                this._switchToEditor(newPostObject);
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
