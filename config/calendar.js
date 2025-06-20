import { google } from 'googleapis';
import auth from './googleAuth.js';

const calendar = google.calendar({ version: 'v3', auth });

export default calendar