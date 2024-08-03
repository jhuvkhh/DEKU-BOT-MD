import fetch from 'node-fetch';
import axios from 'axios';
import { youtubedl, youtubedlv2 } from '@bochilteam/scraper';
import fs from 'fs';
import yts from 'yt-search';
import ytmp33 from '../lib/ytmp33.js';
import ytmp44 from '../lib/ytmp44.js';

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
    try {
      const result = await youtubedl(url);
      const format = result.formats.find(f => f.qualityLabel === '360p' && f.mimeType.includes('mp4'));
      if (!format) {
        throw new Error('لم يتم العثور على التنسيق المطلوب');
      }
      const videoUrl = format.url;
      const response = await axios({
        url: videoUrl,
        method: 'GET',
        responseType: 'stream'
      });

      const videoPath = `/tmp/video.mp4`;
      const writer = fs.createWriteStream(videoPath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(videoPath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading video:', error);
      throw error;
    }
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
      await conn.reply(message.chat, "حدث خطأ أثناء تنزيل الفيديو. حاول مرة أخرى لاحقًا.", message);
    }
  }
};

handler.help = ["youtube"];
handler.tags = ["downloader"];
handler.command = /^(يوتيوب)$/i;

export default handler;
