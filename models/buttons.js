import pkg from "whatsapp-web.js";
const { Buttons } = pkg;

const scheduleButtons = new Buttons(
  'Escolha um horário para o agendamento:',
  [
    { body: 'Amanhã às 15h' },
    { body: 'Amanhã às 17h' },
    { body: 'Depois de Amanhã às 16h' },
    { body: 'Depois de Amanhã às 19h' }
  ],
  'Agendar Reunião',
  'Selecione uma opção abaixo:'
);

export default scheduleButtons;
