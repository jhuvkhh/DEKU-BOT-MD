import fetch from 'node-fetch';
import ytdl from 'ytdl-core';
import fs from 'fs';
import yts from 'yt-search';

const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  proto
} = (await import("@whiskeysockets/baileys")).default;

let handler = async (message, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(message.chat, "[❗] *شكلك نسيت تحط نص user@ \n ادخل نصا لاستطيع البحث علي يوتيوب?*", message);
  }

  async function downloadVideo(url) {
    const videoPath = `/tmp/video.mp4`;
    return new Promise((resolve, reject) => {
      ytdl(url, { quality: 'highest' })
        .pipe(fs.createWriteStream(videoPath))
        .on('finish', () => resolve(videoPath))
        .on('error', reject);
    });
  }

  let searchResults = await yts(text);
  let videos = searchResults.videos.slice(0, 1); // اختر فيديو واحد فقط

  for (let video of videos) {
    try {
      let videoPath = await downloadVideo(video.url);
      const videoMessage = await generateWAMessageContent({ video: { url: videoPath } }, { upload: conn.waUploadToServer });

      const messageContent = generateWAMessageFromContent(message.chat, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            videoMessage: videoMessage.videoMessage
          }
        }
      }, {
        quoted: message
      });

      await conn.relayMessage(message.chat, messageContent.message, { messageId: messageContent.key.id });
    } catch (error) {
      console.error('Error downloading or sending video:', error);
      await conn.reply(message.chat, "حدث خطأ أثناء تنزيل الفيديو. حاول مرة أخرى لاحقًا.", message);
    }
  }
};

handler.help = ["youtube"];
handler.tags = ["downloader"];
handler.command = /^(يوتيوب)$/i;

export default handler;
