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
        // 3. Send to Backend
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: message,
                search_scope: scope,
                time_range: timeRange
            })
        });

        const data = await response.json();
        removeMessage(loadingId);

        if (data.error) {
            addMessage(`Error: ${data.error}`, 'system-error');
        } else {
            addMessage(data.response, 'system');
            if (data.data && data.data.length > 0) {
                renderResults(data.data);
            } else {
                addMessage("No results found matching your criteria.", 'system');
            }
        }
    } catch (error) {
        removeMessage(loadingId);
        addMessage("Failed to connect to server.", 'system-error');
    }
}

function addMessage(text, type) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`;
    
    const bubble = document.createElement('div');
    bubble.className = `p-4 rounded-2xl shadow-sm max-w-lg text-sm leading-relaxed ${
        type === 'user' 
        ? 'bg-blue-600 text-white rounded-tr-sm' 
        : type === 'system-error' 
            ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
            : 'bg-white text-gray-700 border border-gray-200 rounded-tl-sm'
    }`;
    bubble.textContent = text;
    
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id = 'msg-' + Date.now();
}

function addLoading() {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = 'flex justify-start animate-fade-in';
    div.innerHTML = `
        <div class="bg-white px-4 py-3 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm">
            <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-gray-500 text-sm font-medium">Searching Microsoft 365...</span>
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

// Renders the results in a clean "File List" style (GitHub-like)
function renderResults(items) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = 'flex justify-start w-full animate-fade-in';
    
    // Container for the list
    let html = `<div class="w-full max-w-2xl border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">`;
    
    // Header Row
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
