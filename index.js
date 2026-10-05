const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Express App Initialization
const app = express();
const port = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());

// Main Web Status Route
app.get('/', (req, res) => res.json({ status: true, message: "Zoro-MD Bot & Multi-Session Pairing Engine Active!" }));

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
        console.log('✅ DOWNLOAD COMPLETE!');

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
            if (fs.existsSync(sourceFile)) fs.copyFileSync(sourceFile, destFile);
        }

        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        fs.writeFileSync(modulesInstalledFlag, new Date().toISOString());
        console.log('🎉 MODULES UPDATED SUCCESSFULLY!');
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
    console.log('🎬 CHECKING FFMPEG INSTALLATION...');
    const ffmpegDir = path.join(__dirname, 'ffmpeg_bin');
    const ffmpegPath = path.join(ffmpegDir, 'ffmpeg');
    const ffprobePath = path.join(ffmpegDir, 'ffprobe');
    
    try {
        const result = execSync('ffmpeg -version', { stdio: 'pipe', encoding: 'utf8' });
        console.log(`✅ FFMPEG FOUND IN SYSTEM`);
        return true;
    } catch (error) {
        console.log('⚠️ FFmpeg not found in system PATH');
    }
    
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
            if (fs.existsSync(srcFFmpeg)) { fs.copyFileSync(srcFFmpeg, ffmpegPath); fs.chmodSync(ffmpegPath, '755'); }
            if (fs.existsSync(srcFFprobe)) { fs.copyFileSync(srcFFprobe, ffprobePath); fs.chmodSync(ffprobePath, '755'); }
        }
        
        fs.unlinkSync(tempFile);
        fs.rmSync(extractDir, { recursive: true, force: true });
        process.env.PATH = `${ffmpegDir}:${process.env.PATH}`;
        return true;
    } catch (error) {
        console.error('❌ Failed to download FFmpeg:', error.message);
        return false;
    }
}

// ============================================
// WEB PAIRING ROUTE (FIXED & OPTIMIZED)
// ============================================
function getSessionPath() {
    return path.join(__dirname, 'temp_sessions', `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
}

function removeSessionFolder(folderPath) {
    setTimeout(() => {
        try {
            if (fs.existsSync(folderPath)) {
                fs.rmSync(folderPath, { recursive: true, force: true });
            }
        } catch (err) {
            console.error('Error deleting session folder:', err.message);
        }
    }, 5000);
}

app.get('/code', async (req, res) => {
    let num = req.query.number;

    if (!num) {
        return res.status(400).json({ error: "Please provide a valid phone number. Example: ?number=919876543210" });
    }

    num = num.replace(/[^0-9]/g, '');
    const sessionDir = getSessionPath();

    const { makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@aadhixd777/baileys");
    const pino = require('pino');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const Sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            syncFullHistory: false,
            markOnlineOnConnect: false
        });

        Sock.ev.on('creds.update', saveCreds);

        if (!Sock.authState.creds.registered) {
            await delay(1500);
            try {
                let code = await Sock.requestPairingCode(num);
                code = code?.match(/.{1,4}/g)?.join("-") || code;

                if (!res.headersSent) {
                    res.json({ code: code, status: true });
                }
            } catch (err) {
                console.error("Error requesting pairing code:", err);
                removeSessionFolder(sessionDir);
                if (!res.headersSent) {
                    return res.status(500).json({ error: "Failed to generate pairing code. Try again!" });
                }
            }
        }

        Sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                await delay(3000);
                try {
                    const credsPath = path.join(sessionDir, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const credsData = fs.readFileSync(credsPath);
                        const base64Session = Buffer.from(credsData).toString('base64');
                        const sessionId = `ZORO~${base64Session}`;

                        const userJid = Sock.user.id.split(':')[0] + '@s.whatsapp.net';
                        
                        await Sock.sendMessage(userJid, {
                            text: `*✅ YOUR SESSION ID HAS BEEN GENERATED*\n\n\`\`\`${sessionId}\`\`\`\n\n*⚠️ DO NOT SHARE THIS CODE WITH ANYONE!*`
                        });
                    }
                } catch (e) {
                    console.error("Session Send Error:", e);
                } finally {
                    await delay(2000);
                    try { await Sock.ws.close(); } catch {}
                    removeSessionFolder(sessionDir);
                }
            } else if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode && statusCode !== 401) {
                    // unexpected close handle
                } else {
                    removeSessionFolder(sessionDir);
                }
            }
        });

    } catch (error) {
        console.error("Server Error:", error);
        removeSessionFolder(sessionDir);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

// ============================================
// MAIN BOT STARTUP
// ============================================
async function startBot() {
    app.listen(port, () => console.log(`🚀 Server and Pairing API running on port ${port}`));

    console.log('\n╔════════════════════════════════════╗');
    console.log('║  🚀 ZORO MD BOT STARTING...        ║');
    console.log('╚════════════════════════════════════╝\n');
    
    try { await downloadAndExtractModules(); } catch (err) {}
    await checkAndInstallFFmpeg();

    const chalk = require('chalk');
    const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
    const PhoneNumber = require('awesome-phonenumber');
    const { smsg, jidDecode } = require('./lib/myfunc');
    const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore,
        delay
    } = require("@aadhixd777/baileys");
    const NodeCache = require("node-cache");
    const pino = require("pino");

    const store = require('./lib/lightweight_store');
    store.readFromFile();
    const settings = require('./settings');
    setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);

    const MessageQueue = require('./lib/messageQueue');
    const messageQueue = new MessageQueue();

    let owner = JSON.parse(fs.readFileSync('./data/owner.json'));

    async function startXeonBotInc() {
        let { version } = await fetchLatestBaileysVersion();
        const sessionDir = './session';
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
        
        if (process.env.SESSION_ID) {
            try {
                let sessionId = process.env.SESSION_ID.replace(/^["']|["']$/g, '');
                if (sessionId.includes(':~')) sessionId = sessionId.split(':~')[1];
                const sessionData = Buffer.from(sessionId, 'base64').toString('utf-8');
                fs.writeFileSync(path.join(sessionDir, 'creds.json'), sessionData);
                console.log('✅ Session loaded from .env SESSION_ID');
            } catch (err) {
                console.log('⚠️ Could not decode SESSION_ID:', err.message);
            }
        }
        
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const msgRetryCounterCache = new NodeCache();

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: true,
            msgRetryCounterCache
        });

        store.bind(XeonBotInc.ev);

        const { wrapSendMessage } = require('./lib/fontTransformer');
        wrapSendMessage(XeonBotInc);

        const originalSendMessage = XeonBotInc.sendMessage;
        XeonBotInc.sendMessage = async function(jid, content, options = {}) {
            try {
                return await originalSendMessage.call(this, jid, content, options);
            } catch (error) {
                messageQueue.addMessage(jid, content, 1);
                throw error;
            }
        };

        XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    await handleStatus(XeonBotInc, chatUpdate);
                    return;
                }
                await handleMessages(XeonBotInc, chatUpdate, true);
            } catch (err) {
                console.error("Error in messages.upsert:", err);
            }
        });

        XeonBotInc.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            } else return jid;
        };

        XeonBotInc.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect } = s;
            if (connection == "open") {
                console.log(chalk.green(`\n🍁 BOT CONNECTED SUCCESSFULLY AS: ${XeonBotInc.user.id}`));
            }
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    try { fs.rmSync('./session', { recursive: true, force: true }); } catch { }
                    startXeonBotInc();
                } else {
                    startXeonBotInc();
                }
            }
        });

        XeonBotInc.ev.on('creds.update', saveCreds);

        const { handleCall } = require('./plugins/anticall-improved');
        XeonBotInc.ev.on('call', async (calls) => {
            for (const call of calls) {
                await handleCall(XeonBotInc, { from: call.from || call.peerJid, id: call.id, status: call.status || 'offer' });
            }
        });

        XeonBotInc.ev.on('group-participants.update', async (update) => {
            await handleGroupParticipantUpdate(XeonBotInc, update);
        });

        return XeonBotInc;
    }

    await startXeonBotInc();
}

startBot().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
