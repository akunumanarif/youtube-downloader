const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const sanitize = require('sanitize-filename');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for simplicity
}));

// CORS middleware
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Utility function to validate YouTube URL
function isValidYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=)[\w-]+/,
        /^(https?:\/\/)?(www\.)?(youtu\.be\/)[\w-]+/,
        /^(https?:\/\/)?(m\.)?(youtube\.com\/watch\?v=)[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Route to get video information
app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ error: 'Could not extract video ID' });
        }

        // Note: This is a simplified implementation
        // In a production App Engine environment, you might want to use:
        // 1. YouTube Data API v3 (requires API key)
        // 2. A microservice that handles youtube-dl operations
        // 3. Cloud Functions for the heavy lifting

        res.json({
            title: 'Video Title (Demo Mode)',
            duration: 180,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            author: 'Channel Name',
            viewCount: '1000000',
            note: 'This is demo mode. For full functionality, implement YouTube Data API v3 or use a microservice approach.'
        });

    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).json({ error: 'Failed to fetch video information' });
    }
});

// Route to download video
app.post('/api/download', async (req, res) => {
    try {
        const { url, quality } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // For App Engine deployment, direct video downloading is complex
        // due to youtube-dl binary requirements and serverless limitations
        
        res.status(501).json({ 
            error: 'Download functionality requires additional setup for App Engine deployment. See README for microservice approach.',
            suggestion: 'Consider using Cloud Functions or a separate compute instance for video processing.'
        });

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download video' });
        }
    }
});

// Route to get available formats
app.post('/api/formats', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Demo formats
        const availableFormats = [
            {
                index: 0,
                quality: 'HD 1080p',
                container: 'mp4',
                hasAudio: true,
                hasVideo: true,
                filesize: '100MB (estimated)'
            },
            {
                index: 1,
                quality: 'HD 720p',
                container: 'mp4',
                hasAudio: true,
                hasVideo: true,
                filesize: '50MB (estimated)'
            }
        ];

        res.json(availableFormats);

    } catch (error) {
        console.error('Error fetching formats:', error);
        res.status(500).json({ error: 'Failed to fetch video formats' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`YouTube Downloader server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});

module.exports = app;