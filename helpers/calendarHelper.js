// Refer to the Node.js quickstart on how to setup the environment:
// https://developers.google.com/workspace/calendar/quickstart/node
// Change the scope to 'https://www.googleapis.com/auth/calendar' and delete any
// stored credentials.
import calendar from "../config/calendar.js";

const setEvent = (description, begin, end) => {
  const event = {
  summary: 'Reunião com cliente - Imobiliária Aladdn',
  location: 'Unidade Central - Rua das Palmeiras, 123, São Paulo - SP',
  description: description,
  start: {
    dateTime: begin, // horário de Brasília
    timeZone: 'America/Sao_Paulo',
  },
  end: {
    dateTime: end, // duração de 30 minutos
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

  return event
}

const insertEvent = (event) => {

  calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      console.error('There was an error contacting the Calendar service:', err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
  });

}

const deleteEvent = (eventId) => {
  calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  }, function(err) {
    if (err) {
      console.error('There was an error deleting the event:', err);
      return;
    }
    console.log('Event deleted successfully.');
  });
}

const updateEvent = (eventId, newEventData) => {

  if (!eventId) {
  throw new Error('eventId está indefinido ou vazio!');
}

  try {
    const res = calendar.events.update({ // ← faltava o await aqui
      calendarId: 'primary',
      eventId: eventId,
      resource: newEventData,
    });

    console.log('Evento atualizado com sucesso:');
    //console.log(`${res.data.id} | ${res.data.summary} - ${res.data.start.dateTime}`);
    return res.data;
  } catch (err) {
    console.error('Erro ao atualizar o evento:', err);
    return null;
  }
};



const listEvents = async () => {
   const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = res.data.items;

  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return []; // Return empty list instead of nothing
  }

  // Optional: log the events
  console.log('Upcoming 10 events:');
  events.forEach(event => {
    const start = event.start.dateTime || event.start.date;
    console.log(`${event.id} | ${start} - ${event.summary}`);
  });

  return events; // ✅ Return the list
}

const checkEvents = async (description) => {
  const events = await listEvents();

  const foundEvent = events.find(event => event.description === description);

  return foundEvent ? foundEvent.id : null;
}

export { insertEvent, deleteEvent, setEvent, updateEvent, listEvents, checkEvents}