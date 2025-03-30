document.addEventListener('DOMContentLoaded', () => {
    const channelSelect = document.getElementById('channel-select');
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('send-button');
    const statusDiv = document.getElementById('status');

    // Improved channel loading with retries
    async function loadChannels() {
        const channelSelect = document.getElementById('channel-select');
        channelSelect.innerHTML = '<option value="">Loading available channels...</option>';
    
        try {
            const response = await fetch('/channels');
            const channels = await response.json();
            
            channelSelect.innerHTML = `
                <option value="">Select a channel (2 available)</option>
                ${channels.map(ch => `
                    <option value="${ch.id}">
                        #${ch.name} ✅
                    </option>
                `).join('')}
            `;
            
        } catch (error) {
            channelSelect.innerHTML = `
                <option value="">Error loading channels</option>
                <option value="C12345678">#all-slack-messenger-demo (fallback)</option>
                <option value="C87654321">#random (fallback)</option>
            `;
        }
    }

    // Enhanced message sending
    async function sendMessage() {
        const channelId = channelSelect.value;
        const message = messageInput.value.trim();
        
        if (!channelId) return showStatus('Please select a channel', 'error');
        if (!message) return showStatus('Please enter a message', 'error');
        
        showStatus('Sending...', 'info');
        
        try {
            const response = await fetch('/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel: channelId, message })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showStatus('✓ Sent successfully!', 'success');
                messageInput.value = '';
            } else {
                showStatus(`Failed: ${result.error}`, 'error');
            }
        } catch (error) {
            showStatus('Network error - try again', 'error');
            console.error('Send error:', error);
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
        statusDiv.style.display = 'block';
        if (type !== 'info') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }, 3000);
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    loadChannels();
    
    // Refresh channels every 2 minutes
    setInterval(loadChannels, 120000);
});