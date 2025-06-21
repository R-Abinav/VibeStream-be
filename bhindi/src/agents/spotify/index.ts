import { refreshToken } from "../../utils/refreshToken";
import { createErrorResponse, createTextResponse } from "../../utils/response";
import { BaseAgentHandler } from "../base-agent";
import { spotifyTools, SpotifyTools } from "./tools";

interface SpotifyApiResponse {
    success: boolean;
    data?: any;
    error?: {
        code: number;
        message: string;
    };
}

export class SpotifyAgent extends BaseAgentHandler<SpotifyTools> {
    private readonly baseUrl = "https://api.spotify.com/v1";

    constructor() {
        super(spotifyTools, [], [
            "spotify-access-token",
            "spotify-refresh-token"
        ]);
    }

    async executeTool<K extends keyof SpotifyTools>(
        toolName: K,
        parameters: SpotifyTools[K],
        variables?: Record<string, string>
    ): Promise<any> {
        // Validate required variables
        const spotifyAccessToken = variables?.["spotify-access-token"];
        const spotifyRefreshToken = variables?.["spotify-refresh-token"];

        if (!spotifyAccessToken || !spotifyRefreshToken) {
            return createErrorResponse(
                "Need spotify token to be able to connect to spotify",
                400
            );
        }

        try {
            switch (toolName) {
                case "search_tracks":
                    return await this.searchTracks(parameters as any, spotifyAccessToken);
                
                case "search_artists":
                    return await this.searchArtists(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "create_playlist":
                    return await this.createPlaylist(parameters as any, spotifyAccessToken);
                
                case "add_tracks_to_playlist":
                    return await this.addTracksToPlaylist(parameters as any, spotifyAccessToken);
                
                case "remove_tracks_from_playlist":
                    return await this.removeTracksFromPlaylist(parameters as any, spotifyAccessToken);
                
                case "get_playlist_items":
                    return await this.getPlaylistItems(parameters as any, spotifyAccessToken);
                
                case "get_current_playback":
                    return await this.getCurrentPlayback(spotifyAccessToken);
                
                case "get_recommendations":
                    return await this.getRecommendations(parameters as any, spotifyAccessToken);
                
                case "get_recently_played":
                    return await this.getRecentlyPlayed(parameters as any, spotifyAccessToken);
                
                case "get_user_profile":
                    return await this.getUserProfile(spotifyAccessToken);

                default:
                    return createErrorResponse(
                        `Tool ${String(toolName)} not implemented`,
                        404
                    );
            }
        } catch (error) {
            return createErrorResponse(
                `Error executing ${String(toolName)}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }

    private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<SpotifyApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        code: response.status,
                        message: data.error?.message || `HTTP ${response.status}`,
                    },
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 500,
                    message: error instanceof Error ? error.message : 'Network error',
                },
            };
        }
    }

    private async searchTracks(params: { query: string; limit?: number; offset?: number }, token: string) {
        console.log(`xo token : ${token}`);
        const searchParams = new URLSearchParams({
            q: params.query,
            type: 'track',
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.offset && { offset: params.offset.toString() }),
        });

        console.log(`xo searchParams : ${searchParams}`);

        const result = await this.makeApiCall(`/search?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        console.log(`xo result : ${result}`);

        if (!result.success) {
            console.log(`xo error : ${result.error}`);
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        console.log(`xo successs result.data : ${result.data}`);

        return createTextResponse({ data: `successful got respose ${result.data}`});
    }

    private async searchArtists(params: { query: string; limit?: number; offset?: number }, token: string, refresh_token: string): Promise<any>{
        console.log(`${token}`);
        const searchParams = new URLSearchParams({
            q: params.query,
            type: 'artist',
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.offset && { offset: params.offset.toString() }),
        });
        console.log("Search Artists......");

        const result = await this.makeApiCall(`/search?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        console.log("Got the result!: ", result);

        //Failure logic
        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.searchArtists(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            console.log("Error!: ", result.error);
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        console.log("Success!: ", result.data);
        return createTextResponse({ data: result.data });
    }

    private async createPlaylist(params: { name: string; description?: string; public?: boolean }, token: string) {
        const result = await this.makeApiCall('/me/playlists', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                name: params.name,
                description: params.description || 'Created by the Spotify agent',
                public: params.public ?? false,
            }),
        });

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async addTracksToPlaylist(params: { playlist_id: string; track_ids: string[]; position?: number }, token: string) {
        const uris = params.track_ids.map(id => `spotify:track:${id}`);
        
        const result = await this.makeApiCall(`/playlists/${params.playlist_id}/tracks`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                uris,
                position: params.position || 0,
            }),
        });

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async removeTracksFromPlaylist(params: { playlist_id: string; track_ids: string[] }, token: string) {
        const tracks = params.track_ids.map(id => ({ uri: `spotify:track:${id}` }));
        
        const result = await this.makeApiCall(`/playlists/${params.playlist_id}/tracks`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tracks }),
        });

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getPlaylistItems(params: { playlist_id: string; limit?: number; offset?: number }, token: string) {
        const searchParams = new URLSearchParams({
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.offset && { offset: params.offset.toString() }),
        });

        const result = await this.makeApiCall(`/playlists/${params.playlist_id}/tracks?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getCurrentPlayback(token: string) {
        const result = await this.makeApiCall('/me/player', {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getRecommendations(params: { seed_genres: string[]; limit?: number; market?: string }, token: string) {
        const searchParams = new URLSearchParams({
            seed_genres: params.seed_genres.join(','),
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.market && { market: params.market }),
        });

        const result = await this.makeApiCall(`/recommendations?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getRecentlyPlayed(params: { limit?: number }, token: string) {
        const searchParams = new URLSearchParams({
            ...(params.limit && { limit: params.limit.toString() }),
        });

        const result = await this.makeApiCall(`/me/player/recently-played?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getUserProfile(token: string) {
        const result = await this.makeApiCall('/me', {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }
}
