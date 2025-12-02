// Track attached files
let attachedFiles = [];

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

// --- FILE ATTACHMENT HANDLING ---

async function handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            addMessage(`File "${file.name}" is too large. Maximum size is 10MB.`, 'system-error');
            continue;
        }

        // Show uploading status
        const statusId = addUploadingStatus(file.name);

        try {
            // 1. Get upload URL from backend
            const urlResponse = await fetch('/api/get-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name })
            });

            const urlData = await urlResponse.json();
            
            if (urlData.error) {
                throw new Error(urlData.error);
            }

            // 2. Upload file directly to Azure Blob Storage
            const uploadResponse = await fetch(urlData.upload_url, {
                method: 'PUT',
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': file.type || 'application/octet-stream'
                },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            // 3. Track the uploaded file
            attachedFiles.push({
                blob_name: urlData.blob_name,
                original_filename: file.name,
                size: file.size
            });

            updateAttachmentsUI();
            removeMessage(statusId);

        } catch (error) {
            removeMessage(statusId);
            addMessage(`Failed to upload "${file.name}": ${error.message}`, 'system-error');
        }
    }

    // Clear the input so the same file can be selected again
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

    list.innerHTML = attachedFiles.map((file, index) => `
        <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-sm">
            <i class="fas ${getFileIcon(file.original_filename)} text-blue-500"></i>
            <span class="text-gray-700 max-w-[150px] truncate">${file.original_filename}</span>
            <button onclick="removeAttachment(${index})" class="text-gray-400 hover:text-red-500 ml-1">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
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
        'jpeg': 'fa-file-image'
    };
    return icons[ext] || 'fa-file';
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
            <span class="text-blue-700 text-sm">Uploading ${filename}...</span>
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

    // Build display message
    let displayMessage = message;
    if (attachedFiles.length > 0) {
        const fileNames = attachedFiles.map(f => f.original_filename).join(', ');
        displayMessage = message 
            ? `📎 ${fileNames}\n\n${message}`
            : `📎 Attached: ${fileNames}`;
    }

    // Add user message to chat
    addMessage(displayMessage, 'user');
    input.value = '';

    // Add loading indicator
    const loadingId = addLoading();

    try {
        // Send to backend with attached files
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

        // Poll for job completion
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

        // Clear attachments after sending
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

function addLoading() {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = 'flex justify-start animate-fade-in';
    div.innerHTML = `
        <div class="bg-white px-4 py-3 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm">
            <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-gray-500 text-sm font-medium">Thinking...</span>
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
