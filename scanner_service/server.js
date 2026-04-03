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

// Middleware
app.use(cors());
app.use(express.json());

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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
    const command = `"${NAPS2_PATH}" --driver wia --device "HP AIO Scanner" --source Feeder -o "${outputPath}" -f -v`;

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
