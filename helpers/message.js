import chatbot from '../config/wpConn.js'
import { spawn } from "child_process"
import scheduleButtons from '../models/buttons.js'
import scheduleOptionsText from '../models/optionsText.js'
import Message from '../models/messageModel.js'

async function sendMessage(chatId, msgText){
    chatbot.sendMessage(chatId, msgText)
}

async function sendMessageWithOptions(chatId) {

  setTimeout(async () => {
    return await chatbot.sendMessage(chatId, scheduleOptionsText)
    }, 1000)
}

async function sendChunks(chatId, aiResponse, chunks, index = 0){
    console.log("HERE")
    if (index >= chunks.length) {
      if(aiResponse.includes("reunião") || aiResponse.includes("atendimento")){
        await sendMessageWithOptions(chatId)

        const newScheduleMsg = new Message({
          chatId: chatId,
          role: "assistant",
          content: JSON.stringify(scheduleOptionsText)
          })

        await newScheduleMsg.save()
      }

        return
    }

    console.log(chunks)
    const currentChunk = chunks[index]

    if(currentChunk.length > 0)
        await sendMessage(chatId, currentChunk)

    setTimeout(() => {
        sendChunks(chatId, aiResponse, chunks, index + 1)
    }, 1000)

}

function transcribeAudio(caminhoArquivo) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('py', ['whisper_script.py', caminhoArquivo]);

    let resultado = '';
    let erro = '';

    pythonProcess.stdout.on('data', (data) => {
      resultado += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      erro += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(resultado);
      } else {
        reject(new Error(`Processo Python finalizado com código ${code}: ${erro}`));
      }
    });
  });
}


export { sendMessage, sendChunks, transcribeAudio }