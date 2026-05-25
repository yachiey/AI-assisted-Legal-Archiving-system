const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = 3000;

// NAPS2 Console Path - Standard Installation
// Note: We use the raw string here, and will add quotes when building the command string
const NAPS2_PATH = 'C:\\Program Files\\NAPS2\\NAPS2.Console.exe';
const OUTPUT_DIR = path.join(__dirname, 'scans');
const CONFIG_PATH = path.join(__dirname, 'scanner_config.json');
const DEFAULT_DEVICE = 'HP AIO Scanner';
const DEFAULT_DRIVER = 'wia';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ---------------------------------------------------------
// Helpers: read/write the selected-scanner config file
// ---------------------------------------------------------
function readScannerConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
            const parsed = JSON.parse(raw);
            return {
                device: typeof parsed.device === 'string' && parsed.device ? parsed.device : DEFAULT_DEVICE,
                driver: typeof parsed.driver === 'string' && parsed.driver ? parsed.driver : DEFAULT_DRIVER,
            };
        }
    } catch (e) {
        console.warn('Failed to read scanner_config.json, using defaults:', e.message);
    }
    return { device: DEFAULT_DEVICE, driver: DEFAULT_DRIVER };
}

function writeScannerConfig(cfg) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

// Startup Check
if (!fs.existsSync(NAPS2_PATH)) {
    console.warn(`\n⚠️  WARNING: NAPS2 Console not found at: ${NAPS2_PATH}`);
    console.warn('   Please install NAPS2 or update the path in server.js\n');
}

// ---------------------------------------------------------
// POST /scan
// Trigger the scanner via CLI, output to file, then upload
// ---------------------------------------------------------
app.post('/scan', async (req, res) => {
    console.log('--- Received Scan Request ---');

    // 1. Verify NAPS2 Executable exists
    if (!fs.existsSync(NAPS2_PATH)) {
        console.error('NAPS2 Executable not found');
        return res.status(500).json({
            success: false,
            message: 'NAPS2 software not detected.',
            details: `Executable missing at: ${NAPS2_PATH}. Please install NAPS2.`
        });
    }

    const timestamp = Date.now();
    const filename = `scan_${timestamp}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    // Build Command
    // --driver wia : Use Windows Image Acquisition driver (Confirmed working for this device)
    // --device     : Specify the scanner device ("HP AIO Scanner" found via listdevices)
    // --source     : Use Feeder (ADF) instead of Flatbed
    // -o <path>    : Output file path
    // -f           : Force overwrite
    // -v           : Verbose output
    // Note: We wrap paths in quotes to handle spaces
    const { device, driver } = readScannerConfig();
    // Escape any double-quotes in the device name to keep the shell command well-formed.
    const safeDevice = device.replace(/"/g, '\\"');
    const command = `"${NAPS2_PATH}" --driver ${driver} --device "${safeDevice}" --source Feeder -o "${outputPath}" -f -v`;

    console.log(`Executing: ${command}`);

    // Execute NAPS2 Console
    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error('NAPS2 Execution Error:', error.message);

            const errorDetails = stderr || error.message;
            let userMessage = 'Scanner execution failed.';

            // Common NAPS2 error patterns
            if (errorDetails.includes('No profiles')) {
                userMessage = 'No scan profiles found. Please open NAPS2 and create a profile.';
            } else if (errorDetails.includes('No device')) {
                userMessage = 'No scanner device detected or profiles are invalid.';
            }

            return res.status(500).json({
                success: false,
                message: userMessage,
                details: errorDetails,
                stderr: stderr
            });
        }

        console.log('NAPS2 Output:', stdout);
        console.log('Scan generated at:', outputPath);

        // Verify file exists
        if (!fs.existsSync(outputPath)) {
            return res.status(500).json({
                success: false,
                message: 'Scan command finished but NO file was generated.',
                details: 'Check if the scanner actually scanned a page.'
            });
        }

        // Upload to Main Application (Laravel)
        try {
            console.log('Uploading to backend...');
            const formData = new FormData();
            formData.append('file', fs.createReadStream(outputPath));

            // Reads LARAVEL_URL from .env file — change this when hosted
            const API_URL = `${process.env.LARAVEL_URL || 'http://127.0.0.1:8000'}/api/scanner/upload`;

            const uploadResponse = await axios.post(API_URL, formData, {
                headers: { ...formData.getHeaders() },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            console.log('Upload Successful!', uploadResponse.data);

            // Optional: Cleanup local file
            // fs.unlinkSync(outputPath); // Uncomment to delete local copy

            res.json({
                success: true,
                message: 'Scan and upload complete',
                backendResponse: uploadResponse.data
            });

        } catch (uploadError) {
            console.error('Upload Error:', uploadError.message);
            res.status(502).json({
                success: false,
                message: 'Scan succeeded, but upload to backend failed.',
                error: uploadError.message
            });
        }
    });
});

// ---------------------------------------------------------
// GET /devices
// List scanners connected to this PC via NAPS2 --listdevices.
// Accepts an optional ?driver=wia|twain query (default: wia).
// ---------------------------------------------------------
app.get('/devices', (req, res) => {
    if (!fs.existsSync(NAPS2_PATH)) {
        return res.status(500).json({
            success: false,
            message: 'NAPS2 software not detected.',
            details: `Executable missing at: ${NAPS2_PATH}. Please install NAPS2.`,
        });
    }

    const driver = (req.query.driver && /^[a-zA-Z]+$/.test(req.query.driver))
        ? req.query.driver
        : DEFAULT_DRIVER;

    const command = `"${NAPS2_PATH}" --driver ${driver} --listdevices`;
    console.log(`Executing: ${command}`);

    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
            console.error('NAPS2 listdevices error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to enumerate scanners.',
                details: stderr || error.message,
            });
        }

        const devices = (stdout || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        res.json({
            success: true,
            driver,
            devices,
            current: readScannerConfig(),
        });
    });
});

// ---------------------------------------------------------
// GET /config
// Return the currently selected scanner.
// ---------------------------------------------------------
app.get('/config', (req, res) => {
    res.json({ success: true, config: readScannerConfig() });
});

// ---------------------------------------------------------
// POST /config
// Persist the selected scanner. Body: { device: string, driver?: string }
// ---------------------------------------------------------
app.post('/config', (req, res) => {
    const { device, driver } = req.body || {};

    if (typeof device !== 'string' || !device.trim()) {
        return res.status(400).json({ success: false, message: 'device is required.' });
    }

    const cfg = {
        device: device.trim(),
        driver: (typeof driver === 'string' && /^[a-zA-Z]+$/.test(driver)) ? driver : DEFAULT_DRIVER,
    };

    try {
        writeScannerConfig(cfg);
        res.json({ success: true, config: cfg });
    } catch (e) {
        console.error('Failed to write scanner_config.json:', e.message);
        res.status(500).json({ success: false, message: 'Failed to save scanner config.', details: e.message });
    }
});

// Root Route for friendly verification
app.get('/', (req, res) => {
    const isInstalled = fs.existsSync(NAPS2_PATH);
    const statusColor = isInstalled ? '#16a34a' : '#dc2626';
    const statusText = isInstalled ? 'Ready to Scan' : 'NAPS2 Missing';

    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: ${statusColor};">Scanner Bridge Service</h1>
            <h2 style="color: #4b5563;">Status: ${statusText}</h2>
            
            <div style="margin: 20px auto; max-w-lg; text-align: left; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p><strong>Configured Path:</strong> ${NAPS2_PATH}</p>
                <p><strong>Found:</strong> ${isInstalled ? '✅ Yes' : '❌ NO'}</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <p>If "Found" is NO:
                <ol>
                    <li>Install NAPS2 from naps2.com</li>
                    <li>Or edit <code>server.js</code> with the correct path.</li>
                </ol>
                </p>
            </div>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`\n✅ Scanner Bridge Service running at http://localhost:${PORT}`);
    if (!fs.existsSync(NAPS2_PATH)) {
        console.warn(`❌ ERROR: NAPS2 not found at ${NAPS2_PATH}`);
    } else {
        console.log(`   NAPS2 detected at configured path.`);
    }
});
