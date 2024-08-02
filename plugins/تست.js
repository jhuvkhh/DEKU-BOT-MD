import axios from 'axios';
import yts from 'yt-search';
import { ytmp44 } from '@bochilteam/scraper'; // استخدام مكتبة تنزيل الفيديو

const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  proto
} = (await import("@whiskeysockets/baileys")).default;

let handler = async (message, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(message.chat, "[❗] *يرجى إدخال نص للبحث على يوتيوب*", message);
  }

  async function generateVideoMessage(url) {
    try {
      // قم بتنزيل الفيديو بصيغة MP4 باستخدام ytmp44
      const { status, resultados, error } = await ytmp44(url);
      if (!status) {
        throw new Error(error);
      }
      const videoUrl = resultados.descargar;
      if (!videoUrl) {
        throw new Error('فشل في الحصول على رابط الفيديو');
      }

      // قم بتحميل الفيديو من الرابط
      const videoBuffer = await getBuffer(videoUrl);

      // قم بتحميل الفيديو إلى الخادم واستخدامه في الرسالة
      const { videoMessage } = await generateWAMessageContent({
        video: { url: videoUrl }
      }, { 'upload': conn.waUploadToServer });
      
      return videoMessage;
    } catch (error) {
      console.error("خطأ في توليد رسالة الفيديو:", error);
      return null;
    }
  }

  async function searchYouTube(query) {
    try {
      const { videos } = await yts(query);
      return videos;
    } catch (error) {
      console.error("خطأ في البحث على يوتيوب:", error);
      return [];
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async function getBuffer(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response.data;
  }

  let results = [];
  let videos = await searchYouTube(text);
  let selectedVideos = videos.slice(0, 5); // اختيار أول 5 فيديوهات
  shuffleArray(selectedVideos); // خلط الفيديوهات
  let videoCount = 1;

  for (let video of selectedVideos) {
    const videoUrl = video.url;
    const videoMessage = await generateVideoMessage(videoUrl);
    if (videoMessage) {
      results.push({
        'body': proto.Message.InteractiveMessage.Body.fromObject({
          'text': "فيديو - " + videoCount++
        }),
        'footer': proto.Message.InteractiveMessage.Footer.fromObject({
          'text': "𝐆𝐎𝐉𝐎⚡𝐁𝐎𝐓"
        }),
        'header': proto.Message.InteractiveMessage.Header.fromObject({
          'title': '',
          'hasMediaAttachment': true,
          'videoMessage': videoMessage
        }),
        'nativeFlowMessage': proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          'buttons': [{
            'name': "cta_url",
            'buttonParamsJson': "{\"display_text\":\"قناة الواتس\",\"Url\":\"https://whatsapp.com/channel/0029VakGs0BDeONEB6GKAa09\"}"
          }]
        })
      });
    } else {
      conn.reply(message.chat, `خطأ في معالجة رابط الفيديو: ${videoUrl}`, message);
    }
  }

  if (results.length === 0) {
    return conn.reply(message.chat, "[❗] لم يتم العثور على أي فيديوهات صالحة.", message);
  }

  const messageContent = generateWAMessageFromContent(message.chat, {
    'viewOnceMessage': {
      'message': {
        'messageContextInfo': {
          'deviceListMetadata': {},
          'deviceListMetadataVersion': 2
        },
        'interactiveMessage': proto.Message.InteractiveMessage.fromObject({
          'body': proto.Message.InteractiveMessage.Body.create({
            'text': "[❗] النتائج لـ ❤🎦: " + text
          }),
          'footer': proto.Message.InteractiveMessage.Footer.create({
            'text': "🔎 `Y O U T U B E - S E A R C H`"
          }),
          'header': proto.Message.InteractiveMessage.Header.create({
            'hasMediaAttachment': false
          }),
          'carouselMessage': proto.Message.InteractiveMessage.CarouselMessage.fromObject({
            'cards': [...results]
          })
        })
      }
    }
  }, {
    'quoted': message
  });

  await conn.relayMessage(message.chat, messageContent.message, { 'messageId': messageContent.key.id });
};

handler.help = ["youtube"];
handler.tags = ["downloader"];
handler.command = /^(يوتيوب)$/i;

export default handler;
