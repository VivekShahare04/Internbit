require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());



// Enhanced channel joining with retries
async function joinChannel(channelId, attempt = 1) {
    try {
        const response = await axios.post('https://slack.com/api/conversations.join', 
            { channel: channelId },
            { headers: { Authorization: `Bearer ${process.env.SLACK_TOKEN}` } }
        );

        if (!response.data.ok && attempt < 3) {
            console.log(`Retrying join for channel ${channelId} (attempt ${attempt})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return joinChannel(channelId, attempt + 1);
        }
        return response.data.ok;
    } catch (error) {
        console.error(`Join failed for ${channelId}:`, error.response?.data?.error || error.message);
        return false;
    }
}

// Get only accessible channels
app.get('/channels', async (req, res) => {
    try {
        // Only return channels where is_member=true
        res.json([
            { id: "C12345678", name: "all-slack-messenger-demo" }, // Replace with actual ID
            { id: "C87654321", name: "random" } // Replace with actual ID
        ]);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

app.post('/send-message', async (req, res) => {
    const { channel, message } = req.body;
    const ALLOWED_CHANNELS = ["C12345678", "C87654321"]; // Actual channel IDs

    if (!ALLOWED_CHANNELS.includes(channel)) {
        return res.json({ 
            success: false, 
            error: 'Bot can only post to #all-slack-messenger-demo and #random' 
        });
    }

    try {
        const response = await axios.post(
            'https://slack.com/api/chat.postMessage',
            {
                channel,
                text: message,
                unfurl_links: true,
                unfurl_media: true
            },
            { headers: { Authorization: `Bearer ${process.env.SLACK_TOKEN}` } }
        );

        res.json({ success: response.data.ok });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.response?.data?.error || 'Failed to send message' 
        });
    }
});

// Enhanced message sending
app.post('/send-message', async (req, res) => {
    const { channel, message } = req.body;
    
    if (!channel || !message) {
        return res.status(400).json({ 
            success: false, 
            error: 'Channel and message are required' 
        });
    }

    try {
        // Verify channel membership first
        await joinChannel(channel);
        
        const response = await axios.post(
            'https://slack.com/api/chat.postMessage',
            {
                channel,
                text: message,
                as_user: true
            },
            { headers: { Authorization: `Bearer ${process.env.SLACK_TOKEN}` } }
        );

        if (!response.data.ok) {
            throw new Error(response.data.error);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Message send error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to send message'
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Ensure these scopes are enabled:');
    console.log('- channels:read');
    console.log('- channels:write');
    console.log('- chat:write');
});