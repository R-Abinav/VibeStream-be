import axios from "axios";
import ENV from "../../../config/env.config";


export const refreshToken = async (refreshToken: string): Promise<string | null> => {
    try{
        const postHeaders = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${ENV.SPOTIFY_CLIENT_ID}:${ENV.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }

        const postForm = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }

        //@ts-ignore
        const response = await axios.post('https://accounts.spotify.com/api/token', postForm, postHeaders, { json: true });

        console.log("Response for refresh token -> ",response);
        return response.data.access_token;
    }catch(err){
        //@ts-ignore
        console.error('Refresh error:', err.response?.data || err.message);
        return null;
    }
}