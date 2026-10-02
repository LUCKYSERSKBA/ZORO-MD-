const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

module.exports = {
    // Basic Settings
    SESSION_ID: process.env.SESSION_ID || "MINI BOT",
    MONGODB_URI: process.env.MONGODB_URI || "",
    
    // Bot Info
    PREFIX: process.env.PREFIX || ".",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "",
    BOT_NAME: process.env.BOT_NAME || "ZORO-MD",
    BOT_FOOTER: process.env.BOT_FOOTER || "© Powered by ZORO-MD",
    WORK_TYPE: process.env.WORK_TYPE || "public",
    
    // Status Settings
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || "true",
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "true",
    AUTO_LIKE_EMOJI: ['❤️', '🌹', '😇', '💥', '🔥', '💫', '💎', '💙', '🌝', '💚'],
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "Nice status! 🔥",
    
    // Chat & Presence
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    AUTO_TYPING: process.env.AUTO_TYPING || "false",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
    
    // Group Settings
    WELCOME_ENABLE: process.env.WELCOME_ENABLE || "true",
    GOODBYE_ENABLE: process.env.GOODBYE_ENABLE || "true",
    WELCOME_MSG: process.env.WELCOME_MSG || null,
    GOODBYE_MSG: process.env.GOODBYE_MSG || null,
    WELCOME_IMAGE: process.env.WELCOME_IMAGE || null,
    GOODBYE_IMAGE: process.env.GOODBYE_IMAGE || null,
    GROUP_INVITE_LINK: process.env.GROUP_INVITE_LINK || "",
    
    // Security & Anti-Call
    ANTI_CALL: process.env.ANTI_CALL || "false",
    REJECT_MSG: process.env.REJECT_MSG || "*📞 Call rejected automatically.*",
    
    // Links & Images
    IMAGE_PATH: process.env.IMAGE_PATH || "",
    CHANNEL_LINK: process.env.CHANNEL_LINK || "",
    
    // Telegram API Keys
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '7214172448:AAHGqSgaw-zGVPZWvl8msDOVDhln-9kExas',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '7825445776'
};
