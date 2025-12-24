// Post Editor JavaScript - Gutenberg Style
window.initPostNewPage = function () {
    console.log('Post Editor page initialized');
};

window.postEditor = function () {
    return {
        // Post data
        post: {
            title: '',
            content: '',
            status: 'draft',
            categories: [],
            tags: [],
            featuredImage: null
        },

        // Editor state
        blocks: [
            {
                id: 'block-1',
                type: 'paragraph',
                content: '',
                selected: false
            }
        ],
        selectedBlockIndex: -1,
        showBlockInserter: false,

        // Saving state
        saving: false,
        publishing: false,
        canPublish: false,

        init() {
            // Initialize editor
            this.updateCanPublish();

            // Auto-save every 30 seconds
            setInterval(() => {
                if (this.hasChanges()) {
                    this.autoSave();
                }
            }, 30000);

            // Handle keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + S for save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.saveDraft();
                }

                // Ctrl/Cmd + Enter for publish
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (this.canPublish) {
                        this.publishPost();
                    }
                }
            });
        },

        // Block management
        addBlock(type, position = null) {
            console.log('Adding block:', type, 'at position:', position);
            const newBlock = this.createBlock(type);
            console.log('Created block:', newBlock);

            if (position !== null) {
                this.blocks.splice(position, 0, newBlock);
            } else {
                this.blocks.push(newBlock);
            }

            console.log('Blocks after add:', this.blocks.length);
            this.updateCanPublish();

            // Calculate the index where the block was inserted
            const blockIndex = position !== null ? position : this.blocks.length - 1;
            console.log('Will attempt to focus block at index:', blockIndex);

            // Use multiple $nextTick calls and a timeout to ensure DOM is fully rendered
            this.$nextTick(() => {
                this.$nextTick(() => {
                    // Add a small delay to ensure Alpine.js has fully processed the template
                    setTimeout(() => {
                        console.log('DOM should be ready, attempting focus...');
                        this.focusBlock(blockIndex);
                    }, 50);
                });
            });
        },

        addBlockAbove(index) {
            this.addBlock('paragraph', index);
        },

        createBlock(type) {
            const id = 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

            const baseBlock = {
                id: id,
                type: type,
                selected: false
            };

            switch (type) {
                case 'paragraph':
                    return {
                        ...baseBlock,
                        content: ''
                    };

                case 'heading':
                    return {
                        ...baseBlock,
                        content: '',
                        level: 2
                    };

                case 'image':
                    return {
                        ...baseBlock,
                        src: '',
                        alt: '',
                        caption: ''
                    };

                case 'quote':
                    return {
                        ...baseBlock,
                        content: '',
                        citation: ''
                    };

                case 'list':
                    return {
                        ...baseBlock,
                        style: 'unordered',
                        items: ['']
                    };

                case 'separator':
                    return {
                        ...baseBlock
                    };

                default:
                    return baseBlock;
            }
        },

        deleteBlock(index) {
            if (this.blocks.length > 1) {
                this.blocks.splice(index, 1);
                this.updateCanPublish();
            }
        },

        moveBlockUp(index) {
            if (index > 0) {
                const block = this.blocks.splice(index, 1)[0];
                this.blocks.splice(index - 1, 0, block);
            }
        },

        moveBlockDown(index) {
            if (index < this.blocks.length - 1) {
                const block = this.blocks.splice(index, 1)[0];
                this.blocks.splice(index + 1, 0, block);
            }
        },

        selectBlock(index) {
            this.blocks.forEach((block, i) => {
                block.selected = i === index;
            });
            this.selectedBlockIndex = index;
        },

        // Debug helper function
        debugDOMState() {
            console.log('=== DOM Debug State ===');
            console.log('Total blocks in data:', this.blocks.length);
            console.log('Block wrappers in DOM:', document.querySelectorAll('.block-wrapper').length);
            console.log('Contenteditable elements in DOM:', document.querySelectorAll('[contenteditable]').length);
            console.log('Elements with data-block-index:', document.querySelectorAll('[data-block-index]').length);

            // Log each block's DOM presence
            this.blocks.forEach((block, index) => {
                const wrapper = document.querySelector(`[data-block-index="${index}"]`);
                const contenteditable = document.querySelector(`[data-block-index="${index}"] [contenteditable]`);
                console.log(`Block ${index} (${block.type}):`, {
                    hasWrapper: !!wrapper,
                    hasContenteditable: !!contenteditable,
                    blockId: block.id
                });
            });
            console.log('=====================');
        },

        focusBlock(index) {
            this.selectBlock(index);

            // Use a more aggressive retry strategy with longer delays
            const attemptFocus = (attempt = 0) => {
                const maxAttempts = 8;
                const delay = attempt * 100; // 0ms, 100ms, 200ms, 300ms, etc.

                setTimeout(() => {
                    console.log(`Focus attempt ${attempt + 1} for block ${index}`);

                    // Debug DOM state on first attempt
                    if (attempt === 0) {
                        this.debugDOMState();
                    }

                    // Try multiple selectors to find the contenteditable element
                    const selectors = [
                        `[data-block-index="${index}"] [contenteditable]`,
                        `[data-block-id="${this.blocks[index]?.id}"] [contenteditable]`,
                        `.block-wrapper:nth-child(${index + 1}) [contenteditable]`,
                        `#block-editor > div:nth-child(${index + 1}) [contenteditable]`,
                        `#block-editor [contenteditable]:nth-of-type(${index + 1})`,
                        // Additional fallback selectors
                        `#block-editor .block-wrapper:nth-of-type(${index + 1}) [contenteditable]`,
                        `[data-block-index="${index}"] div[contenteditable]`,
                        `[data-block-index="${index}"] span[contenteditable]`
                    ];

                    let blockElement = null;
                    for (const selector of selectors) {
                        blockElement = document.querySelector(selector);
                        if (blockElement) {
                            console.log('Found element with selector:', selector);
                            break;
                        }
                    }

                    if (blockElement) {
                        try {
                            // Ensure element is visible and focusable
                            if (blockElement.offsetParent === null) {
                                console.warn('Element is not visible, retrying...');
                                if (attempt < maxAttempts - 1) {
                                    attemptFocus(attempt + 1);
                                }
                                return;
                            }

                            blockElement.focus();

                            // Move cursor to end for text elements
                            if (blockElement.textContent !== undefined) {
                                const range = document.createRange();
                                const selection = window.getSelection();
                                range.selectNodeContents(blockElement);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }

                            console.log('Successfully focused and positioned cursor');
                            return; // Success, exit retry loop
                        } catch (error) {
                            console.warn('Error focusing element:', error);
                        }
                    } else {
                        console.warn(`Attempt ${attempt + 1}: Could not find contenteditable element for block ${index}`);

                        // Log available elements for debugging
                        const allContentEditable = document.querySelectorAll('[contenteditable]');
                        const allBlockWrappers = document.querySelectorAll('.block-wrapper');
                        console.log('Available contenteditable elements:', allContentEditable.length);
                        console.log('Available block wrappers:', allBlockWrappers.length);

                        // Retry if we haven't reached max attempts
                        if (attempt < maxAttempts - 1) {
                            attemptFocus(attempt + 1);
                        } else {
                            console.error('Failed to focus block after all attempts');
                            // Final debug attempt
                            this.debugDOMState();
                        }
                    }
                }, delay);
            };

            // Start the focus attempts with multiple $nextTick calls for better DOM sync
            this.$nextTick(() => {
                this.$nextTick(() => {
                    this.$nextTick(() => {
                        attemptFocus();
                    });
                });
            });
        },

        // Content management
        updateBlockContent(index, content) {
            if (this.blocks[index]) {
                this.blocks[index].content = content;
                this.updateCanPublish();
            }
        },

        updateListItem(blockIndex, itemIndex, content) {
            if (this.blocks[blockIndex] && this.blocks[blockIndex].items) {
                this.blocks[blockIndex].items[itemIndex] = content;
                this.updateCanPublish();
            }
        },

        addListItem(blockIndex, afterIndex) {
            if (this.blocks[blockIndex] && this.blocks[blockIndex].items) {
                this.blocks[blockIndex].items.splice(afterIndex + 1, 0, '');

                // Focus the new item
                this.$nextTick(() => {
                    const newItemElement = document.querySelector(`[data-block-index="${blockIndex}"] li:nth-child(${afterIndex + 2}) span[contenteditable]`);
                    if (newItemElement) {
                        newItemElement.focus();
                    }
                });
            }
        },

        // Keyboard handlers
        handleEnter(index, event) {
            const block = this.blocks[index];
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);

            // If at the end of an empty block, convert to paragraph
            if (block.content.trim() === '') {
                if (block.type !== 'paragraph') {
                    this.blocks[index] = this.createBlock('paragraph');
                    this.$nextTick(() => this.focusBlock(index));
                    return;
                }
            }

            // Create new paragraph block
            this.addBlock('paragraph', index + 1);
        },

        handleBackspace(index, event) {
            const block = this.blocks[index];
            const selection = window.getSelection();

            // If at the beginning of an empty block, merge with previous or delete
            if (selection.anchorOffset === 0 && block.content.trim() === '') {
                event.preventDefault();

                if (index > 0) {
                    // Merge with previous block or delete current
                    const prevBlock = this.blocks[index - 1];
                    if (prevBlock.type === 'paragraph' && block.type === 'paragraph') {
                        // Focus previous block
                        this.deleteBlock(index);
                        this.$nextTick(() => this.focusBlock(index - 1));
                    } else {
                        this.deleteBlock(index);
                        this.$nextTick(() => this.focusBlock(Math.max(0, index - 1)));
                    }
                }
            }
        },

        handleListBackspace(blockIndex, itemIndex, event) {
            const block = this.blocks[blockIndex];
            const item = block.items[itemIndex];

            if (event.target.textContent.trim() === '' && itemIndex === 0) {
                // Convert to paragraph if first item is empty
                event.preventDefault();
                this.blocks[blockIndex] = this.createBlock('paragraph');
                this.$nextTick(() => this.focusBlock(blockIndex));
            } else if (event.target.textContent.trim() === '' && itemIndex > 0) {
                // Remove empty list item
                event.preventDefault();
                block.items.splice(itemIndex, 1);
                this.$nextTick(() => {
                    const prevItemElement = document.querySelector(`[data-block-index="${blockIndex}"] li:nth-child(${itemIndex}) span[contenteditable]`);
                    if (prevItemElement) {
                        prevItemElement.focus();
                        // Move cursor to end
                        const range = document.createRange();
                        const selection = window.getSelection();
                        range.selectNodeContents(prevItemElement);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                });
            }
        },

        // Image handling
        handleImageUpload(index, event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.blocks[index].src = e.target.result;
                    this.blocks[index].alt = file.name;
                    this.updateCanPublish();
                };
                reader.readAsDataURL(file);
            }
        },

        // Block settings
        openBlockSettings(index) {
            // TODO: Implement block settings modal
            console.log('Open settings for block', index);
        },

        // Publishing
        updateCanPublish() {
            this.canPublish = this.post.title.trim() !== '' && this.hasContent();
        },

        hasContent() {
            return this.blocks.some(block => {
                switch (block.type) {
                    case 'paragraph':
                    case 'heading':
                    case 'quote':
                        return block.content && block.content.trim() !== '';
                    case 'image':
                        return block.src && block.src.trim() !== '';
                    case 'list':
                        return block.items && block.items.some(item => item.trim() !== '');
                    case 'separator':
                        return true; // Separator always counts as content
                    default:
                        return false;
                }
            });
        },

        hasChanges() {
            // Simple change detection - in real app, compare with saved state
            return this.post.title.trim() !== '' || this.hasContent();
        },

        generatePostContent() {
            let html = '';

            this.blocks.forEach(block => {
                switch (block.type) {
                    case 'paragraph':
                        if (block.content.trim()) {
                            html += `<p>${block.content}</p>\n`;
                        }
                        break;

                    case 'heading':
                        if (block.content.trim()) {
                            html += `<h${block.level}>${block.content}</h${block.level}>\n`;
                        }
                        break;

                    case 'image':
                        if (block.src) {
                            html += `<figure><img src="${block.src}" alt="${block.alt || ''}">`;
                            if (block.caption) {
                                html += `<figcaption>${block.caption}</figcaption>`;
                            }
                            html += `</figure>\n`;
                        }
                        break;

                    case 'quote':
                        if (block.content.trim()) {
                            html += `<blockquote><p>${block.content}</p>`;
                            if (block.citation) {
                                html += `<cite>${block.citation}</cite>`;
                            }
                            html += `</blockquote>\n`;
                        }
                        break;

                    case 'list':
                        const validItems = block.items.filter(item => item.trim() !== '');
                        if (validItems.length > 0) {
                            const tag = block.style === 'ordered' ? 'ol' : 'ul';
                            html += `<${tag}>\n`;
                            validItems.forEach(item => {
                                html += `<li>${item}</li>\n`;
                            });
                            html += `</${tag}>\n`;
                        }
                        break;

                    case 'separator':
                        html += `<hr class="my-4">\n`;
                        break;
                }
            });

            return html;
        },

        async saveDraft() {
            if (this.saving) return;

            this.saving = true;

            try {
                const postData = {
                    title: this.post.title,
                    content: this.generatePostContent(),
                    status: 'draft',
                    action: 'saveDraft'
                };

                // Send to Google Apps Script
                await new Promise((resolve, reject) => {
                    window.sendDataToGoogle(
                        'savePost',
                        postData,
                        (response) => {
                            if (response.status === 'success') {
                                window.showToast('Draft saved successfully', 'success');
                                resolve(response);
                            } else {
                                reject(new Error(response.message || 'Failed to save draft'));
                            }
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                });

            } catch (error) {
                console.error('Save draft error:', error);
                window.showToast('Failed to save draft: ' + error.message, 'error');
            } finally {
                this.saving = false;
            }
        },

        async publishPost() {
            if (this.publishing || !this.canPublish) return;

            this.publishing = true;

            try {
                const postData = {
                    title: this.post.title,
                    content: this.generatePostContent(),
                    status: 'published',
                    action: 'publishPost'
                };

                // Send to Google Apps Script
                await new Promise((resolve, reject) => {
                    window.sendDataToGoogle(
                        'savePost',
                        postData,
                        (response) => {
                            if (response.status === 'success') {
                                window.showToast('Post published successfully!', 'success');
                                // Redirect to posts list or view post
                                setTimeout(() => {
                                    window.navigate('posts');
                                }, 1500);
                                resolve(response);
                            } else {
                                reject(new Error(response.message || 'Failed to publish post'));
                            }
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                });

            } catch (error) {
                console.error('Publish error:', error);
                window.showToast('Failed to publish post: ' + error.message, 'error');
            } finally {
                this.publishing = false;
            }
        },

        async autoSave() {
            if (!this.hasChanges() || this.saving) return;

            try {
                await this.saveDraft();
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }
    };
};

// Toast notification helper
window.showToast = function (message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-full ${type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
                type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
        }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
};
