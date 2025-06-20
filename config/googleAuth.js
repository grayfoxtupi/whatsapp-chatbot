import { google } from 'googleapis';

const clientId = process.env.CALENDAR_CLIENT_ID
const clientSecret = process.env.CALENDAR_CLIENT_SECRET
const refresh_token = process.env.CALENDAR_REFRESH_TOKEN

const auth = new google.auth.OAuth2(
  clientId,
  clientSecret
);

auth.setCredentials({
  refresh_token: refresh_token
});

export default auth
