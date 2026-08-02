'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const WIKI_DIR = path.join(__dirname, '../../wiki');

// GET /api/wiki/list - Dynamically scan wiki/ directory on the fly with anti-caching headers
router.get('/list', (req, res) => {
    try {
        // Prevent browser / HTTP caching so added/deleted files reflect instantly
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        if (!fs.existsSync(WIKI_DIR)) {
            fs.mkdirSync(WIKI_DIR, { recursive: true });
        }

        const files = fs.readdirSync(WIKI_DIR);
        const htmlFiles = files.filter(f => f.endsWith('.html') || f.endsWith('.htm'));

        const wikis = htmlFiles.map(filename => {
            const filePath = path.join(WIKI_DIR, filename);
            const stats = fs.statSync(filePath);
            const lowerName = filename.toLowerCase();

            // Default title from filename
            let title = filename.replace(/\.(html|htm)$/i, '').replace(/[-_]/g, ' ');
            title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            let subtitle = 'Interactive Knowledge Base';

            try {
                // Read initial snippet to look for <title> and <meta name="description">
                const buffer = Buffer.alloc(4096);
                const fd = fs.openSync(filePath, 'r');
                const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
                fs.closeSync(fd);
                const snippet = buffer.toString('utf8', 0, bytesRead);
                
                const titleMatch = snippet.match(/<title>([^<]+)<\/title>/i);
                if (titleMatch && titleMatch[1].trim()) {
                    let parsedTitle = titleMatch[1].trim();
                    parsedTitle = parsedTitle.replace(/\s*[—|-]\s*TiddlyWiki.*$/i, '');
                    if (parsedTitle) title = parsedTitle;
                }

                const descMatch = snippet.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
                if (descMatch && descMatch[1].trim()) {
                    subtitle = descMatch[1].trim();
                }
            } catch (e) {}

            // Assign icons based on name/title
            let icon = '📄';
            if (lowerName.includes('ipie') || lowerName.includes('gateway')) icon = '⚡';
            else if (lowerName.includes('agent') || lowerName.includes('workflow')) icon = '🤖';
            else if (lowerName.includes('vault') || lowerName.includes('law')) icon = '📚';
            else if (lowerName.includes('report') || lowerName.includes('audit')) icon = '📊';

            return {
                filename,
                path: `wiki/${filename}`,
                title,
                subtitle,
                icon,
                mtime: stats.mtime
            };
        });

        // Sort: ipie.html first, then alphabetical by title
        wikis.sort((a, b) => {
            if (a.filename === 'ipie.html') return -1;
            if (b.filename === 'ipie.html') return 1;
            return a.title.localeCompare(b.title);
        });

        res.json({ success: true, count: wikis.length, wikis });
    } catch (e) {
        res.status(500).json({ error: 'Failed to scan wiki directory: ' + e.message });
    }
});

module.exports = router;
