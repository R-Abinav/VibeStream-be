import express from 'express';
import ENV from './config/env.config.js';

import crypto from 'crypto';
import cors from 'cors';

import querystring from 'querystring';
import axios from 'axios';

const app = express();
const port = ENV.PORT;
const mode = ENV.NODE_ENV;

const corsOptions = {
    origin: [ENV.CLIENT_URL],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}


const stateStore = new Set();

function generateSecureState(){
    const state = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 600000;  //10 min
    const signature = crypto.createHmac('sha256', ENV.STATE_SECRET)
                            .update(`${state}|${expiresAt}`)
                            .digest('hex');

    stateStore.add(state); 
    return `${state}.${expiresAt}.${signature}`;
}

//Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/health', (req, res) => {
    return res.status(200).json({ 
        message: 'Works bhai! Healthy' 
    });
});

app.get('/api/spotify-login', (req, res) => {
    try{
        console.log("Spotify Login");
        const scope = 'user-read-private user-read-email user-top-read';
        const state = generateSecureState();

        const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
            response_type: 'code',
            client_id: ENV.SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: ENV.REDIRECT_URI,
            state: state,
            show_dialog: true,
        });

        res.redirect(authUrl);
    }catch(err){
        console.log(err);
        res.status(500).send('Authentication failed');
    }
});

app.get('/api/callback', async (req, res) => {
    try{
        const { code, state, error } = req.query;

        //Validate state
        if(!state || !stateStore.has(state.split('.')[0])){
            return res.status(400).redirect(`${ENV.CLIENT_URL}/login?error=invalid_state`);
        }
        stateStore.delete(state.split('.')[0]);

        if(error){
            return res.redirect(`${ENV.CLIENT_URL}/login?error=${error}`);
        }

        //Exchage the code for tokens
        const authHeader = {
            headers:{
               'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${ENV.SPOTIFY_CLIENT_ID}:${ENV.SPOTIFY_CLIENT_SECRET}`).toString('base64')}` 
            }
        }

        const formData = {
            code: code,
            redirect_uri: ENV.REDIRECT_URI,
            grant_type: 'authorization_code'
        }

        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', formData, authHeader, { json: true });

        res.redirect(`${ENV.CLIENT_URL}/?access_token=${tokenResponse.data.access_token}&refresh_token=${tokenResponse.data.refresh_token}&expires_in=${tokenResponse.data.expires_in}`);
    }catch(err){
        console.error('Callback error:', err);
        res.redirect(`${ENV.CLIENT_URL}/login?error=auth_failed`);
    }
});

app.get('/api/user-info', async (req, res) => {
    try{
        const accessToken = req.headers.authorization?.split(' ')[1];
        
        if(!accessToken){
            return res.status(401).json({ error: 'Missing access token' });
        }

        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
        });

        res.json(userResponse.data);
    }catch(err){
        console.error('Fetching user info error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

//Refresh token
app.post('/api/refresh-token', async (req, res) => {
    try{
        const { refresh_token } = req.body;

        const postHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${ENV.SPOTIFY_CLIENT_ID}:${ENV.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }

        const postForm = {
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
        }

        const response = await axios.post('https://accounts.spotify.com/api/token', postForm, postHeaders, { json: true });

        console.log("Response for refresh token -> ",response);
        res.json({
            access_token: response.data.access_token,
            expires_in: response.data.expires_in 
        });
    }catch(err){
        console.error('Refresh error:', err.response?.data || err.message);
        res.status(401).json({ error: 'Token refresh failed' });
    }
})

app.listen(port, "127.0.0.1", () => {
    console.log(`Server is running on ${port} in ${mode} mode`);
});