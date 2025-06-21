import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const ENV = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_URL: process.env.CLIENT_URL,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    STATE_SECRET: process.env.STATE_SECRET || crypto.randomBytes(32).toString('hex'),
    REDIRECT_URI: process.env.REDIRECT_URI,
    SERVER_API_KEY: process.env.SERVER_API_KEY,
}

export default ENV;