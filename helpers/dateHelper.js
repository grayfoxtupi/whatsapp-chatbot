function createDateString(option) {
    let dates = null

    switch(option){
        case "1":
        case "13":
            dates = generateReunionDate(1, 13, 30)
            break
        case "2":
        case "17":
            dates = generateReunionDate(1, 17, 0)
            break
        case "3":
        case "14":
            dates = generateReunionDate(2, 14, 0)
            break
        case "4":
        case "18":
            dates = generateReunionDate(2, 18, 0)
            break
        case "5":
        case 'cancelar':
        case 'Cancelar':
        case 'cancele':
        case 'Cancelar':
            console.log("Canceling")
            return "cancel"
        default:
            console.log("Unrecognized date")
            return null
    }

    return [formatDateWithTimezone(dates[0]), formatDateWithTimezone(dates[1])]
    
}

function formatDateWithTimezone(date, timezoneOffset = '-03:00') {
  const pad = num => String(num).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // mês começa em 0
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneOffset}`;

}

function generateDate (diasAdiante, hora, minuto = 0) {
  const data = new Date();
  data.setDate(data.getDate() + diasAdiante); // Avança os dias
  data.setHours(hora);
  data.setMinutes(minuto);
  data.setSeconds(0);
  data.setMilliseconds(0);
  return data;
}

function generateReunionDate(diasAdiante, hora, minuto = 0) {
    const dates = [generateDate(diasAdiante, hora, minuto), generateDate(diasAdiante, hora, (minuto + 30))] // Usa a função "generateDate" para gerar a data de inicio e término do evento.

    return dates
}



export { createDateString, generateDate, generateReunionDate }