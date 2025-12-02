// Toggle the Settings Panel
function toggleConnector() {
    const panel = document.getElementById('connector-panel');
    panel.classList.toggle('hidden');
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    const scope = document.getElementById('scope-select').value;
    const timeRange = document.getElementById('time-select').value;
    
    if (!message) return;

    // 1. Add User Message
    addMessage(message, 'user');
    input.value = '';

    // 2. Add Loading
    const loadingId = addLoading();

    try {
        // 3. Send to Backend - Start the job
        const response = await fetch('/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                task: scope,
                messages: [{ role: 'user', content: message }],
                search_scope: scope,
                time_range: timeRange
            })
        });

        const data = await response.json();

        if (data.error) {
            removeMessage(loadingId);
            addMessage(`Error: ${data.error}`, 'system-error');
            return;
        }

        // 4. Poll for job completion
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

    } catch (error) {
        removeMessage(loadingId);
        addMessage("Failed to connect to server: " + error.message, 'system-error');
    }
}

// Poll the job status endpoint until complete or timeout
async function pollForResult(jobId, maxAttempts = 60, interval = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(`/api/check_status/${jobId}`);
            const data = await response.json();
            
            if (data.status === 'Complete' || data.status === 'Failed') {
                return data;
            }
            
            // Still pending, wait and try again
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
    bubble.className = `p-4 rounded-2xl shadow-sm max-w-2xl text-sm leading-relaxed ${
        type === 'user' 
        ? 'bg-blue-600 text-white rounded-tr-sm' 
        : type === 'system-error' 
            ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
            : 'bg-white text-gray-700 border border-gray-200 rounded-tl-sm'
    }`;
    
    if (isMarkdown && type !== 'user') {
        // Basic markdown rendering for AI responses
        bubble.innerHTML = renderMarkdown(text);
    } else {
        bubble.textContent = text;
    }
    
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id = 'msg-' + Date.now();
}

// Basic markdown rendering
function renderMarkdown(text) {
    if (!text) return '';
    
    return text
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded mt-2 mb-2 overflow-x-auto text-xs"><code>$1</code></pre>')
        // Inline code
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>')
        // Line breaks
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

// Renders the results in a clean "File List" style
function renderResults(items) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = 'flex justify-start w-full animate-fade-in';
    
    let html = `<div class="w-full max-w-2xl border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">`;
    
    html += `
        <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>Name</span>
            <span>Date</span>
        </div>
    `;

    items.forEach(item => {
        const iconClass = item.type === 'Email' ? 'fa-envelope text-blue-500' : 'fa-file-alt text-green-500';
        const dateObj = new Date(item.date);
        const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        html += `
            <div class="result-row group cursor-pointer" onclick="window.open('${item.link}', '_blank')">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <i class="fas ${iconClass} text-lg w-6 text-center opacity-80 group-hover:opacity-100 transition-opacity"></i>
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate transition-colors">
                            ${item.title}
                        </span>
                        <span class="text-xs text-gray-400 truncate">
                            ${item.sender || 'Unknown'} &bull; ${item.preview ? item.preview.substring(0, 40) + '...' : 'No preview'}
                        </span>
                    </div>
                </div>
                <div class="text-xs text-gray-400 whitespace-nowrap pl-4 group-hover:text-gray-600 transition-colors">
                    ${dateStr}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    div.innerHTML = html;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
