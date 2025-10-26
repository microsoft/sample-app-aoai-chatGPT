const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const suggestedPrompts = document.getElementById('suggested-prompts');
const jurisdictionSelect = document.getElementById('jurisdiction-select');
let typingIndicator; // To keep track of the indicator element
let currentConversationId = null; // To store the current conversation ID
let messageHistory = []; // To store message history for the backend

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    adjustInputHeight();
    updateSendButtonState();
    initializeTypingIndicator(); // Prepare indicator element
    addEventListeners();
    // Optional: Load chat history or start new conversation
    // startNewConversation(); 
});

// --- Event Listeners ---
function addEventListeners() {
    userInput.addEventListener('input', () => {
        adjustInputHeight();
        updateSendButtonState();
    });

    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    suggestedPrompts.addEventListener('click', (event) => {
        if (event.target.classList.contains('prompt-btn')) {
            userInput.value = event.target.textContent;
            userInput.focus();
            adjustInputHeight();
            updateSendButtonState();
            // Optional: Immediately send the prompt
            // sendMessage();
        }
    });

    // Event delegation for copy/feedback buttons
    chatMessages.addEventListener('click', (event) => {
        const target = event.target.closest('button'); // Find the closest button clicked
        if (!target) return;

        const messageDiv = target.closest('.message.bot');
        if (!messageDiv) return;

        if (target.classList.contains('copy-btn')) {
            copyMessageToClipboard(messageDiv);
        } else if (target.classList.contains('feedback-btn')) {
            handleFeedback(target);
        }
    });
}

// --- Core Functions ---
// *** UPDATED sendMessage Function ***
async function sendMessage() {
    const messageText = userInput.value.trim();
    const selectedJurisdiction = jurisdictionSelect.value; // Get selected jurisdiction

    if (messageText) {
        displayMessage(messageText, 'user'); // Display user message immediately
        userInput.value = '';
        adjustInputHeight();
        updateSendButtonState();
        showTypingIndicator();

        // Add user message to local history
        // Prepend jurisdiction context to the user message content
        const currentMessage = { role: 'user', content: `(Jurisdiction: ${selectedJurisdiction}) ${messageText}` };
        messageHistory.push(currentMessage);

        const requestBody = {
            messages: messageHistory,
            conversation_id: currentConversationId // Pass current conversation ID (can be null)
            // stream: false // Explicitly ask for non-streaming? Backend seems to handle it.
        };

        console.log("Sending request to /history/generate (or /conversation):", JSON.stringify(requestBody, null, 2)); // Log the request

        try {
            // Call your backend API endpoint. 
            // The original app uses /history/generate to *start* or *continue* a conversation (it includes the call to conversation_internal)
            // Let's use that, as it handles history creation.
            const response = await fetch('/history/generate', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            hideTypingIndicator();

            if (!response.ok) {
                // Display error message from backend if possible
                let errorText = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorText = errorData.error || response.statusText;
                } catch (e) {
                    console.error("Could not parse error response JSON:", e);
                }
                displayMessage(`Error: ${errorText}`, 'bot');
                console.error("API Error:", response.status, errorText);
                messageHistory.pop(); // Remove user message from history if API call failed
                return;
            }

            // Handle the response from the backend
            const responseData = await response.json();
            console.log("Received response from backend:", responseData); // Log the response

            // Assuming responseData structure based on the Python backend:
            // { id: "...", choices: [ { message: { role: "assistant", content: "...", context: { citations: [...] } } } ], ... }
            let botText = "Sorry, I couldn't get a valid response.";
            let sources = [];
            let responseMessageId = Date.now().toString(); // Use timestamp as fallback ID
            let botMessage = {};

            if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
               const message = responseData.choices[0].message;
               botText = message.content || botText;
               responseMessageId = responseData.id || responseMessageId; // Use ID from response if available

               // Add bot response to local history
               botMessage = { role: 'assistant', content: botText, id: responseMessageId };
               
               // Extract sources if backend provides them in the expected format
               if (message.context && message.context.citations) {
                   sources = message.context.citations.map(cit => ({
                       title: cit.title || cit.filepath || cit.url || 'Unknown Source', // Adjust based on backend format
                       url: cit.url || '#'
                   }));
                   // Add context to bot message for history (if needed, though backend might re-add)
                   botMessage.context = message.context;
               }
            } else if (responseData.error) {
                 botText = `Error from backend: ${responseData.error}`;
                 botMessage = { role: 'assistant', content: botText, id: responseMessageId };
            }
            
            messageHistory.push(botMessage); // Add bot's response to history
            
            // Update conversation ID if it was just created
            if (responseData.history_metadata && responseData.history_metadata.conversation_id) {
                currentConversationId = responseData.history_metadata.conversation_id;
                console.log("Started new conversation, ID:", currentConversationId);
            }

            displayMessage({ id: responseMessageId, text: botText, sources: sources }, 'bot'); // Display response with sources

        } catch (error) {
            hideTypingIndicator();
            const errorText = `Error calling backend: ${error.message}`;
            displayMessage(errorText, 'bot');
            console.error('Fetch Error:', error);
            messageHistory.pop(); // Remove user message from history if fetch failed
        }
    }
}
// *** END UPDATED sendMessage Function ***

// Enhanced displayMessage function
function displayMessage(data, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type);
    // Use ID from data if available (for assistant messages), otherwise generate one
    const messageId = (type === 'bot' && data.id) ? data.id : Date.now();
    messageDiv.dataset.messageId = messageId; // Set data-message-id attribute

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    let messageText = '';
    let sources = [];

    // Check if data is an object with text and sources, or just text
    if (typeof data === 'object' && data !== null && data.text) {
        messageText = data.text;
        sources = data.sources || []; // Get sources array, default to empty
    } else if (typeof data === 'string') {
        messageText = data;
    } else {
        messageText = "Received unexpected data format."; // Fallback
    }

    // Basic markdown support + link inline citations to source list below
    // Escape HTML potentially in messageText before adding markdown
    const escapedText = messageText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    contentDiv.innerHTML = escapedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italics
        .replace(/\[(\d+)\]/g, `<a href="#source-$1-${messageId}" onclick="scrollToSource('source-$1-${messageId}')" class="citation-marker">[$1]</a>`); // Link to source ID


    // Add sources section if sources exist
    if (type === 'bot' && sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.classList.add('message-sources');
        let sourcesListHtml = '<small>Sources:</small><ol>';
        sources.forEach((source, index) => {
            // Assume source is an object like { url: "...", title: "..." }
            const sourceNum = index + 1;
            // Escape title to prevent XSS
            const title = (source.title || source.url || `Source ${sourceNum}`).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const url = source.url || '#';
            // Add ID to list item for linking
            sourcesListHtml += `<li id="source-${sourceNum}-${messageId}"><a href="${url}" target="_blank" title="${title}"> ${title}</a></li>`;
        });
        sourcesListHtml += '</ol>';
        sourcesDiv.innerHTML = sourcesListHtml;
        contentDiv.appendChild(sourcesDiv); // Append sources inside the content bubble
    }

    messageDiv.appendChild(contentDiv);

    // Add action buttons for bot messages
    if (type === 'bot' && !messageText.startsWith("Error:")) { // Don't add actions to error messages
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');
        actionsDiv.innerHTML = `
            <button class="action-btn copy-btn" title="Copy"><i class="far fa-copy"></i></button>
            <button class="action-btn feedback-btn good" title="Good response"><i class="far fa-thumbs-up"></i></button>
            <button class="action-btn feedback-btn bad" title="Bad response"><i class="far fa-thumbs-down"></i></button>
        `;
        messageDiv.appendChild(actionsDiv);
    }

    // Insert message
    if (typingIndicator && typingIndicator.parentNode === chatMessages) {
        chatMessages.insertBefore(messageDiv, typingIndicator);
    } else {
        chatMessages.appendChild(messageDiv);
    }

    scrollToBottom(false); // Don't use smooth scroll initially if many messages load
    // Use smooth scroll after a slight delay to ensure layout is complete
    setTimeout(() => scrollToBottom(true), 50);
}


// --- Typing Indicator ---
function initializeTypingIndicator() {
    typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message', 'bot', 'typing-indicator');
    typingIndicator.innerHTML = `<div class="message-content"><span>.</span><span>.</span><span>.</span></div>`;
    typingIndicator.style.display = 'none'; // Initially hidden
    chatMessages.appendChild(typingIndicator);
}

function showTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.display = 'flex'; // Use flex for alignment
        scrollToBottom(true);
    }
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

// --- Input Area Helpers ---
function adjustInputHeight() {
    userInput.style.height = 'auto'; // Reset height to recalculate scrollHeight
    let newHeight = userInput.scrollHeight;
    // Consider max-height defined in CSS
    const maxHeight = parseInt(window.getComputedStyle(userInput).maxHeight, 10);
    if (maxHeight && newHeight > maxHeight) {
        newHeight = maxHeight;
        userInput.style.overflowY = 'auto'; // Show scrollbar if max height reached
    } else {
        userInput.style.overflowY = 'hidden'; // Hide scrollbar if not needed
    }
    // Add a small buffer only if not at max height to prevent scrollbar flicker
    const buffer = (newHeight < maxHeight) ? 2 : 0;
    userInput.style.height = (newHeight + buffer) + 'px';
}


function updateSendButtonState() {
    sendButton.disabled = userInput.value.trim() === '';
}

function scrollToBottom(smooth = true) {
    // Scroll smoothly to the bottom
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

// Helper function to scroll to a specific source when citation is clicked
function scrollToSource(sourceId) {
    const sourceElement = document.getElementById(sourceId);
    if (sourceElement) {
        sourceElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Optional: Add a temporary highlight effect
        sourceElement.style.transition = 'background-color 0.5s ease';
        sourceElement.style.backgroundColor = 'rgba(0, 90, 156, 0.1)'; // Light blue highlight
        setTimeout(() => {
            sourceElement.style.backgroundColor = ''; // Remove highlight
        }, 1500);
    }
}

// --- Action Button Handlers ---
function copyMessageToClipboard(messageDiv) {
    // Try to copy only the main text, excluding sources if present
    let textToCopy = '';
    const contentDiv = messageDiv.querySelector('.message-content');
    if (!contentDiv) return;

    const contentChildren = Array.from(contentDiv.childNodes);
    contentChildren.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            textToCopy += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('message-sources')) {
            // Include text from elements like <strong> or <em>, but skip the sources div
             textToCopy += node.textContent || node.innerText; // Handle potential differences
        }
    });
     textToCopy = textToCopy.trim(); // Clean up extra whitespace

    if (textToCopy && navigator.clipboard) { // Check if clipboard API is available
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const copyBtn = messageDiv.querySelector('.copy-btn');
                if (copyBtn) {
                   const originalIcon = copyBtn.innerHTML;
                   copyBtn.innerHTML = '<i class="fas fa-check"></i>'; // Checkmark
                   copyBtn.disabled = true; // Briefly disable
                   setTimeout(() => {
                       copyBtn.innerHTML = originalIcon;
                       copyBtn.disabled = false;
                    }, 1500);
                }
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy text.'); // Simple error feedback
            });
    } else if (!navigator.clipboard) {
         console.warn("Clipboard API not available.");
         alert("Copying to clipboard is not supported in this browser or context.");
    } else {
         console.warn("No text content found to copy, excluding sources.");
    }
}

async function handleFeedback(button) {
    const messageDiv = button.closest('.message.bot');
    if (!messageDiv || !messageDiv.dataset.messageId) {
        console.error("Feedback button clicked, but message ID not found.");
        return;
    }

    const messageId = messageDiv.dataset.messageId;
    // Map feedback to "like" or "dislike" as expected by the backend
    const feedbackType = button.classList.contains('good') ? 'like' : 'dislike';
    console.log(`Feedback received: ${feedbackType} for message ${messageId}`); // Placeholder

    // --- Send feedback (messageId, feedbackType) to the backend ---
    try {
         // Use the correct backend route /history/message_feedback
         const response = await fetch('/history/message_feedback', { 
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json'
             },
             body: JSON.stringify({
                 message_id: messageId,
                 message_feedback: feedbackType
             })
         });

         if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             console.error(`Failed to submit feedback: ${response.status}`, errorData);
             alert(`Failed to submit feedback: ${errorData.error || response.statusText}`);
             return; // Don't disable buttons if feedback failed
         }

         // Visual feedback: Highlight selected, disable others ONLY on success
         const actionsDiv = button.closest('.message-actions');
         const feedbackButtons = actionsDiv.querySelectorAll('.feedback-btn');
         feedbackButtons.forEach(btn => {
             btn.disabled = true; // Disable all feedback buttons
             btn.style.opacity = '0.5'; // Dim disabled buttons
             btn.style.cursor = 'default';
         });
         // Highlight the clicked one
         button.style.opacity = '1';
         button.style.color = feedbackType === 'like' ? '#198754' : '#dc3545'; // Green for good, Red for bad

     } catch (error) {
         console.error('Error sending feedback:', error);
         alert(`Error sending feedback: ${error.message}`);
     }
}
