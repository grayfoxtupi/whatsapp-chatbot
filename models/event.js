const event = {
  summary: 'Reunião com cliente - Imobiliária Aladdn',
  location: 'Unidade Central - Rua das Palmeiras, 123, São Paulo - SP',
  description: 'Reunião para apresentar imóveis disponíveis conforme o perfil do cliente.',
  start: {
    dateTime: '2025-06-13T15:00:00-03:00', // horário de Brasília
    timeZone: 'America/Sao_Paulo',
  },
  end: {
    dateTime: '2025-06-13T15:30:00-03:00', // duração de 30 minutos
    timeZone: 'America/Sao_Paulo',
  },
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 60 },   // aviso 1h antes por e-mail
      { method: 'popup', minutes: 10 },   // aviso 10min antes por popup
    ],
  },
};

export default event