import axios from 'axios'
import fs from 'fs'
import { finished } from 'stream/promises'

async function downloadAudio(fileUrl, caminhoArquivo) {
  try {
    const response = await axios.get(fileUrl, { responseType: 'stream' })
    const writer = fs.createWriteStream(caminhoArquivo)
    response.data.pipe(writer)
    await finished(writer)
  } catch (err) {
    throw new Error(`Erro ao baixar/gravar o áudio: ${err.message}`)
  }
}


export default downloadAudio