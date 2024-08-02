let handler = m => m

let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
handler.before = async function (m, { user, isBotAdmin, isAdmin }) {
  if ((m.isBaileys && m.fromMe) || m.fromMe || !m.isGroup) return true
  let chat = global.DATABASE.data.chats[m.chat]
  let isGroupLink = linkRegex.exec(m.text)

  if (chat.antiLink && isGroupLink) {
    await m.reply(`*「❗️ANTI LINKS❗️」*\n*هذا لن يتم 🤨, ${await this.getName(m.sender)} ¡No respetas las reglas!*`)
    await m.reply(`*Fuera!!*`)
    if (isAdmin) return m.reply('*احا الي بعت النك ادمن مش هعرف اطردو😐*') 
    if (!isBotAdmin) return m.reply('*البوت مش.ادمن لكده مش هعرف اطردك 😅*')
    let linkGC = ('https://chat.whatsapp.com/' + await this.groupInviteCode(m.chat))
    let isLinkThisGc = new RegExp(linkGC, 'i')
    let isgclink = isLinkThisGc.test(m.text)
    if (isgclink) return m.reply('*ممنوع الروابط فالجروب ده هي مش سايبه حضرتك 🙂 \n اسف بس هطردك  🧐*')
    await this.groupRemove(m.chat, [m.sender])
  }
  return true
}

module.exports = handler
