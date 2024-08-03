import ytSearch from 'yt-search';
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  proto
} = (await import("@whiskeysockets/baileys")).default;

let handler = async (message, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(message.chat, "[❗] *شكلك نسيت تحط نص user@ \n ادخل نصا لاستطيع البحث علي يوتيوب?*", message);
  }

  async function generateVideoMessage(url, title, thumbnail) {
    const { imageMessage } = await generateWAMessageContent({ 'image': { 'url': thumbnail } }, { 'upload': conn.waUploadToServer });
    return {
      title,
      url,
      imageMessage
    };
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  let results = [];
  let searchResults = await ytSearch(text);
  let videos = searchResults.videos.slice(0, 5);

  shuffleArray(videos);

  for (let video of videos) {
    let videoMessage = await generateVideoMessage(video.url, video.title, video.thumbnail);
    results.push({
      'body': proto.Message.InteractiveMessage.Body.fromObject({
        'text': videoMessage.title
      }),
      'footer': proto.Message.InteractiveMessage.Footer.fromObject({
        'text': "𝐆𝐎𝐉𝐎⚡𝐁𝐎𝐓"
      }),
      'header': proto.Message.InteractiveMessage.Header.fromObject({
        'title': '',
        'hasMediaAttachment': true,
        'imageMessage': videoMessage.imageMessage
      }),
      'nativeFlowMessage': proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
        'buttons': [{
          'name': "cta_url",
          'buttonParamsJson': `{\"display_text\":\"Watch Video 📹\",\"Url\":\"${videoMessage.url}\"}`
        }]
      })
    });
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
            'text': "[❗] النتيجه لي ❤🎦 : " + text
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
