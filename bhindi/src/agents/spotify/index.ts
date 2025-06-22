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
            "spotify-access",
            "spotify-refresh"
        ]);
    }

    async executeTool<K extends keyof SpotifyTools>(
        toolName: K,
        parameters: SpotifyTools[K],
        variables?: Record<string, string>
    ): Promise<any> {
        console.log("executeTool impl");
        console.log("executeTool toolName", {toolName});
        console.log("executeTool parameters", {parameters});
        console.log("executeTool variables", {variables});
        // Validate required variables
        const spotifyAccessToken = variables?.["spotify-access"];
        const spotifyRefreshToken = variables?.["spotify-refresh"];

        console.log(`xo spotifyAccessToken : ${spotifyAccessToken}`);
        console.log(`xo spotifyRefreshToken : ${spotifyRefreshToken}`);

        if (!spotifyAccessToken || !spotifyRefreshToken) {
            return createErrorResponse(
                "Need spotify token to be able to connect to spotify",
                400
            );
        }

        try {
            switch (toolName) {
                case "search_tracks":
                    return await this.searchTracks(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "search_artists":
                    return await this.searchArtists(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "create_playlist":
                    return await this.createPlaylist(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "add_tracks_to_playlist":
                    return await this.addTracksToPlaylist(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "remove_tracks_from_playlist":
                    return await this.removeTracksFromPlaylist(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "get_playlist_items":
                    return await this.getPlaylistItems(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "get_current_playback":
                    return await this.getCurrentPlayback(spotifyAccessToken, spotifyRefreshToken);
                
                case "get_recommendations":
                    return await this.getRecommendations(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "get_recently_played":
                    return await this.getRecentlyPlayed(parameters as any, spotifyAccessToken, spotifyRefreshToken);
                
                case "get_user_profile":
                    return await this.getUserProfile(spotifyAccessToken, spotifyRefreshToken);

                case "get_current_user_playlists":
                    return await this.getCurrentUserPlaylists(parameters as any, spotifyAccessToken, spotifyRefreshToken);

                case "add_custom_playlist_cover_image":
                    return await this.addCustomPlaylistCoverImage(parameters as any, spotifyAccessToken, spotifyRefreshToken);

                case "get_available_genre_seeds":
                    return await this.getAvailableGenreSeeds(spotifyAccessToken, spotifyRefreshToken);

                case "save_track_for_user":
                    return await this.saveTrackForUser(parameters as any, spotifyAccessToken, spotifyRefreshToken);

                case "check_user_saved_tracks":
                    return await this.checkUserSavedTracks(parameters as any, spotifyAccessToken, spotifyRefreshToken);

                case "get_user_saved_tracks":
                    return await this.getUserSavedTracks(parameters as any, spotifyAccessToken, spotifyRefreshToken);

                case "get_new_releases":
                    return await this.getNewReleases(parameters as any, spotifyAccessToken, spotifyRefreshToken);

                case "save_album_for_user":
                    return await this.saveAlbumForUser(parameters as any, spotifyAccessToken, spotifyRefreshToken);

                case "get_artist_albums":
                    return await this.getArtistAlbums(parameters as any, spotifyAccessToken, spotifyRefreshToken);

                case "get_artist_top_tracks":
                    return await this.getArtistTopTracks(parameters as any, spotifyAccessToken, spotifyRefreshToken);

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

            // Safely handle empty or non-JSON bodies to avoid "Unexpected end of JSON input"
            let parsed: any = null;
            const raw = await response.text();
            if (raw) {
                try {
                    parsed = JSON.parse(raw);
                } catch (_) {
                    parsed = raw; // Keep plain text if not JSON
                }
            }

            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        code: response.status,
                        message: (parsed && parsed.error?.message) || response.statusText || `HTTP ${response.status}`,
                    },
                };
            }

            return {
                success: true,
                data: parsed,
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

    private async searchTracks(params: { query: string; limit?: number; offset?: number }, token: string, refresh_token: string): Promise<any> {
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

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.searchTracks(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            console.log(`xo error : ${result.error}`);
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        console.log(`xo successs result.data : ${result.data}`);

        return createTextResponse({ data: result.data });
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

    private async createPlaylist(params: { name: string; description?: string; public?: boolean }, token: string, refresh_token: string): Promise<any> {
        const result = await this.makeApiCall('/me/playlists', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                name: params.name,
                description: params.description || 'Created by the Spotify agent',
                public: params.public ?? false,
            }),
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.createPlaylist(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async addTracksToPlaylist(params: { playlist_id: string; track_ids: string[]; position?: number }, token: string, refresh_token: string): Promise<any> {
        const uris = params.track_ids.map(id => `spotify:track:${id}`);
        
        const result = await this.makeApiCall(`/playlists/${params.playlist_id}/tracks`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                uris,
                position: params.position || 0,
            }),
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.addTracksToPlaylist(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async removeTracksFromPlaylist(params: { playlist_id: string; track_ids: string[] }, token: string, refresh_token: string): Promise<any> {
        const tracks = params.track_ids.map(id => ({ uri: `spotify:track:${id}` }));
        
        const result = await this.makeApiCall(`/playlists/${params.playlist_id}/tracks`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tracks }),
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.removeTracksFromPlaylist(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getPlaylistItems(params: { playlist_id: string; limit?: number; offset?: number }, token: string, refresh_token: string): Promise<any> {
        const searchParams = new URLSearchParams({
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.offset && { offset: params.offset.toString() }),
        });

        const result = await this.makeApiCall(`/playlists/${params.playlist_id}/tracks?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.getPlaylistItems(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getCurrentPlayback(token: string, refresh_token: string): Promise<any> {
        const result = await this.makeApiCall('/me/player', {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.getCurrentPlayback(newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.getCurrentPlayback(newAccessToken, refresh_token);
        }

        return createTextResponse({ data: result.data });
    }

    private async getAvailableGenreSeeds(token: string, refresh_token: string): Promise<any>{
        const result = await this.makeApiCall(`/recommendations/available-genre-seeds`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            return await this.getAvailableGenreSeeds(newAccessToken, refresh_token);
        }

        if(!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getRecommendations(params: { seed_genres: string[]; limit?: number; market?: string }, token: string, refresh_token: string): Promise<any> {
        const searchParams = new URLSearchParams({
            seed_genres: params.seed_genres.join(','),
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.market && { market: params.market }),
        });

        const result = await this.makeApiCall(`/recommendations?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.getRecommendations(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });

    }

    private async getRecentlyPlayed(params: { limit?: number }, token: string, refresh_token: string): Promise<any> {
        const searchParams = new URLSearchParams({
            ...(params.limit && { limit: params.limit.toString() }),
        });

        const result = await this.makeApiCall(`/me/player/recently-played?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.getRecentlyPlayed(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getUserProfile(token: string, refresh_token: string): Promise<any> {
        const result = await this.makeApiCall('/me', {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.getUserProfile(newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }
    
        return createTextResponse({ data: result.data });
    }

    private async getCurrentUserPlaylists(params: { limit?: number; offset?: number }, token: string, refresh_token: string): Promise<any> {
        const searchParams = new URLSearchParams({
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.offset && { offset: params.offset.toString() }),
        });

        const result = await this.makeApiCall(`/me/playlists?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            console.log("Refreshed token!: ", newAccessToken);
            return await this.getCurrentUserPlaylists(params, newAccessToken, refresh_token);
        }

        if (!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async addCustomPlaylistCoverImage(params: { playlist_id: string; image_base64: string }, token: string, refresh_token: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/playlists/${params.playlist_id}/images`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'image/jpeg',
                },
                body: params.image_base64,
            });

            // If token expired, refresh and retry once
            if(response.status === 401) {
                const newAccessToken = await refreshToken(refresh_token);
                if(!newAccessToken) {
                    return createErrorResponse('Failed to refresh token', 401);
                }
                return await this.addCustomPlaylistCoverImage(params, newAccessToken, refresh_token);
            }

            if(!response.ok) {
                // Attempt to parse error JSON if any
                let message = response.statusText || `HTTP ${response.status}`;
                try {
                    const errJson = await response.json();
                    message = errJson.error?.message || message;
                } catch(_) {/* ignore parse errors */}
                return createErrorResponse(message, response.status);
            }

            // Successful upload (202)
            return createTextResponse({ data: { message: 'Image uploaded', status: response.status } });

        } catch(error) {
            return createErrorResponse(error instanceof Error ? error.message : 'Network error', 500);
        }
    }
    
    private async checkUserSavedTracks(params: { track_ids: string[] }, token: string, refresh_token: string): Promise<any> {
        const ids = params.track_ids.join(',');
        const result = await this.makeApiCall(`/me/tracks/contains?ids=${ids}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            return await this.checkUserSavedTracks(params, newAccessToken, refresh_token);
        }

        if(!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getUserSavedTracks(params: { limit?: number; offset?: number; market?: string }, token: string, refresh_token: string): Promise<any> {
        const searchParams = new URLSearchParams({
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.offset && { offset: params.offset.toString() }),
            ...(params.market && { market: params.market }),
        });

        const result = await this.makeApiCall(`/me/tracks?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            return await this.getUserSavedTracks(params, newAccessToken, refresh_token);
        }

        if(!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getNewReleases(params: { limit?: number; offset?: number; country?: string }, token: string, refresh_token: string): Promise<any> {
        const searchParams = new URLSearchParams({
            ...(params.country && { country: params.country }),
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.offset && { offset: params.offset.toString() }),
        });

        const result = await this.makeApiCall(`/browse/new-releases?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            return await this.getNewReleases(params, newAccessToken, refresh_token);
        }

        if(!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async saveAlbumForUser(params: { album_ids: string[] }, token: string, refresh_token: string): Promise<any> {
        const ids = params.album_ids.join(',');
        const result = await this.makeApiCall(`/me/albums?ids=${ids}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse('Failed to refresh token', 401);
            }
            return await this.saveAlbumForUser(params, newAccessToken, refresh_token);
        }

        if(!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: { message: 'Albums saved', status: 200 } });
    }

    private async getArtistAlbums(params: { artist_id: string; include_groups?: string; market?: string; limit?: number; offset?: number }, token: string, refresh_token: string): Promise<any> {
        const { artist_id, include_groups, market, limit, offset } = params;
        const searchParams = new URLSearchParams({
            ...(include_groups && { include_groups }),
            ...(market && { market }),
            ...(limit && { limit: limit.toString() }),
            ...(offset && { offset: offset.toString() }),
        });

        const result = await this.makeApiCall(`/artists/${artist_id}/albums?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            return await this.getArtistAlbums(params, newAccessToken, refresh_token);
        }

        if(!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async getArtistTopTracks(params: { artist_id: string; market: string }, token: string, refresh_token: string): Promise<any> {
        const { artist_id, market } = params;
        const result = await this.makeApiCall(`/artists/${artist_id}/top-tracks?market=${market}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse("Failed to refresh token", 401);
            }
            return await this.getArtistTopTracks(params, newAccessToken, refresh_token);
        }

        if(!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: result.data });
    }

    private async saveTrackForUser(params: { track_ids: string[] }, token: string, refresh_token: string): Promise<any> {
        const ids = params.track_ids.join(',');
        const result = await this.makeApiCall(`/me/tracks?ids=${ids}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if(result.error?.code === 401) {
            const newAccessToken = await refreshToken(refresh_token);
            if(!newAccessToken) {
                return createErrorResponse('Failed to refresh token', 401);
            }
            return await this.saveTrackForUser(params, newAccessToken, refresh_token);
        }

        if(!result.success) {
            return createErrorResponse(result.error!.message, result.error!.code);
        }

        return createTextResponse({ data: { message: 'Tracks saved', status: 200 } });
    }
}
