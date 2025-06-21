import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode'; // 📌 novo import

import chatbot from './config/wpConn.js';
import connectDB from './config/mongoConn.js';

import Message from './models/messageModel.js';
import scheduleOptionsText from './models/optionsText.js';
import { generateResponse } from './events/AIRequests.js';
import { sendChunks, sendMessage, transcribeAudio } from './helpers/message.js';
import { createDateString } from './helpers/dateHelper.js';
import { setEvent, insertEvent, deleteEvent, checkEvents, updateEvent } from './helpers/calendarHelper.js';

// Utils
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pendingMessages = new Map();
const delay = process.env.MESSAGE_DELAY || 2000;

let latestQR = ''; // 🔹 Armazena o QR Code como base64

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || `http://localhost:${PORT}`;

app.get('/', (req, res) => {
  res.send('Bot WhatsApp está rodando!');
});

app.get('/qr', (req, res) => {
  if (!latestQR) return res.send('QR Code ainda não disponível.');

  const img = Buffer.from(latestQR.split(',')[1], 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length,
  });
  res.end(img);
});

app.listen(PORT, () => {
  console.log(`Servidor Express rodando na porta ${PORT}`);
});

setInterval(() => {
  fetch(KEEP_ALIVE_URL)
    .then(() => console.log(`[${new Date().toISOString()}] Auto-ping enviado para ${KEEP_ALIVE_URL}`))
    .catch(err => console.error('Erro no auto-ping:', err));
}, 6 * 60 * 1000);

// 🔸 Evento de QR Code como imagem base64
chatbot.on('qr', async (qr) => {
  console.log('QR code recebido. Acesse /qr para escanear.');
  latestQR = await QRCode.toDataURL(qr);
});

chatbot.on('ready', () => {
  console.log('🤖 Chatbot pronto para receber mensagens!');
});

chatbot.on('message', async (message) => {
  const chat = await message.getChat();
  const chatId = chat.id._serialized;
  let msgText = message.body;

  if (!message.body && !message.hasMedia) {
    console.log('Mensagem vazia ou inválida ignorada.');
    return;
  }

  if (pendingMessages.has(chatId)) {
    clearTimeout(pendingMessages.get(chatId));
    pendingMessages.delete(chatId);
  }

  if (message.hasMedia && message.type === 'audio') {
    const media = await message.downloadMedia();
    const fileName = `${Date.now()}.ogg`;
    const filePath = path.resolve(__dirname, './audios', fileName);
    require('fs').writeFileSync(filePath, media.data, 'base64');

    try {
      msgText = await transcribeAudio(filePath);
      console.log('TRANSCRIÇÃO:', msgText);
    } catch (erro) {
      console.error(`Erro ao transcrever: ${erro.message}`);
      msgText = "";
    }
  }

  await new Message({ chatId, role: 'user', content: msgText }).save();

  const msgHistory = (
    await Message.find({ chatId }).select('role content -_id').sort({ _id: -1 }).limit(10)
  ).reverse();

  const lastUserMsg = msgHistory.slice().reverse().find(msg => msg.role === 'user');
  const lastAssistantMsg = msgHistory.find(msg => msg.role === 'assistant');

  if (lastAssistantMsg?.content.includes('Escolha um horário para o agendamento:')) {
    const option = lastUserMsg.content.trim().match(/\d+/)?.[0] || '';

    if (['1', '2', '3', '4', '5', '13', '17', '14', '18', 'cancelar', 'Cancelar', 'cancele'].includes(option)) {
      const dates = createDateString(option);

      if (dates === "cancel") {
        const eventId = await checkEvents(`Reunion with client: ${chatId}`);
        if (eventId) {
          deleteEvent(eventId);
          await sendMessage(chatId, "Reunião desmarcada !");
        } else {
          await sendMessage(chatId, "Não há reunião para desmarcar !");
        }

        await new Message({ chatId, role: 'assistant', content: "Reunião desmarcada !" }).save();
      } else {
        const eventSchema = setEvent(`Reunion with client: ${chatId}`, dates[0], dates[1]);
        const eventId = await checkEvents(`Reunion with client: ${chatId}`);

        if (eventId === null) {
          insertEvent(eventSchema);
          await sendMessage(chatId, "Reunião agendada !");
        } else {
          updateEvent(eventId, eventSchema);
          await sendMessage(chatId, "Data da reunião redefinida !");
        }

        await new Message({
          chatId,
          role: 'assistant',
          content: eventId === null ? "Reunião agendada !" : "Data da reunião redefinida !"
        }).save();
      }
    } else {
      await sendMessage(chatId, "Opção inválida");
      await new Message({ chatId, role: 'assistant', content: "Opção inválida" }).save();
    }

  } else {
    const aiResponse = await generateResponse(msgHistory);
    console.log("AI RESPONSE:", aiResponse);

    if (aiResponse) {
      await new Message({ chatId, role: 'assistant', content: aiResponse }).save();

      const timeout = setTimeout(async () => {
        const chunks = aiResponse
          .split(/(?<=[.?!])\s+/)
          .map(chunk => chunk.trim())
          .filter(chunk => chunk.length > 0);

        await sendChunks(chatId, aiResponse, chunks, 0);
        pendingMessages.delete(chatId);
      }, delay);

      pendingMessages.set(chatId, timeout);
    } else {
      console.log("Falha ao obter resposta da IA");
    }
  }
});

chatbot.initialize();
