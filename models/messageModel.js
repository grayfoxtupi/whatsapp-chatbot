import mongoose from 'mongoose'

const messageSchema = mongoose.Schema({
    chatId: String,
    role: String,
    content: String
})

const Message = mongoose.model("Message", messageSchema)

export default Message