const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
require('dotenv').config();

// ============================================
// MODULE UPDATER - RUNS ONLY ON FIRST START
// ============================================
async function downloadAndExtractModules() {
    const settingsPath = path.join(__dirname, 'settings.js');
    const modulesInstalledFlag = path.join(__dirname, '.modules_installed');
    
    if (fs.existsSync(modulesInstalledFlag)) {
        console.log('✅ Modules already installed, skipping download');
        return true;
    }
    
    if (!fs.existsSync(settingsPath)) {
        console.log('⚠️ settings.js not found, skipping module update');
        return false;
    }
    
    const settings = require('./settings');
    const zipUrl = settings.updateZipUrl;
    
    if (!zipUrl) {
        console.log('⚠️ No updateZipUrl configured in settings.js');
        return false;
    }

    const TEMP_DIR = path.join(__dirname, 'temp_update');
    const ZIP_FILE = path.join(TEMP_DIR, 'modules.zip');
    const EXTRACT_DIR = path.join(TEMP_DIR, 'extracted');

    console.log('📥 DOWNLOADING MODULES FROM REPOSITORY...');
    try {
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }

        const response = await axios({
            method: 'get',
            url: zipUrl,
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        fs.writeFileSync(ZIP_FILE, response.data);

        if (fs.existsSync(EXTRACT_DIR)) {
            fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(EXTRACT_DIR, { recursive: true });

        execSync(`unzip -o "${ZIP_FILE}" -d "${EXTRACT_DIR}"`, { stdio: 'pipe' });

        const extractedFolders = fs.readdirSync(EXTRACT_DIR);
        const moduleFolder = extractedFolders.find(f => f.includes('ZORO-MD-MODULES') || f.includes('MODULES'));
        
        if (!moduleFolder) return false;

        const sourcePath = path.join(EXTRACT_DIR, moduleFolder);
        const basePath = __dirname;

        const foldersToSync = ['lib', 'plugins', 'data', 'media'];
        const filesToSync = ['main.js', 'config.js'];

        for (const folder of foldersToSync) {
            const sourceFolder = path.join(sourcePath, folder);
            const destFolder = path.join(basePath, folder);
            if (fs.existsSync(sourceFolder)) {
                if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
                fs.cpSync(sourceFolder, destFolder, { recursive: true, force: true });
            }
        }

        for (const file of filesToSync) {
            const sourceFile = path.join(sourcePath, file);
            const destFile = path.join(basePath, file);
            if (fs.existsSync(sourceFile)) {
                fs.copyFileSync(sourceFile, destFile);
            }
        }

        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        fs.writeFileSync(modulesInstalledFlag, new Date().toISOString());
        return true;
    } catch (error) {
        console.error('❌ Error updating modules:', error.message);
        if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        return false;
    }
}

// ============================================
// FFMPEG CHECK AND AUTO-INSTALL
// ============================================
async function checkAndInstallFFmpeg() {
    const ffmpegDir = path.join(__dirname, 'ffmpeg_bin');
    const ffmpegPath = path.join(ffmpegDir, 'ffmpeg');
    const ffprobePath = path.join(ffmpegDir, 'ffprobe');
    
    try {
        execSync('ffmpeg -version', { stdio: 'pipe' });
        return true;
    } catch (error) {}
    
    if (fs.existsSync(ffmpegPath)) {
        process.env.PATH = `${ffmpegDir}:${process.env.PATH}`;
        return true;
    }
    
    try {
        if (!fs.existsSync(ffmpegDir)) fs.mkdirSync(ffmpegDir, { recursive: true });
        const FFMPEG_URL = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
        const tempFile = path.join(__dirname, 'ffmpeg_temp.tar.xz');
        const extractDir = path.join(__dirname, 'ffmpeg_extract');
        
        const response = await axios({ method: 'get', url: FFMPEG_URL, responseType: 'arraybuffer', timeout: 300000 });
        fs.writeFileSync(tempFile, response.data);
        
        if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
        fs.mkdirSync(extractDir, { recursive: true });
        
        execSync(`tar -xf "${tempFile}" -C "${extractDir}"`, { stdio: 'pipe' });
        const extractedFolders = fs.readdirSync(extractDir);
        const ffmpegFolder = extractedFolders.find(f => f.includes('ffmpeg'));
        
        if (ffmpegFolder) {
            const srcFFmpeg = path.join(extractDir, ffmpegFolder, 'ffmpeg');
            const srcFFprobe = path.join(extractDir, ffmpegFolder, 'ffprobe');
            if (fs.existsSync(srcFFmpeg)) {
                fs.copyFileSync(srcFFmpeg, ffmpegPath);
                fs.chmodSync(ffmpegPath, '755');
            }
            if (fs.existsSync(srcFFprobe)) {
                fs.copyFileSync(srcFFprobe, ffprobePath);
                fs.chmodSync(ffprobePath, '755');
            }
        }
        fs.unlinkSync(tempFile);
        fs.rmSync(extractDir, { recursive: true, force: true });
        process.env.PATH = `${ffmpegDir}:${process.env.PATH}`;
        return true;
    } catch (error) {
        return false;
    }
}

// Active Sessions Store
const activeSessions = new Map();

// ============================================
// MAIN BOT STARTUP
// ============================================
async function startBot() {
    await downloadAndExtractModules().catch(() => {});
    await checkAndInstallFFmpeg();

    require('./settings');
    const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
    const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
        jidDecode,
        jidNormalizedUser,
        makeCacheableSignalKeyStore
    } = require("@aadhixd777/baileys");
    const NodeCache = require("node-cache");
    const pino = require("pino");
    const store = require('./lib/lightweight_store');
    
    store.readFromFile();
    const settings = require('./settings');
    setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);

    const express = require('express');
    const app = express();
    const port = process.env.PORT || 8000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Web UI for Multi-Session Pairing
    app.get('/', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Zoro MD Multi-Device Pairing</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); width: 100%; max-width: 400px; text-align: center; }
                    input { width: 80%; padding: 12px; margin: 10px 0; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 16px; }
                    button { background: #22c55e; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-size: 16px; cursor: pointer; width: 85%; font-weight: bold; }
                    button:hover { background: #16a34a; }
                    #code { margin-top: 20px; font-size: 20px; font-weight: bold; color: #4ade80; word-break: break-all; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Zoro MD Pairing</h2>
                    <p style="color: #94a3b8; font-size: 14px;">Enter your WhatsApp number with country code</p>
                    <form id="pairForm">
                        <input type="text" id="phone" placeholder="919876543210" required>
                        <br>
                        <button type="submit" id="submitBtn">Get Pairing Code</button>
                    </form>
                    <div id="code"></div>
                </div>
                <script>
                    document.getElementById('pairForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const phone = document.getElementById('phone').value.trim();
                        const codeDiv = document.getElementById('code');
                        const btn = document.getElementById('submitBtn');
                        
                        codeDiv.innerHTML = "⏳ Generating Pairing Code... Please wait.";
                        btn.disabled = true;
                        
                        try {
                            const res = await fetch('/code?phone=' + phone);
                            const data = await res.json();
                            if (data.code) {
                                codeDiv.innerHTML = "🔑 Code: <br><br><span style='background:#0f172a; padding:10px; border:2px dashed #22c55e; border-radius:6px; display:inline-block; font-size:22px;'>" + data.code + "</span><br><br><small style='color:#4ade80;'>Type this in WhatsApp Linked Devices immediately!</small>";
                            } else {
                                codeDiv.innerHTML = "<span style='color:#ef4444;'>Error: " + (data.error || "Failed") + "</span>";
                            }
                        } catch (err) {
                            codeDiv.innerHTML = "<span style='color:#ef4444;'>Something went wrong! Try again.</span>";
                        } finally {
                            btn.disabled = false;
                        }
                    });
                </script>
            </body>
            </html>
        `);
    });

    // Instant & Stable Pairing Route
    app.get('/code', async (req, res) => {
        let phoneNum = req.query.phone;
        if (!phoneNum) return res.json({ error: "Phone number is required" });
        phoneNum = phoneNum.replace(/[^0-9]/g, '');

        try {
            let sock = await startClientSession(phoneNum);
            
            // Wait until socket is fully ready
            let maxWait = 25;
            while (sock.ws.readyState !== 1 && maxWait > 0) {
                await new Promise(resolve => setTimeout(resolve, 600));
                maxWait--;
            }

            if (sock.ws.readyState !== 1) {
                return res.json({ error: "Connection timeout. Please retry." });
            }

            if (sock.authState && sock.authState.creds && sock.authState.creds.registered) {
                return res.json({ code: "Already Registered & Connected!" });
            }

            let code = await sock.requestPairingCode(phoneNum);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            return res.json({ code: code });
        } catch (error) {
            console.error('Error requesting pairing code:', error);
            return res.json({ error: "Failed to get pairing code. Try again." });
        }
    });

    app.listen(port, () => console.log(`🚀 Multi-Session Web Pairing server running on port ${port}`));

    global.botname = "ZORO BOT";
    global.themeemoji = "•";

    async function startClientSession(sessionIdName) {
        if (activeSessions.has(sessionIdName)) {
            const existingSock = activeSessions.get(sessionIdName);
            if (existingSock.ws && existingSock.ws.readyState === 1) {
                return existingSock;
            }
            activeSessions.delete(sessionIdName);
        }

        let { version } = await fetchLatestBaileysVersion();
        const sessionDir = path.join('./sessions', sessionIdName);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const msgRetryCounterCache = new NodeCache();

        const clientSock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ["Chrome (Linux)", "Chrome", "120.0.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false, // Turned off to speed up immediate connection
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid);
                let msg = await store.loadMessage(jid, key.id);
                return msg?.message || "";
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
        });

        store.bind(clientSock.ev);
        activeSessions.set(sessionIdName, clientSock);

        clientSock.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            } else return jid;
        };

        clientSock.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    await handleStatus(clientSock, chatUpdate);
                    return;
                }
                await handleMessages(clientSock, chatUpdate, true);
            } catch (err) {}
        });

        clientSock.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect } = s;
            if (connection === "open") {
                console.log(`✅ Session successfully linked & connected for: ${sessionIdName}`);
            }
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    try {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    } catch {}
                    activeSessions.delete(sessionIdName);
                } else {
                    setTimeout(() => startClientSession(sessionIdName), 3000);
                }
            }
        });

        clientSock.ev.on('creds.update', saveCreds);
        clientSock.ev.on('group-participants.update', async (update) => {
            await handleGroupParticipantUpdate(clientSock, update);
        });

        return clientSock;
    }

    // Auto restore previous sessions on startup
    if (fs.existsSync('./sessions')) {
        const existingFolders = fs.readdirSync('./sessions');
        for (const folder of existingFolders) {
            const folderPath = path.join('./sessions', folder);
            if (fs.statSync(folderPath).isDirectory()) {
                console.log(`📂 Restoring session for: ${folder}`);
                startClientSession(folder).catch(() => {});
            }
        }
    }
}

startBot().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

process.on('uncaughtException', (err) => {});
process.on('unhandledRejection', (err) => {});
