const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const suggestedPrompts = document.getElementById('suggested-prompts');
const jurisdictionSelect = document.getElementById('jurisdiction-select');
let typingIndicator; // To keep track of the indicator element

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    adjustInputHeight();
    updateSendButtonState();
    initializeTypingIndicator(); // Prepare indicator element
    addEventListeners();
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
        displayMessage(messageText, 'user');
        userInput.value = '';
        adjustInputHeight();
        updateSendButtonState();
        showTypingIndicator();

        // --- Send messageText AND selectedJurisdiction to the backend API ---
        // Construct message history (basic example, adjust if needed)
        const history = Array.from(chatMessages.querySelectorAll('.message:not(.typing-indicator)')).map(msg => {
            const role = msg.classList.contains('user') ? 'user' : 'assistant';
            let content = '';
            // Extract text content, excluding sources and actions
            const contentDiv = msg.querySelector('.message-content');
            if (contentDiv) {
                content = Array.from(contentDiv.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('message-sources')))
                    .map(node => node.textContent)
                    .join('')
                    .trim();
            }
            // Add ID if it's a bot message (needed for history update)
            const messageData = { role, content };
            if (role === 'assistant' && msg.dataset.messageId) {
                 messageData.id = msg.dataset.messageId; // Include ID for assistant messages
                 // You might also need context if your backend uses it for history
                 // const contextNode = contentDiv.querySelector('.message-sources');
                 // if (contextNode) messageData.context = { citations: [...] }; // Reconstruct if needed
            }
            return messageData;
        }).filter(msg => msg.content); // Filter out messages without content

        // Add the new user message to the history being sent
        // Prepend jurisdiction context to the user message content
        const currentMessage = { role: 'user', content: `(Jurisdiction: ${selectedJurisdiction}) ${messageText}` };
        history.push(currentMessage);

        const requestBody = {
            messages: history
            // Add other parameters your backend might expect, e.g., conversation_id
            // conversation_id: currentConversationId // Example if you implement conversation tracking
        };

        console.log("Sending request to /conversation:", JSON.stringify(requestBody, null, 2)); // Log the request

        try {
            // Call your backend API endpoint (usually /conversation)
            const response = await fetch('/conversation', { // Assumes backend API route is /conversation
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
                return;
            }

            // Handle the response from the backend
            const responseData = await response.json();
            console.log("Received response from /conversation:", responseData); // Log the response

            // Assuming responseData structure based on the Python backend:
            // { choices: [ { message: { content: "...", context: { citations: [...] } } } ] }
            let botText = "Sorry, I couldn't get a valid response.";
            let sources = [];
            let responseMessageId = Date.now().toString(); // Use timestamp as fallback ID

            if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
               botText = responseData.choices[0].message.content || botText;
               responseMessageId = responseData.id || responseMessageId; // Use ID from response if available

               // Extract sources if backend provides them in the expected format
               if (responseData.choices[0].message.context && responseData.choices[0].message.context.citations) {
                   sources = responseData.choices[0].message.context.citations.map(cit => ({
                       title: cit.title || cit.filepath || cit.url || 'Unknown Source', // Adjust based on backend format
                       url: cit.url || '#'
                   }));
               }
            } else if (responseData.error) {
                 botText = `Error from backend: ${responseData.error}`;
            }

            displayMessage({ id: responseMessageId, text: botText, sources: sources }, 'bot'); // Display response with sources

        } catch (error) {
            hideTypingIndicator();
            displayMessage(`Error calling backend: ${error.message}`, 'bot');
            console.error('Fetch Error:', error);
        }
    }
}
// *** END UPDATED sendMessage Function ***

// Enhanced displayMessage function
function displayMessage(
