import express, { RequestHandler } from 'express';
//@ts-ignore
import ENV from './config/env.config';

import crypto from 'crypto';
//@ts-ignore
import cors from 'cors';

import querystring from 'querystring';
import axios from 'axios';
import { AgentMap, AgentRegistry } from './bhindi/src/agents/registry';
import { createErrorResponse } from './bhindi/src/utils/response';
import { checkApiKey, checkOAuthTokens, checkVariables } from './bhindi/src/middleware/auth';

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

//@ts-ignore
app.get('/health', (req, res) => {
    return res.status(200).json({ 
        message: 'Works bhai! Healthy' 
    });
});

//@ts-ignore
// - `user-read-private` - Read user profile
// - `user-read-recently-played` - Get recently played tracks
// - `playlist-modify-private` - Create/modify private playlists
// - `playlist-read-private` - Read private playlists
// - `user-read-playback-state` - Get current playback state
// - `playlist-modify-public` - Create/modify public playlists
app.get('/api/spotify-login', (req, res) => {
    try{
        console.log("Spotify Login");
        const scope = 'user-read-recently-played user-read-private user-read-email user-top-read playlist-modify-private playlist-read-private user-read-playback-state playlist-modify-public';
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

//@ts-ignore
app.get('/api/callback', async (req, res) => {
    try{
        const { code, state, error } = req.query;

        //Validate state
        //@ts-ignore
        if(!state || !stateStore.has(state.split('.')[0])){
            return res.status(400).redirect(`${ENV.CLIENT_URL}/login?error=invalid_state`);
        }

        //@ts-ignore
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

        //@ts-ignore
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', formData, authHeader, { json: true });

        res.redirect(`${ENV.CLIENT_URL}/?access_token=${tokenResponse.data.access_token}&refresh_token=${tokenResponse.data.refresh_token}&expires_in=${tokenResponse.data.expires_in}`);
    }catch(err){
        console.error('Callback error:', err);
        res.redirect(`${ENV.CLIENT_URL}/login?error=auth_failed`);
    }
});

//@ts-ignore
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
        //@ts-ignore
        console.error('Fetching user info error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

//Refresh token
//@ts-ignore
// app.post('/api/refresh-token', async (req, res) => {
//     try{
//         const { refresh_token } = req.body;

//         const postHeaders = {
//             'Content-Type': 'application/json',
//             'Authorization': `Basic ${Buffer.from(`${ENV.SPOTIFY_CLIENT_ID}:${ENV.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
//         }

//         const postForm = {
//             grant_type: 'refresh_token',
//             refresh_token: refresh_token,
//         }

//         //@ts-ignore
//         const response = await axios.post('https://accounts.spotify.com/api/token', postForm, postHeaders, { json: true });

//         console.log("Response for refresh token -> ",response);
//         res.json({
//             access_token: response.data.access_token,
//             expires_in: response.data.expires_in 
//         });
//     }catch(err){
//         //@ts-ignore
//         console.error('Refresh error:', err.response?.data || err.message);
//         res.status(401).json({ error: 'Token refresh failed' });
//     }
// })

// GET /:agent
const getAgentHandler: RequestHandler<{ agent: keyof AgentMap }> = (
    req,
    res
  ) => {
    const { agent } = req.params;
    const agentHandler = AgentRegistry.getInstance().getAgent(agent);
    if (!agentHandler) {
      res.status(404).json(createErrorResponse(`Agent ${agent} not found`, 404));
      return;
    }
    res.json({ status: "ok" });
    return;
  };
  
  // GET /:agent/tools
  const getToolsHandler: RequestHandler<{ agent: keyof AgentMap }> = (
    req,
    res
  ) => {
    console.log("getToolsHandler");
    try {
      const { agent } = req.params;
      console.log("agent", agent);

      const agentHandler = AgentRegistry.getInstance().getAgent(agent);

      console.log("agentHandler", agentHandler);
  
      if (!agentHandler) {
        res
          .status(404)
          .json(createErrorResponse(`Agent ${agent} not found`, 404));
        return;
      }
  
      const response = agentHandler.getTools();
      console.log("response tools", response);
      res.json(response);
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(
            error instanceof Error ? error.message : "Unknown error"
          )
        );
    }
  };
  
  // POST /:agent/tools/:toolName
  const executeToolHandler: RequestHandler<{
    agent: keyof AgentMap;
    toolName: string;
  }> = async (req, res) => {

    console.log("executeToolHandler");
    console.log("req", {req});
    console.log("res", {res});
    const { agent, toolName } = req.params;

    console.log("executeToolHandler");
    console.log("agent", {agent});
    console.log("toolName", {toolName});
    
    const parameters = req.body;

    console.log("parameters", parameters);
  
    const agentHandler = AgentRegistry.getInstance().getAgent(agent);
    console.log("agentHandler", {agentHandler});
    if (!agentHandler) {
      res.status(404).json(createErrorResponse(`Agent ${agent} not found`, 404));
      return;
    }

    console.log("agent validation done");
  
    const validateApiKeyResponse = checkApiKey(req);
    if (!validateApiKeyResponse.success) {
      res.status(401).json(validateApiKeyResponse);
      return;
    }

    console.log("api key validation done");
  
    const agentInfo = agentHandler.getAgentInfo();
    console.log("agentInfo", {agentInfo});
    let oauthTokens: Record<string, string> | undefined;
    if (agentInfo.oauth.length > 0) {
      console.log("oauth validation");
      const validateOAuthTokensResponse = checkOAuthTokens(req, agentInfo.oauth);
      console.log("validateOAuthTokensResponse", {validateOAuthTokensResponse});
      if (!validateOAuthTokensResponse.success) {
        res.status(401).json(validateOAuthTokensResponse);
        return;
      }
      oauthTokens = validateOAuthTokensResponse.tokens;
      console.log("oauthTokens", {oauthTokens});
    }


  
    let variables: Record<string, string> | undefined;
    console.log("agentInfo.variables", {agentInfo});
    if (agentInfo.variables.length > 0) {
      console.log("variables validation");
      const validateVariablesResponse = checkVariables(req, agentInfo.variables);
      console.log("validateVariablesResponse", {validateVariablesResponse});
      if (!validateVariablesResponse.success) {
        res.status(401).json(validateVariablesResponse);
        return;
      }
      console.log("setting variables");
      variables = validateVariablesResponse.variables;
      console.log("getting variables", {variables});
    }

    console.log("executing tool");
    console.log("agentHandler", {agentHandler});
    const result = await (agentHandler as any).executeTool(
      toolName,
      parameters,
      variables
    );
    console.log("result", {result});
    if (result.success) {
      console.log("result success", {result});
      res.json(result).status(200);
    } else {
      console.log("result error", {result});
      res.json(result).status(result.error.code);
    }
  };



//bhindi
app.get("/:agent/tools", getToolsHandler);
app.post("/:agent/tools/:toolName", executeToolHandler);
app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/:agent", getAgentHandler);

//@ts-ignore
app.listen(port, "127.0.0.1", () => {
    console.log(`Server is running on ${port} in ${mode} mode`);
});