import pkg from 'whatsapp-web.js';

const { Client, NoAuth } = pkg;

const chatbot = new Client({
    authStrategy: new NoAuth()
});

export default chatbot