import chatbot from './config/wpConn.js';
import Message from './models/messageModel.js';
import { generateResponse } from './events/AIRequests.js';
import { sendChunks, sendMessage } from './helpers/message.js';
import { transcribeAudio } from './helpers/message.js';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'url';
import connectDB from './config/mongoConn.js'
import scheduleOptionsText from './models/optionsText.js';
import { createDateString } from './helpers/dateHelper.js';
import { setEvent, insertEvent,  deleteEvent, checkEvents, updateEvent } from './helpers/calendarHelper.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pendingMessages = new Map();
const delay = process.env.MESSAGE_DELAY || 2000;

connectDB()

chatbot.once('ready', () => {
  console.log('Client is ready!');
});

chatbot.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

chatbot.on('message', async (message) => {
  const chat = await message.getChat();
  const chatId = chat.id._serialized;
  let msgText = message.body;

  if (!message.body && !message.hasMedia) {
    console.log('Mensagem vazia ou inválida ignorada.');
  } else {

    if (pendingMessages.has(chatId)) {
      clearTimeout(pendingMessages.get(chatId));
      pendingMessages.delete(chatId);
    }

    if (message.hasMedia && message.type === 'audio') {
      const media = await message.downloadMedia();
      const fileName = `${Date.now()}.ogg`;
      const filePath = path.resolve(__dirname, './audios', fileName);
      fs.writeFileSync(filePath, media.data, 'base64');

      try {
        msgText = await transcribeAudio(filePath);
        console.log('TRANSCRIÇÃO:', msgText);
      } catch (erro) {
        console.error(`Erro ao transcrever: ${erro.message}`);
        msgText = ""
      }
    }

    const newMessage = new Message({ 
      chatId, 
      role: 'user', 
      content: msgText 
    });

    await newMessage.save();

    const msgHistory = (
      await Message.find({ chatId }).select('role content -_id').sort({ _id: -1 }).limit(10)
    ).reverse();

    
    // Encontra a última mensagem enviada pelo usuário
    const lastUserMsg = msgHistory.reverse().find(msg => msg.role === 'user');
    console.log("LAST USER MSG ///////////////////// : ", lastUserMsg)


    // Encontra a última mensagem enviada pelo usuário
    const lastAssistantMsg = msgHistory.find(msg => msg.role === 'assistant');
    console.log("LAST SYSTEM MSG ///////////////////: ", lastAssistantMsg)

    // Volta a ordem original denovo
    msgHistory.reverse()

    if (lastAssistantMsg?.content.includes('Escolha um horário para o agendamento:')) {
      const option = lastUserMsg.content.trim().match(/\d+/)?.[0] || '';
      if(['1', '2', '3', '4', '5', '13', '17', '14', '18', 'cancelar', 'Cancelar', 'cancele', 'Cancelar'].includes(option)){
          const dates = createDateString(option)

          console.log("DATAS /////////////////// ",dates)

          if(dates === "cancel"){
            const eventId = await checkEvents(`Reunion with client: ${chatId}`)

            if(eventId){
              deleteEvent(eventId)
              await sendMessage(chatId, "Reunião desmarcada !") 
              console.log("Reunião desmarcada !")
            } else {
              await sendMessage(chatId, "Não há reunião para desmarcar !") 
              console.log("Não há reunião para desmarcar !")
            }

            const newResponse = new Message({ 
              chatId, 
              role: 'assistant', 
              content: "Reunião desmarcada !" 
            });
            
            await newResponse.save();

          } else {
          const eventSchema = setEvent(`Reunion with client: ${chatId}`, dates[0], dates[1])

          const eventId = await checkEvents(`Reunion with client: ${chatId}`)

          console.log("IDDDDDDDDD: ", eventId)

          if(eventId === null){
            insertEvent(eventSchema)
            await sendMessage(chatId, "Reunião agendada !") 
          } else {
            updateEvent(eventId, eventSchema)
            await sendMessage(chatId, "Data da reunião redefinida !")
            const newResponse = new Message({ chatId, role: 'assistant', content: "Data da reunião redefinida !" });
            await newResponse.save()
          }

          }
        

          } else {
            const response = await sendMessage(chatId, "Opção inválida")
            const newResponse = new Message({ chatId, role: 'assistant', content: "Opção inválida" });
            await newResponse.save()
          }
        
        } else {

        const aiResponse = await generateResponse(msgHistory);
        console.log("AI RESPONSE:", aiResponse);

        if (aiResponse) {
          const newResponse = new Message({ 
            chatId, 
            role: 'assistant', 
            content: aiResponse 
          });

          await newResponse.save();

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
          console.log("Failed to send message to AI");
        }
      }
    }
  });

  chatbot.initialize();
