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
    const result = await youtubedl(url);
    const format = result.formats.find(f => f.qualityLabel === '360p' && f.mimeType.includes('mp4'));
    const videoUrl = format.url;
    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const videoPath = `/tmp/video.mp4`;
    response.data.pipe(fs.createWriteStream(videoPath));

    return new Promise((resolve, reject) => {
      response.data.on('end', () => resolve(videoPath));
      response.data.on('error', reject);
    });
  }

  let searchResults = await yts(text);
  let videos = searchResults.videos.slice(0, 1); // اختر فيديو واحد فقط

  for (let video of videos) {
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
  }
};

handler.help = ["youtube"];
handler.tags = ["downloader"];
handler.command = /^(يوتيوب)$/i;

export default handler;
