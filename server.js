const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');
const helmet = require('helmet');
const sanitize = require('sanitize-filename');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

        // Get video info using youtube-dl-exec
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            format: 'best'
        });

        res.json({
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            author: info.uploader,
            viewCount: info.view_count
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

        // Get video info first for the title
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true
        });
        
        // Sanitize filename
        const title = sanitize(info.title);
        const filename = `${title}.%(ext)s`;

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        console.log(`Downloading video with quality preference: ${quality}`);
        
        // Define format based on quality preference
        let format;
        if (quality === 'lowest') {
            format = 'worst[ext=mp4]/worst';
        } else {
            format = 'best[ext=mp4]/best';
        }
        
        // Stream the video directly to response
        const videoStream = youtubedl.exec(url, {
            format: format,
            output: '-', // Output to stdout
            noCheckCertificates: true,
            noWarnings: true
        });

        videoStream.stdout.pipe(res);

        videoStream.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Download failed' });
            }
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

        // Get available formats using youtube-dl-exec
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            listFormats: true,
            noCheckCertificates: true,
            noWarnings: true
        });

        const availableFormats = info.formats?.map((format, index) => ({
            index: index,
            quality: format.format_note || format.height + 'p' || 'unknown',
            container: format.ext,
            hasAudio: format.acodec && format.acodec !== 'none',
            hasVideo: format.vcodec && format.vcodec !== 'none',
            filesize: format.filesize
        })) || [];

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