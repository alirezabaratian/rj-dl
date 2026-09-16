require("dotenv").config({quiet: true});
const { TelegramBot } = require('node-telegram-bot-api');
const mongoose = require("mongoose");
const User = require("./models/User");
const Media = require("./models/Media");
const cloudscraper = require("cloudscraper");

const databaseUri = process.env.DB_URI;
mongoose.connect(databaseUri);
const ObjectId = mongoose.Types.ObjectId;

const botToken = process.env.BOT_TOKEN;
const botUsername = process.env.BOT_USERNAME;
const sponserChannel = process.env.SPONSER_CHANNEL;

const bot = new TelegramBot(botToken, { polling: true });

function detectUrl(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

async function checkMember(userId) {
  const channel = `@${sponserChannel}`;
  try {
    let user = await bot.getChatMember(channel, userId);
    return user.status;
  } catch (err) { }
}

const options = {
  download: "دانلود",
  guide: "راهنما",
  about: "درباره",
};

async function sendKeyboard(userId) {
  const keyboard = [Object.values(options)];
  try {
    await bot.sendMessage(userId, "منوی اصلی", {
      reply_markup: JSON.stringify({
        keyboard: keyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      }),
    });
  } catch (error) {
    console.error("Error sending keyboard:", error);
  }
}

async function addMedia(userId, url, type) {
  try {
    let user = await User.findOne({ id: userId });
    newMedia = new Media({
      _id: new ObjectId(),
      url: url,
      type: type,
      user: user._id,
    });
    try {
      let media = await newMedia.save();
      user.media.push(media._id);
      user.save();
    } catch (err) { }
  } catch (err) { }
}

async function addUser(msg) {
  const newUser = new User({
    _id: new ObjectId(),
    id: msg.from.id,
    first_name: msg.from.first_name,
    last_name: msg.from.last_name,
    username: msg.from.username,
  });
  try {
    await newUser.save();
  } catch (err) { }
}

async function checkUser(msg) {
  try {
    let user = await User.findOne({ id: msg.from.id });
    if (!user) {
      addUser(msg);
    }
  } catch (err) { }
}

async function sendErrorMessage(userId) {
  try {
    await bot.sendMessage(userId, "خطایی پیش آمد‼");
  } catch (error) {
    console.error("Error sending error message:", error);
  }
}

async function followRedirects(url) {
  try {
    const res = await cloudscraper.get(url, {
      uri: url,
      followRedirect: true,
      resolveWithFullResponse: true
    });
    return res.request.uri.href;
  } catch (err) {
    console.error("Error following redirects: ", err);
    return url;
  }
}

function parseUrl(url) {
  url = url.split("#")[0];
  url = url.split("?")[0];
  url = url.split("/");

  return [url[3], url[4]];
}

async function sendMedia(userId, url) {
  url = await followRedirects(url);
  trackData = parseUrl(url);
  const mediaType = trackData[0];
  const mediaName = trackData[1];

  addMedia(userId, url, mediaType);

  switch (mediaType) {
    case "song":
      await sendMusic(userId, mediaName);
      break;
    case "podcast":
      await sendPodcast(userId, mediaName);
      break;
    case "video":
      await sendVideo(userId, mediaName);
      break;
    default:
      sendErrorMessage(userId);
  }
  sendKeyboard(userId);
}

async function sendMusic(userId, mediaName) {
  let musicEndpoint = "https://host2.rj-mw1.com/media/mp3/mp3-320/";
  const musicFileExtension = ".mp3";

  let musicUrl = musicEndpoint + mediaName + musicFileExtension;
  try {
    await bot.sendAudio(userId, musicUrl, {
      caption: `@${botUsername}`,
    });
  } catch (err) {
    musicEndpoint = "https://host1.rj-mw1.com/media/mp3/mp3-320/";
    musicUrl = musicEndpoint + mediaName + musicFileExtension;
    try {
      await bot.sendAudio(userId, musicUrl, {
        caption: `@${botUsername}`,
      });
    } catch (error) {
      console.error("Error sending music:", error);
    }
  }
}

async function sendPodcast(userId, mediaName) {
  const podcastFileUnavailable =
    "در حال حاضر، به دلیل محدودیت تلگرام، فایل‌های پادکست قابل آپلود نیستند.\n می‌تونید پادکست رو از لینک زیر دریافت کنید:\n\n ";

  const podcastEndpoint = "https://host2.rj-mw1.com/media/podcast/mp3-320/";
  const podcastFileExtension = ".mp3";

  const podcastUrl = podcastEndpoint + mediaName + podcastFileExtension;
  try {
    await bot.sendMessage(userId, podcastFileUnavailable + podcastUrl);
  } catch (error) {
    console.error("Error sending podcast:", error);
  }
}

async function sendVideo(userId, mediaName) {
  const videoFileUnavailable =
    "در حال حاضر، به دلیل محدودیت تلگرام، فایل‌های موزیک ویدیو قابل آپلود نیستند.\n می‌تونید پادکست رو از لینک زیر دریافت کنید:\n\n";
  const videoEndpoint = "https://host2.rj-mw1.com/media/music_video/hd/";
  const videoFileExtension = ".mp4";

  const videoUrl = videoEndpoint + mediaName + videoFileExtension;
  try {
    await bot.sendMessage(userId, videoFileUnavailable + videoUrl);
  } catch (error) {
    console.error("Error sending video:", error);
  }
}

async function parseRequest(userId, url) {
  let userStatus = await checkMember(userId);
  if (userStatus == "left") {
    try {
      await bot.sendMessage(
        userId,
        "برای ادامه عضو کانال زیر شده و مجددا start رو بزنید:",
        {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                {
                  text: "کانال حامی ربات:",
                  url: `https://t.me/${sponserChannel}`,
                },
              ],
            ],
          }),
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  } else if (userStatus == "kicked") {
    try {
      await bot.sendMessage(
        userId,
        "شما از کانال بن شده‌اید و از اجازه استفاده از این ربات را ندارید."
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  } else {
    await sendMedia(userId, url);
  }
}

async function parseMessage(msg) {
  const welcomeMessage = "به ربات دانلود از رادیو جوان خوش آمدید!";
  const wrongInputMessage = "پیامی که ارسال کردید اشتباهه!";
  const userId = msg.from.id;
  const messageText = msg.text || msg.caption;

  if (messageText === undefined) {
    await bot.sendMessage(userId, wrongInputMessage);
    await sendKeyboard(userId);
    return;
  }

  if (messageText.startsWith("https://")) {
    let url = messageText;
    await parseRequest(userId, url);
  } else if (detectUrl(messageText).length !== 0) {
    detectUrl(messageText).forEach((url) => {
      parseRequest(userId, url);
    });
  } else {
    switch (messageText) {
      case "/start":
        try {
          await bot.sendMessage(userId, welcomeMessage);
        } catch (error) {
          console.error("Error sending welcome message:", error);
        }
        break;
      case options.guide:
        try {
          await bot.sendMessage(userId, "لینک آهنگ، پادکست یا ویدیویی که میخوای دانلود کنی رو از سایت رادیو جوان بفرست.");
        } catch (error) {
          console.error("Error sending guide message:", error);
        }

        break;
      case options.download:
        try {
          await bot.sendMessage(
            userId,
            "لطفاً لینکت رو برام بفرست"
          );
        } catch (error) {
          console.error("Error sending download message:", error);
        }
        return;
      case options.about:
        try {
          await bot.sendMessage(userId, "با این ربات می‌توانید به‌سادگی موسیقی، موزیک‌ویدئو، پادکست و سایر محتوای رسانه‌ای موجود در رادیو جوان را دانلود کنید.");
        } catch (error) {
          console.error("Error sending about message:", error);
        }
        break;
      default:
        try {
          await bot.sendMessage(userId, wrongInputMessage);
        } catch (error) {
          console.error("Error sending wrong input message:", error);
        }
    }
    await sendKeyboard(userId);
  }
}

function handleErros() {
  bot.on("polling_error", (error) => {
    console.log("Polling error:", error.code, error.message);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
  });
}

async function main() {
  bot.on("message", (msg) => {
    checkUser(msg);
    parseMessage(msg);
  });
  handleErros();
}

main();
