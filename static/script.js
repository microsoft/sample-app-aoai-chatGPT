// Track attached files and emails
let attachedFiles = [];
let selectedEmails = [];
let selectedCalendarEvents = [];
let searchSource = 'email';
let selectedM365Items = [];

console.log('Joogni script loaded');

// --- AGREEMENT FUNCTIONS ---

async function checkAgreement() {
    console.log('Checking agreement...');
    try {
        const response = await fetch('/api/check-agreement');
        const data = await response.json();
        console.log('Agreement check response:', data);
        
        if (data.error) {
            console.error('Agreement check error:', data.error);
            showAgreementModal();
            return;
        }
        
        if (!data.accepted) {
            console.log('Agreement not accepted, showing modal');
            showAgreementModal();
        } else {
            console.log('Agreement already accepted');
        }
    } catch (error) {
        console.error('Agreement check failed:', error);
        showAgreementModal();
    }
}

function showAgreementModal() {
    console.log('Showing agreement modal');
    const modal = document.getElementById('agreement-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Agreement modal not found!');
    }
}

function hideAgreementModal() {
    const modal = document.getElementById('agreement-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function updateAcceptButton() {
    const checkbox = document.getElementById('agree-checkbox');
    const button = document.getElementById('accept-btn');
    if (checkbox && button) {
        button.disabled = !checkbox.checked;
    }
}

async function acceptAgreement() {
    const button = document.getElementById('accept-btn');
    if (!button) return;
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const response = await fetch('/api/accept-agreement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        console.log('Accept agreement response:', data);
        
        if (data.success) {
            hideAgreementModal();
            addMessage('✅ Terms accepted. Welcome to Joogni!', 'system');
        } else {
            button.innerHTML = '<i class="fas fa-check"></i> Accept & Continue';
            button.disabled = false;
            alert('Failed to save agreement: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Accept agreement error:', error);
        button.innerHTML = '<i class="fas fa-check"></i> Accept & Continue';
        button.disabled = false;
        alert('Failed to save agreement: ' + error.message);
    }
}

// Check agreement on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking agreement...');
    checkAgreement();
});

// --- CHAT FUNCTIONS ---

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

// --- M365 SEARCH FUNCTIONS ---

function toggleM365Panel() {
    console.log('Toggle M365 panel');
    const panel = document.getElementById('m365-panel');
    const button = document.getElementById('m365-button');
    
    if (!panel || !button) {
        console.error('M365 panel or button not found');
        return;
    }
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        button.classList.add('active');
        document.getElementById('m365-search-input').focus();
    } else {
        closeM365Panel();
    }
}

function closeM365Panel() {
    const panel = document.getElementById('m365-panel');
    const button = document.getElementById('m365-button');
    
    if (panel) panel.classList.add('hidden');
    if (button) button.classList.remove('active');
    selectedM365Items = [];
    updateSelectedCount();
}

function setSearchSource(source) {
    searchSource = source;
    
    const emailBtn = document.getElementById('src-email');
    const filesBtn = document.getElementById('src-files');
    const calendarBtn = document.getElementById('src-calendar');
    const searchInput = document.getElementById('m365-search-input');
    
    if (emailBtn) emailBtn.classList.remove('active');
    if (filesBtn) filesBtn.classList.remove('active');
    if (calendarBtn) calendarBtn.classList.remove('active');
    
    const activeBtn = source === 'email' ? emailBtn : source === 'files' ? filesBtn : calendarBtn;
    if (activeBtn) activeBtn.classList.add('active');
    
    const placeholders = {
        'email': 'Search emails...',
        'files': 'Search OneDrive files...',
        'calendar': 'Search calendar events...'
    };
    if (searchInput) searchInput.placeholder = placeholders[source];
    
    const resultsDiv = document.getElementById('m365-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '<p class="m365-results-empty">Search your ' + 
            (source === 'email' ? 'Outlook emails' : source === 'files' ? 'OneDrive files' : 'calendar events') + '</p>';
    }
    selectedM365Items = [];
    updateSelectedCount();
}

async function searchM365() {
    const query = document.getElementById('m365-search-input').value.trim();
    const resultsDiv = document.getElementById('m365-results');
    
    if (!resultsDiv) return;
    
    const sourceNames = { 'email': 'Outlook', 'files': 'OneDrive', 'calendar': 'Calendar' };
    
    resultsDiv.innerHTML = 
        '<div style="display: flex; align-items: center; justify-content: center; padding: 40px; gap: 12px;">' +
            '<div class="loading-spinner"></div>' +
            '<span style="color: var(--gray-500); font-size: 13px;">Searching ' + sourceNames[searchSource] + '...</span>' +
        '</div>';
    
    try {
        let endpoint = searchSource === 'calendar' ? '/api/search-calendar' : 
                       searchSource === 'email' ? '/api/search-outlook' : '/api/search-onedrive';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultsDiv.innerHTML = '<p class="m365-results-empty" style="color: var(--error);"><i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>' + data.error + '</p>';
            return;
        }
        
        const items = data.value || [];
        
        if (items.length === 0) {
            resultsDiv.innerHTML = '<p class="m365-results-empty">No results found</p>';
            return;
        }
        
        if (searchSource === 'email') renderEmailResults(items);
        else if (searchSource === 'calendar') renderCalendarResults(items);
        else renderFileResults(items);
        
    } catch (error) {
        resultsDiv.innerHTML = '<p class="m365-results-empty" style="color: var(--error);">Search failed: ' + error.message + '</p>';
    }
}

function renderCalendarResults(events) {
    const resultsDiv = document.getElementById('m365-results');
    if (!resultsDiv) return;
    
    let html = '<div style="margin-bottom: 12px; font-size: 12px; color: var(--gray-500);"><i class="fas fa-info-circle" style="margin-right: 6px;"></i>Click events to select them for analysis.</div>';
    
    events.forEach(function(event) {
        const startDate = new Date(event.start?.dateTime || event.start?.date);
        const endDate = new Date(event.end?.dateTime || event.end?.date);
        const dateStr = startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = event.isAllDay ? 'All Day' : startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' - ' + endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const location = event.location?.displayName || '';
        
        html += 
            '<div class="search-result" ' +
                'data-type="calendar" ' +
                'data-id="' + event.id + '" ' +
                'data-subject="' + escapeHtml(event.subject || 'No Title') + '" ' +
                'data-start="' + (event.start?.dateTime || event.start?.date) + '" ' +
                'data-end="' + (event.end?.dateTime || event.end?.date) + '" ' +
                'data-location="' + escapeHtml(location) + '" ' +
                'data-body="' + escapeHtml(event.bodyPreview || '') + '" ' +
                'onclick="toggleCalendarSelection(this, \'' + event.id + '\')">' +
                '<div class="result-icon calendar"><i class="fas fa-calendar-day"></i></div>' +
                '<div class="result-content">' +
                    '<div class="result-title"><span class="truncate">' + escapeHtml(event.subject || 'No Title') + '</span></div>' +
                    '<div class="result-meta">' + dateStr + ' • ' + timeStr + '</div>' +
                    (location ? '<div class="result-preview"><i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i>' + escapeHtml(location) + '</div>' : '') +
                '</div>' +
                '<div class="result-check"><i class="fas fa-check-circle"></i></div>' +
            '</div>';
    });
    
    resultsDiv.innerHTML = html;
}

function toggleCalendarSelection(element, eventId) {
    const existingIndex = selectedM365Items.findIndex(function(item) { return item.id === eventId; });
    
    if (existingIndex >= 0) {
        selectedM365Items.splice(existingIndex, 1);
        element.classList.remove('selected');
    } else {
        selectedM365Items.push({
            type: 'calendar',
            id: eventId,
            subject: element.dataset.subject,
            start: element.dataset.start,
            end: element.dataset.end,
            location: element.dataset.location,
            body: element.dataset.body
        });
        element.classList.add('selected');
    }
    
    updateSelectedCount();
}

function renderEmailResults(emails) {
    const resultsDiv = document.getElementById('m365-results');
    if (!resultsDiv) return;
    
    let html = '<div style="margin-bottom: 12px; font-size: 12px; color: var(--gray-500);"><i class="fas fa-info-circle" style="margin-right: 6px;"></i>Click emails to select. Full content will be included.</div>';
    
    emails.forEach(function(email) {
        const date = new Date(email.receivedDateTime).toLocaleDateString();
        const time = new Date(email.receivedDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const sender = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown';
        const senderEmail = email.from?.emailAddress?.address || '';
        const hasAttachments = email.hasAttachments;
        
        html += 
            '<div class="search-result" ' +
                'data-type="email" ' +
                'data-id="' + email.id + '" ' +
                'data-subject="' + escapeHtml(email.subject || 'No Subject') + '" ' +
                'data-has-attachments="' + hasAttachments + '" ' +
                'data-sender="' + escapeHtml(sender) + '" ' +
                'data-sender-email="' + escapeHtml(senderEmail) + '" ' +
                'data-date="' + email.receivedDateTime + '" ' +
                'onclick="toggleEmailSelection(this, \'' + email.id + '\')">' +
                '<div class="result-icon email"><i class="fas fa-envelope"></i></div>' +
                '<div class="result-content">' +
                    '<div class="result-title">' +
                        '<span class="truncate">' + escapeHtml(email.subject || 'No Subject') + '</span>' +
                        (hasAttachments ? '<i class="fas fa-paperclip" style="color: var(--gray-400); font-size: 11px;"></i>' : '') +
                    '</div>' +
                    '<div class="result-meta">' + escapeHtml(sender) + ' • ' + date + ' ' + time + '</div>' +
                    '<div class="result-preview">' + escapeHtml(email.bodyPreview || '') + '</div>' +
                '</div>' +
                '<div class="result-check"><i class="fas fa-check-circle"></i></div>' +
            '</div>';
    });
    
    resultsDiv.innerHTML = html;
}

function renderFileResults(files) {
    const resultsDiv = document.getElementById('m365-results');
    if (!resultsDiv) return;
    
    let html = '';
    
    files.forEach(function(file) {
        const date = new Date(file.createdDateTime || file.lastModifiedDateTime).toLocaleDateString();
        const size = formatFileSize(file.size);
        const downloadUrl = file['@microsoft.graph.downloadUrl'] || file['@content.downloadUrl'] || '';
        const name = file.name || 'Unknown File';
        const iconClass = getFileIconClass(name);
        
        html += 
            '<div class="search-result" ' +
                'data-type="file" ' +
                'data-name="' + escapeHtml(name) + '" ' +
                'data-download-url="' + escapeHtml(downloadUrl) + '" ' +
                'data-web-url="' + escapeHtml(file.webUrl || '') + '" ' +
                'onclick="toggleFileSelection(this)">' +
                '<div class="result-icon file"><i class="fas ' + iconClass + '"></i></div>' +
                '<div class="result-content">' +
                    '<div class="result-title"><span class="truncate">' + escapeHtml(name) + '</span></div>' +
                    '<div class="result-meta">' + size + ' • ' + date + '</div>' +
                '</div>' +
                '<div class="result-check"><i class="fas fa-check-circle"></i></div>' +
            '</div>';
    });
    
    resultsDiv.innerHTML = html;
}

async function toggleEmailSelection(element, emailId) {
    const existingIndex = selectedM365Items.findIndex(function(item) { return item.id === emailId; });
    
    if (existingIndex >= 0) {
        selectedM365Items.splice(existingIndex, 1);
        element.classList.remove('selected');
        updateSelectedCount();
        return;
    }
    
    element.style.opacity = '0.5';
    
    try {
        const response = await fetch('/api/get-email-content/' + emailId);
        const emailData = await response.json();
        
        if (emailData.error) {
            addMessage('Failed to get email: ' + emailData.error, 'system-error');
            element.style.opacity = '1';
            return;
        }
        
        const sender = emailData.from?.emailAddress?.name || emailData.from?.emailAddress?.address || 'Unknown';
        const senderEmail = emailData.from?.emailAddress?.address || '';
        const toRecipients = (emailData.toRecipients || []).map(function(r) { return r.emailAddress?.address || r.emailAddress?.name; }).join(', ');
        const ccRecipients = (emailData.ccRecipients || []).map(function(r) { return r.emailAddress?.address || r.emailAddress?.name; }).join(', ');
        const subject = emailData.subject || 'No Subject';
        const date = new Date(emailData.receivedDateTime).toLocaleString();
        
        let bodyText = '';
        if (emailData.body) {
            if (emailData.body.contentType === 'html') {
                const temp = document.createElement('div');
                temp.innerHTML = emailData.body.content;
                bodyText = temp.textContent || temp.innerText || '';
            } else {
                bodyText = emailData.body.content || '';
            }
        }
        
        const emailItem = {
            type: 'email',
            id: emailId,
            subject: subject,
            from: sender + ' <' + senderEmail + '>',
            to: toRecipients,
            cc: ccRecipients,
            date: date,
            body: bodyText.trim(),
            hasAttachments: emailData.hasAttachments
        };
        
        selectedM365Items.push(emailItem);
        
        if (emailData.hasAttachments) {
            try {
                const attResponse = await fetch('/api/search-outlook/' + emailId + '/attachments');
                const attData = await attResponse.json();
                
                if (!attData.error && attData.value) {
                    const validAttachments = attData.value.filter(function(a) { return a['@odata.type'] === '#microsoft.graph.fileAttachment'; });
                    
                    validAttachments.forEach(function(att) {
                        selectedM365Items.push({
                            type: 'email-attachment',
                            id: emailId + '-' + att.id,
                            emailId: emailId,
                            name: att.name,
                            contentBytes: att.contentBytes,
                            contentType: att.contentType,
                            parentSubject: subject
                        });
                    });
                }
            } catch (e) {
                console.error('Failed to fetch attachments:', e);
            }
        }
        
        element.classList.add('selected');
        
    } catch (error) {
        addMessage('Failed to get email: ' + error.message, 'system-error');
    }
    
    element.style.opacity = '1';
    updateSelectedCount();
}

function toggleFileSelection(element) {
    const downloadUrl = element.dataset.downloadUrl;
    const name = element.dataset.name;
    
    if (!downloadUrl) {
        addMessage('This file cannot be downloaded directly.', 'system-error');
        return;
    }
    
    const existingIndex = selectedM365Items.findIndex(function(item) { return item.name === name && item.type === 'onedrive-file'; });
    
    if (existingIndex >= 0) {
        selectedM365Items.splice(existingIndex, 1);
        element.classList.remove('selected');
    } else {
        selectedM365Items.push({
            type: 'onedrive-file',
            name: name,
            downloadUrl: downloadUrl
        });
        element.classList.add('selected');
    }
    
    updateSelectedCount();
}

function updateSelectedCount() {
    const actionsBar = document.getElementById('m365-actions');
    const countSpan = document.getElementById('selected-count');
    
    if (!actionsBar || !countSpan) return;
    
    const emailCount = selectedM365Items.filter(function(i) { return i.type === 'email'; }).length;
    const fileCount = selectedM365Items.filter(function(i) { return i.type === 'onedrive-file' || i.type === 'email-attachment'; }).length;
    const calendarCount = selectedM365Items.filter(function(i) { return i.type === 'calendar'; }).length;
    
    if (selectedM365Items.length > 0) {
        actionsBar.classList.remove('hidden');
        var text = [];
        if (emailCount > 0) text.push(emailCount + ' email' + (emailCount > 1 ? 's' : ''));
        if (fileCount > 0) text.push(fileCount + ' file' + (fileCount > 1 ? 's' : ''));
        if (calendarCount > 0) text.push(calendarCount + ' event' + (calendarCount > 1 ? 's' : ''));
        countSpan.textContent = text.join(', ') + ' selected';
    } else {
        actionsBar.classList.add('hidden');
    }
}

async function addSelectedToChat() {
    if (selectedM365Items.length === 0) return;
    
    const statusId = addLoading('Importing from Microsoft 365...');
    
    const emails = selectedM365Items.filter(function(i) { return i.type === 'email'; });
    const files = selectedM365Items.filter(function(i) { return i.type === 'onedrive-file' || i.type === 'email-attachment'; });
    const calendarEvents = selectedM365Items.filter(function(i) { return i.type === 'calendar'; });
    
    for (var j = 0; j < emails.length; j++) {
        var email = emails[j];
        selectedEmails.push({
            subject: email.subject,
            from: email.from,
            to: email.to,
            date: email.date,
            body: email.body
        });
    }
    
    for (var k = 0; k < calendarEvents.length; k++) {
        var event = calendarEvents[k];
        selectedCalendarEvents.push({
            subject: event.subject,
            start: event.start,
            end: event.end,
            location: event.location,
            body: event.body
        });
    }
    
    for (var m = 0; m < files.length; m++) {
        var item = files[m];
        try {
            if (item.type === 'email-attachment') {
                var response = await fetch('/api/get-upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: item.name })
                });
                
                var urlData = await response.json();
                if (urlData.error) throw new Error(urlData.error);
                
                var binaryData = atob(item.contentBytes);
                var bytes = new Uint8Array(binaryData.length);
                for (var n = 0; n < binaryData.length; n++) {
                    bytes[n] = binaryData.charCodeAt(n);
                }
                
                var uploadResponse = await fetch(urlData.upload_url, {
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
                var response2 = await fetch('/api/download-graph-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        download_url: item.downloadUrl,
                        file_name: item.name
                    })
                });
                
                var data = await response2.json();
                if (data.error) throw new Error(data.error);
                
                attachedFiles.push({
                    blob_name: data.blob_name,
                    original_filename: data.original_filename,
                    source: 'onedrive'
                });
            }
        } catch (error) {
            console.error('Failed to import ' + item.name + ':', error);
        }
    }
    
    removeMessage(statusId);
    updateAttachmentsUI();
    closeM365Panel();
    
    var importMsg = '✅ Imported: ';
    var parts = [];
    if (emails.length > 0) parts.push(emails.length + ' email' + (emails.length > 1 ? 's' : ''));
    if (attachedFiles.length > 0) parts.push(attachedFiles.length + ' file' + (attachedFiles.length > 1 ? 's' : ''));
    if (calendarEvents.length > 0) parts.push(calendarEvents.length + ' calendar event' + (calendarEvents.length > 1 ? 's' : ''));
    importMsg += parts.join(' and ');
    importMsg += '. You can now ask questions about them.';
    
    if (parts.length > 0) {
        addMessage(importMsg, 'system');
    }
}

// --- FILE ATTACHMENT HANDLING ---

async function handleFileSelect(event) {
    var files = event.target.files;
    if (!files || files.length === 0) return;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.size > 10 * 1024 * 1024) {
            addMessage('File "' + file.name + '" is too large. Maximum size is 10MB.', 'system-error');
            continue;
        }

        var statusId = addLoading('Uploading ' + file.name + '...');

        try {
            var urlResponse = await fetch('/api/get-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name })
            });

            var urlData = await urlResponse.json();
            if (urlData.error) throw new Error(urlData.error);

            var uploadResponse = await fetch(urlData.upload_url, {
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
            addMessage('Failed to upload "' + file.name + '": ' + error.message, 'system-error');
        }
    }

    event.target.value = '';
}

function updateAttachmentsUI() {
    var preview = document.getElementById('attachments-preview');
    var list = document.getElementById('attachments-list');
    var count = document.getElementById('attachment-count');

    if (!preview || !list || !count) return;

    var totalItems = attachedFiles.length + selectedEmails.length + selectedCalendarEvents.length;
    
    if (totalItems === 0) {
        preview.classList.add('hidden');
        count.classList.add('hidden');
        return;
    }

    preview.classList.remove('hidden');
    count.classList.remove('hidden');
    count.textContent = totalItems;

    var html = '';
    
    selectedEmails.forEach(function(email, index) {
        html += 
            '<div class="attachment-chip">' +
                '<i class="fas fa-envelope" style="color: var(--primary-500);"></i>' +
                '<span class="name" title="' + escapeHtml(email.subject) + '">' + escapeHtml(email.subject) + '</span>' +
                '<span class="remove" onclick="removeEmail(' + index + ')"><i class="fas fa-times"></i></span>' +
            '</div>';
    });
    
    selectedCalendarEvents.forEach(function(event, index) {
        html += 
            '<div class="attachment-chip">' +
                '<i class="fas fa-calendar" style="color: #8b5cf6;"></i>' +
                '<span class="name" title="' + escapeHtml(event.subject) + '">' + escapeHtml(event.subject) + '</span>' +
                '<span class="remove" onclick="removeCalendarEvent(' + index + ')"><i class="fas fa-times"></i></span>' +
            '</div>';
    });
    
    attachedFiles.forEach(function(file, index) {
        var iconColor = file.source === 'outlook' ? 'var(--primary-500)' : file.source === 'onedrive' ? '#0ea5e9' : 'var(--gray-500)';
        html += 
            '<div class="attachment-chip">' +
                '<i class="fas ' + getFileIcon(file.original_filename) + '" style="color: ' + iconColor + ';"></i>' +
                '<span class="name">' + escapeHtml(file.original_filename) + '</span>' +
                '<span class="remove" onclick="removeAttachment(' + index + ')"><i class="fas fa-times"></i></span>' +
            '</div>';
    });
    
    list.innerHTML = html;
}

function getFileIcon(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    var icons = {
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
    return getFileIcon(filename);
}

function removeAttachment(index) {
    attachedFiles.splice(index, 1);
    updateAttachmentsUI();
}

function removeEmail(index) {
    selectedEmails.splice(index, 1);
    updateAttachmentsUI();
}

function removeCalendarEvent(index) {
    selectedCalendarEvents.splice(index, 1);
    updateAttachmentsUI();
}

function clearAllAttachments() {
    attachedFiles = [];
    selectedEmails = [];
    selectedCalendarEvents = [];
    updateAttachmentsUI();
}

// --- CHAT FUNCTIONS ---

async function sendMessage() {
    var input = document.getElementById('user-input');
    if (!input) return;
    
    var message = input.value.trim();
    
    if (!message && attachedFiles.length === 0 && selectedEmails.length === 0 && selectedCalendarEvents.length === 0) return;

    var displayMessage = message;
    var attachments = [];
    
    if (selectedEmails.length > 0) attachments.push(selectedEmails.length + ' email' + (selectedEmails.length > 1 ? 's' : ''));
    if (selectedCalendarEvents.length > 0) attachments.push(selectedCalendarEvents.length + ' event' + (selectedCalendarEvents.length > 1 ? 's' : ''));
    if (attachedFiles.length > 0) attachments.push(attachedFiles.length + ' file' + (attachedFiles.length > 1 ? 's' : ''));
    
    if (attachments.length > 0) {
        displayMessage = message 
            ? '📎 ' + attachments.join(', ') + '\n\n' + message
            : '📎 Attached: ' + attachments.join(', ');
    }

    addMessage(displayMessage, 'user');
    input.value = '';

    var loadingId = addLoading();

    try {
        var response = await fetch('/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [{ role: 'user', content: message || 'Please analyze the attached content.' }],
                blobs: attachedFiles,
                emails: selectedEmails,
                calendar_events: selectedCalendarEvents
            })
        });

        var data = await response.json();

        if (data.error) {
            removeMessage(loadingId);
            addMessage('Error: ' + data.error, 'system-error');
            return;
        }

        var jobId = data.job_id;
        var result = await pollForResult(jobId);
        
        removeMessage(loadingId);

        if (result.status === 'Complete') {
            addMessage(result.result, 'system', true);
        } else if (result.status === 'Failed') {
            addMessage('Error: ' + result.result, 'system-error');
        } else {
            addMessage('Request timed out. Please try again.', 'system-error');
        }

        clearAllAttachments();

    } catch (error) {
        removeMessage(loadingId);
        addMessage('Failed to connect to server: ' + error.message, 'system-error');
    }
}

async function pollForResult(jobId, maxAttempts, interval) {
    maxAttempts = maxAttempts || 120;
    interval = interval || 1000;
    
    for (var i = 0; i < maxAttempts; i++) {
        try {
            var response = await fetch('/api/check_status/' + jobId);
            var data = await response.json();
            
            if (data.status === 'Complete' || data.status === 'Failed') {
                return data;
            }
            
            await new Promise(function(resolve) { setTimeout(resolve, interval); });
        } catch (error) {
            console.error('Polling error:', error);
        }
    }
    return { status: 'Timeout', result: 'Request timed out' };
}

function addMessage(text, type, isMarkdown) {
    var container = document.getElementById('chat-container');
    if (!container) return;
    
    var div = document.createElement('div');
    
    var messageClass = type === 'user' ? 'message-user' : type === 'system-error' ? 'message-system message-error' : 'message-system';
    div.className = 'message ' + messageClass;
    
    var bubble = document.createElement('div');
    bubble.className = 'message-bubble' + (isMarkdown && type !== 'user' ? ' prose-chat' : '');
    
    if (isMarkdown && type !== 'user') {
        bubble.innerHTML = renderMarkdown(text);
    } else {
        bubble.textContent = text;
    }
    
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    div.id = 'msg-' + Date.now();
    return div.id;
}

function renderMarkdown(text) {
    if (!text) return '';
    
    var html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Code blocks
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // HR
    html = html.replace(/^---$/gm, '<hr>');
    
    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Lists
    html = html.replace(/^[\s]*[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<pre') && !html.startsWith('<blockquote')) {
        html = '<p>' + html + '</p>';
    }
    
    // Cleanup
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
}

function addLoading(customText) {
    var container = document.getElementById('chat-container');
    if (!container) return;
    
    var div = document.createElement('div');
    div.className = 'message message-system';
    div.innerHTML = 
        '<div class="loading-bubble">' +
            '<div class="loading-spinner"></div>' +
            '<span class="loading-text">' + (customText || 'Thinking...') + '</span>' +
        '</div>';
    div.id = 'loading-' + Date.now();
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}

function removeMessage(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
}

// --- UTILITY FUNCTIONS ---

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

console.log('Joogni script fully loaded');
