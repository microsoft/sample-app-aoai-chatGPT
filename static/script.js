// Track attached files
let attachedFiles = [];
let searchSource = 'email';
let selectedM365Items = [];

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

// --- M365 SEARCH FUNCTIONS ---

function toggleM365Panel() {
    const panel = document.getElementById('m365-panel');
    const button = document.getElementById('m365-button');
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        button.classList.add('bg-blue-100', 'border-blue-500', 'text-blue-700');
        button.classList.remove('bg-gray-100', 'border-gray-300', 'text-gray-600');
        document.getElementById('m365-search-input').focus();
    } else {
        closeM365Panel();
    }
}

function closeM365Panel() {
    const panel = document.getElementById('m365-panel');
    const button = document.getElementById('m365-button');
    
    panel.classList.add('hidden');
    button.classList.remove('bg-blue-100', 'border-blue-500', 'text-blue-700');
    button.classList.add('bg-gray-100', 'border-gray-300', 'text-gray-600');
    selectedM365Items = [];
    updateSelectedCount();
}

function setSearchSource(source) {
    searchSource = source;
    
    const emailBtn = document.getElementById('src-email');
    const filesBtn = document.getElementById('src-files');
    const searchInput = document.getElementById('m365-search-input');
    
    if (source === 'email') {
        emailBtn.className = 'px-3 py-1.5 text-sm rounded-lg border border-blue-500 bg-blue-50 text-blue-700 font-medium transition-all';
        filesBtn.className = 'px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-all';
        searchInput.placeholder = 'Search emails...';
    } else {
        filesBtn.className = 'px-3 py-1.5 text-sm rounded-lg border border-blue-500 bg-blue-50 text-blue-700 font-medium transition-all';
        emailBtn.className = 'px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-all';
        searchInput.placeholder = 'Search OneDrive files...';
    }
    
    // Clear results when switching
    document.getElementById('m365-results').innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Search your ' + (source === 'email' ? 'Outlook emails' : 'OneDrive files') + '</p>';
    selectedM365Items = [];
    updateSelectedCount();
}

async function searchM365() {
    const query = document.getElementById('m365-search-input').value.trim();
    const resultsDiv = document.getElementById('m365-results');
    
    resultsDiv.innerHTML = `
        <div class="flex items-center justify-center py-8 gap-3">
            <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-gray-500">Searching ${searchSource === 'email' ? 'Outlook' : 'OneDrive'}...</span>
        </div>
    `;
    
    try {
        const endpoint = searchSource === 'email' ? '/api/search-outlook' : '/api/search-onedrive';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultsDiv.innerHTML = `<p class="text-red-500 text-sm text-center py-8"><i class="fas fa-exclamation-circle mr-2"></i>${data.error}</p>`;
            return;
        }
        
        const items = data.value || [];
        
        if (items.length === 0) {
            resultsDiv.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No results found</p>';
            return;
        }
        
        if (searchSource === 'email') {
            renderEmailResults(items);
        } else {
            renderFileResults(items);
        }
        
    } catch (error) {
        resultsDiv.innerHTML = `<p class="text-red-500 text-sm text-center py-8"><i class="fas fa-exclamation-circle mr-2"></i>Search failed: ${error.message}</p>`;
    }
}

function renderEmailResults(emails) {
    const resultsDiv = document.getElementById('m365-results');
    
    let html = '<div class="space-y-2">';
    
    emails.forEach((email, index) => {
        const date = new Date(email.receivedDateTime).toLocaleDateString();
        const sender = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown';
        const hasAttachments = email.hasAttachments;
        
        html += `
            <div class="search-result border border-gray-200 rounded-lg p-3 cursor-pointer transition-all ${hasAttachments ? '' : 'opacity-60'}" 
                 data-type="email" 
                 data-id="${email.id}" 
                 data-subject="${escapeHtml(email.subject || 'No Subject')}"
                 data-has-attachments="${hasAttachments}"
                 onclick="toggleEmailSelection(this, '${email.id}')">
                <div class="flex items-start gap-3">
                    <div class="mt-1">
                        <i class="fas ${hasAttachments ? 'fa-envelope text-blue-500' : 'fa-envelope-open text-gray-400'}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-gray-800 truncate">${escapeHtml(email.subject || 'No Subject')}</span>
                            ${hasAttachments ? '<i class="fas fa-paperclip text-gray-400 text-xs"></i>' : ''}
                        </div>
                        <div class="text-xs text-gray-500 mt-0.5">${escapeHtml(sender)} • ${date}</div>
                        <div class="text-xs text-gray-400 mt-1 truncate">${escapeHtml(email.bodyPreview || '')}</div>
                    </div>
                    <div class="check-indicator hidden text-blue-600">
                        <i class="fas fa-check-circle"></i>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsDiv.innerHTML = html;
}

function renderFileResults(files) {
    const resultsDiv = document.getElementById('m365-results');
    
    let html = '<div class="space-y-2">';
    
    files.forEach((file, index) => {
        const date = new Date(file.createdDateTime || file.lastModifiedDateTime).toLocaleDateString();
        const size = formatFileSize(file.size);
        const downloadUrl = file['@microsoft.graph.downloadUrl'] || file['@content.downloadUrl'] || '';
        const name = file.name || 'Unknown File';
        const icon = getFileIconClass(name);
        
        html += `
            <div class="search-result border border-gray-200 rounded-lg p-3 cursor-pointer transition-all" 
                 data-type="file" 
                 data-name="${escapeHtml(name)}"
                 data-download-url="${escapeHtml(downloadUrl)}"
                 data-web-url="${escapeHtml(file.webUrl || '')}"
                 onclick="toggleFileSelection(this)">
                <div class="flex items-center gap-3">
                    <i class="fas ${icon} text-lg w-6 text-center"></i>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800 truncate">${escapeHtml(name)}</div>
                        <div class="text-xs text-gray-500 mt-0.5">${size} • ${date}</div>
                    </div>
                    <div class="check-indicator hidden text-blue-600">
                        <i class="fas fa-check-circle"></i>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsDiv.innerHTML = html;
}

async function toggleEmailSelection(element, emailId) {
    const hasAttachments = element.dataset.hasAttachments === 'true';
    
    if (!hasAttachments) {
        addMessage('This email has no attachments to import.', 'system-error');
        return;
    }
    
    // Check if already selected
    const existingIndex = selectedM365Items.findIndex(item => item.id === emailId);
    
    if (existingIndex >= 0) {
        // Deselect
        selectedM365Items.splice(existingIndex, 1);
        element.classList.remove('selected');
        element.querySelector('.check-indicator').classList.add('hidden');
    } else {
        // Fetch attachments for this email
        element.style.opacity = '0.5';
        
        try {
            const response = await fetch(`/api/search-outlook/${emailId}/attachments`);
            const data = await response.json();
            
            if (data.error) {
                addMessage(`Failed to get attachments: ${data.error}`, 'system-error');
                element.style.opacity = '1';
                return;
            }
            
            const attachments = data.value || [];
            const validAttachments = attachments.filter(a => a['@odata.type'] === '#microsoft.graph.fileAttachment');
            
            if (validAttachments.length === 0) {
                addMessage('No downloadable attachments found in this email.', 'system-error');
                element.style.opacity = '1';
                return;
            }
            
            // Add each attachment
            validAttachments.forEach(att => {
                selectedM365Items.push({
                    type: 'email-attachment',
                    id: emailId + '-' + att.id,
                    emailId: emailId,
                    name: att.name,
                    contentBytes: att.contentBytes,
                    contentType: att.contentType
                });
            });
            
            element.classList.add('selected');
            element.querySelector('.check-indicator').classList.remove('hidden');
            
        } catch (error) {
            addMessage(`Failed to get attachments: ${error.message}`, 'system-error');
        }
        
        element.style.opacity = '1';
    }
    
    updateSelectedCount();
}

function toggleFileSelection(element) {
    const downloadUrl = element.dataset.downloadUrl;
    const name = element.dataset.name;
    
    if (!downloadUrl) {
        addMessage('This file cannot be downloaded directly.', 'system-error');
        return;
    }
    
    const existingIndex = selectedM365Items.findIndex(item => item.name === name);
    
    if (existingIndex >= 0) {
        selectedM365Items.splice(existingIndex, 1);
        element.classList.remove('selected');
        element.querySelector('.check-indicator').classList.add('hidden');
    } else {
        selectedM365Items.push({
            type: 'onedrive-file',
            name: name,
            downloadUrl: downloadUrl
        });
        element.classList.add('selected');
        element.querySelector('.check-indicator').classList.remove('hidden');
    }
    
    updateSelectedCount();
}

function updateSelectedCount() {
    const actionsBar = document.getElementById('m365-actions');
    const countSpan = document.getElementById('selected-count');
    
    if (selectedM365Items.length > 0) {
        actionsBar.classList.remove('hidden');
        countSpan.textContent = `${selectedM365Items.length} file${selectedM365Items.length > 1 ? 's' : ''} selected`;
    } else {
        actionsBar.classList.add('hidden');
    }
}

async function addSelectedToChat() {
    if (selectedM365Items.length === 0) return;
    
    const statusId = addLoading('Importing files from Microsoft 365...');
    
    for (const item of selectedM365Items) {
        try {
            if (item.type === 'email-attachment') {
                // Upload base64 content directly to blob storage
                const response = await fetch('/api/get-upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: item.name })
                });
                
                const urlData = await response.json();
                if (urlData.error) throw new Error(urlData.error);
                
                // Decode base64 and upload
                const binaryData = atob(item.contentBytes);
                const bytes = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                    bytes[i] = binaryData.charCodeAt(i);
                }
                
                const uploadResponse = await fetch(urlData.upload_url, {
                    method: 'PUT',
                    headers: {
                        'x-ms-blob-type': 'BlockBlob',
                        'Content-Type': item.contentType || 'application/octet-stream'
                    },
                    body: bytes
                });
                
                if (!uploadResponse.ok) throw new Error('Upload failed');
                
                attachedFiles.push({
                    blob_name: urlData.blob_name,
                    original_filename: item.name,
                    source: 'outlook'
                });
                
            } else if (item.type === 'onedrive-file') {
                // Use backend to download and store
                const response = await fetch('/api/download-graph-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        download_url: item.downloadUrl,
                        file_name: item.name
                    })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                
                attachedFiles.push({
                    blob_name: data.blob_name,
                    original_filename: data.original_filename,
                    source: 'onedrive'
                });
            }
        } catch (error) {
            console.error(`Failed to import ${item.name}:`, error);
        }
    }
    
    removeMessage(statusId);
    updateAttachmentsUI();
    closeM365Panel();
    
    if (attachedFiles.length > 0) {
        addMessage(`✅ Imported ${selectedM365Items.length} file(s) from Microsoft 365. You can now ask questions about them.`, 'system');
    }
}

// --- FILE ATTACHMENT HANDLING ---

async function handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
            addMessage(`File "${file.name}" is too large. Maximum size is 10MB.`, 'system-error');
            continue;
        }

        const statusId = addUploadingStatus(file.name);

        try {
            const urlResponse = await fetch('/api/get-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name })
            });

            const urlData = await urlResponse.json();
            if (urlData.error) throw new Error(urlData.error);

            const uploadResponse = await fetch(urlData.upload_url, {
                method: 'PUT',
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': file.type || 'application/octet-stream'
                },
                body: file
            });

            if (!uploadResponse.ok) throw new Error('Upload failed');

            attachedFiles.push({
                blob_name: urlData.blob_name,
                original_filename: file.name,
                size: file.size,
                source: 'local'
            });

            updateAttachmentsUI();
            removeMessage(statusId);

        } catch (error) {
            removeMessage(statusId);
            addMessage(`Failed to upload "${file.name}": ${error.message}`, 'system-error');
        }
    }

    event.target.value = '';
}

function updateAttachmentsUI() {
    const preview = document.getElementById('attachments-preview');
    const list = document.getElementById('attachments-list');
    const count = document.getElementById('attachment-count');

    if (attachedFiles.length === 0) {
        preview.classList.add('hidden');
        count.classList.add('hidden');
        return;
    }

    preview.classList.remove('hidden');
    count.classList.remove('hidden');
    count.textContent = attachedFiles.length;

    list.innerHTML = attachedFiles.map((file, index) => {
        const sourceIcon = file.source === 'outlook' ? 'fa-envelope' : file.source === 'onedrive' ? 'fa-cloud' : 'fa-file';
        const sourceColor = file.source === 'outlook' ? 'text-blue-500' : file.source === 'onedrive' ? 'text-sky-500' : 'text-gray-500';
        
        return `
            <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-sm">
                <i class="fas ${getFileIcon(file.original_filename)} ${sourceColor}"></i>
                <span class="text-gray-700 max-w-[150px] truncate">${file.original_filename}</span>
                <button onclick="removeAttachment(${index})" class="text-gray-400 hover:text-red-500 ml-1">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'txt': 'fa-file-lines',
        'png': 'fa-file-image',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel'
    };
    return icons[ext] || 'fa-file';
}

function getFileIconClass(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': 'fa-file-pdf text-red-500',
        'doc': 'fa-file-word text-blue-600',
        'docx': 'fa-file-word text-blue-600',
        'txt': 'fa-file-lines text-gray-500',
        'png': 'fa-file-image text-purple-500',
        'jpg': 'fa-file-image text-purple-500',
        'jpeg': 'fa-file-image text-purple-500',
        'xls': 'fa-file-excel text-green-600',
        'xlsx': 'fa-file-excel text-green-600'
    };
    return icons[ext] || 'fa-file text-gray-400';
}

function removeAttachment(index) {
    attachedFiles.splice(index, 1);
    updateAttachmentsUI();
}

function clearAllAttachments() {
    attachedFiles = [];
    updateAttachmentsUI();
}

function addUploadingStatus(filename) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = 'flex justify-start animate-fade-in';
    div.innerHTML = `
        <div class="bg-blue-50 px-4 py-2 rounded-xl border border-blue-200 flex items-center gap-3">
            <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-blue-700 text-sm">Uploading ${escapeHtml(filename)}...</span>
        </div>`;
    div.id = 'upload-' + Date.now();
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}

// --- CHAT FUNCTIONS ---

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (!message && attachedFiles.length === 0) return;

    let displayMessage = message;
    if (attachedFiles.length > 0) {
        const fileNames = attachedFiles.map(f => f.original_filename).join(', ');
        displayMessage = message 
            ? `📎 ${fileNames}\n\n${message}`
            : `📎 Attached: ${fileNames}`;
    }

    addMessage(displayMessage, 'user');
    input.value = '';

    const loadingId = addLoading();

    try {
        const response = await fetch('/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [{ role: 'user', content: message || 'Please analyze the attached files.' }],
                blobs: attachedFiles
            })
        });

        const data = await response.json();

        if (data.error) {
            removeMessage(loadingId);
            addMessage(`Error: ${data.error}`, 'system-error');
            return;
        }

        const jobId = data.job_id;
        const result = await pollForResult(jobId);
        
        removeMessage(loadingId);

        if (result.status === 'Complete') {
            addMessage(result.result, 'system', true);
        } else if (result.status === 'Failed') {
            addMessage(`Error: ${result.result}`, 'system-error');
        } else {
            addMessage("Request timed out. Please try again.", 'system-error');
        }

        clearAllAttachments();

    } catch (error) {
        removeMessage(loadingId);
        addMessage("Failed to connect to server: " + error.message, 'system-error');
    }
}

async function pollForResult(jobId, maxAttempts = 120, interval = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(`/api/check_status/${jobId}`);
            const data = await response.json();
            
            if (data.status === 'Complete' || data.status === 'Failed') {
                return data;
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
            console.error('Polling error:', error);
        }
    }
    return { status: 'Timeout', result: 'Request timed out' };
}

function addMessage(text, type, isMarkdown = false) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`;
    
    const bubble = document.createElement('div');
    bubble.className = `p-4 rounded-2xl shadow-sm max-w-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        type === 'user' 
        ? 'bg-blue-600 text-white rounded-tr-sm' 
        : type === 'system-error' 
            ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
            : 'bg-white text-gray-700 border border-gray-200 rounded-tl-sm'
    }`;
    
    if (isMarkdown && type !== 'user') {
        bubble.innerHTML = renderMarkdown(text);
    } else {
        bubble.textContent = text;
    }
    
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id = 'msg-' + Date.now();
}

function renderMarkdown(text) {
    if (!text) return '';
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded mt-2 mb-2 overflow-x-auto text-xs"><code>$1</code></pre>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>')
        .replace(/\n/g, '<br>');
}

function addLoading(customText) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = 'flex justify-start animate-fade-in';
    div.innerHTML = `
        <div class="bg-white px-4 py-3 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm">
            <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-gray-500 text-sm font-medium">${customText || 'Thinking...'}</span>
        </div>`;
    div.id = 'loading-' + Date.now();
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// --- UTILITY FUNCTIONS ---

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
