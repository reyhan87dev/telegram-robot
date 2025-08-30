const TelegramBot = require('node-telegram-bot-api');

// استفاده از متغیر محیطی برای توکن - بسیار مهم!
const token = process.env.BOT_TOKEN || "8453292293:AAFmunFylfn1nptsbqPAo6QYgdpXG9QJSJw";

// بررسی وجود توکن
if (!token) {
    console.error('❌ توکن ربات تنظیم نشده است!');
    console.error('لطفا متغیر محیطی BOT_TOKEN را تنظیم کنید');
    process.exit(1);
}

const bot = new TelegramBot(token, {
    polling: {
        interval: 300,
        timeout: 10,
        params: {
            timeout: 10
        }
    },
    request: {
        agentOptions: {
            rejectUnauthorized: false
        }
    }
});

// ذخیره وضعیت کاربران
const userStates = new Map();

// دستور start
bot.onText(/\/start/, async (msg) => {
    try {
        await bot.sendMessage(msg.chat.id, `Hi ${msg.from.first_name}!`, {
            reply_markup: {
                keyboard: [
                    ['/aboutme', '/getlink']
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } catch (error) {
        console.error('Send error:', error);
    }
});

// دستور aboutme
bot.onText(/\/aboutme/, async (msg) => {
    try {
        await bot.sendMessage(msg.chat.id, 'this bot is created by @iam_reyhun');
    } catch (error) {
        console.error('Error in /aboutme:', error);
    }
});

// دستور getlink
bot.onText(/\/getlink/, async (msg) => {
    try {
        await bot.sendMessage(msg.chat.id, `https://t.me/rn52_bot?start=${msg.chat.id}\nsend this link to the others to invite them into the anonymous chat`);
    } catch (error) {
        console.error('Error in /getlink:', error);
    }
});

// هندل همه پیام‌ها
bot.on('message', async (msg) => {
    try {
        // نادیده گرفتن پیام‌های دستوری که قبلاً پردازش شده‌اند
        if (msg.text && msg.text.startsWith('/')) {
            return;
        }

        if (msg.text) {
            const parts = msg.text.split(" ");
            
            if (parts.length >= 2) {
                const targetChatId = parts[1];
                
                // بررسی اینکه آیا چت ID معتبر است
                if (!/^-?\d+$/.test(targetChatId)) {
                    await bot.sendMessage(msg.chat.id, 'Error: Invalid chat ID format');
                    return;
                }
                
                try {
                    // بررسی وجود کاربر با ارسال یک پیام تست
                    await bot.sendMessage(targetChatId, "Testing message delivery...");
                    await bot.sendMessage(targetChatId, `${msg.from.first_name} sent you a message`);
                    
                    // حذف پیام تست
                    // توجه: ربات باید بتواند پیام خود را حذف کند
                } catch (error) {
                    if (error.response && error.response.statusCode === 403) {
                        await bot.sendMessage(msg.chat.id, 'Error: The bot is not allowed to send messages to this user');
                    } else if (error.response && error.response.statusCode === 400) {
                        await bot.sendMessage(msg.chat.id, 'Error: Invalid user ID');
                    } else {
                        await bot.sendMessage(msg.chat.id, 'Error: Could not send message');
                        console.error('Error sending message:', error);
                    }
                }
            } else {
                await bot.sendMessage(msg.chat.id, "you just sent this message: " + msg.text);
            }
        } else if (msg.photo) {
            // ارسال عکس برگشت
            const photoId = msg.photo[msg.photo.length - 1].file_id;
            await bot.sendPhoto(msg.chat.id, photoId, {
                caption: 'this is the picture that you sent'
            });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        try {
            await bot.sendMessage(msg.chat.id, 'An error occurred while processing your message');
        } catch (sendError) {
            console.error('Could not send error message:', sendError);
        }
    }
});

// هندل errors
bot.on('error', (error) => {
    console.log('Bot error:', error);
});

bot.on('polling_error', (error) => {
    console.log('Polling error:', error);
});

console.log('🤖 Bot is running and waiting for messages...');

// مدیریت graceful shutdown
process.once('SIGINT', () => bot.stopPolling());
process.once('SIGTERM', () => bot.stopPolling());