import { Tool } from "../../types";

// Generic Spotify actions that don't require device or explicit user IDs
export interface SpotifyTools {
    search_tracks: {
        query: string;
        limit?: number;
        offset?: number;
    };
    search_artists: {
        query: string;
        limit?: number;
        offset?: number;
    };
    create_playlist: {
        name: string;
        description?: string;
        public?: boolean;
    };
    add_tracks_to_playlist: {
        playlist_id: string;
        track_ids: string[]; // IDs returned from search_tracks
        position?: number;
    };
    remove_tracks_from_playlist: {
        playlist_id: string;
        track_ids: string[];
    };
    get_playlist_items: {
        playlist_id: string;
        limit?: number;
        offset?: number;
    };
    get_current_playback: Record<string, never>;
    get_recommendations: {
        seed_genres: string[]; // at least 1, max 5
        limit?: number;
        market?: string;
    };
    get_recently_played: {
        limit?: number;
    };
    get_user_profile: Record<string, never>; // current user
}

export const spotifyTools: Tool[] = [
    {
        name: "search_tracks",
        description: "Search for tracks matching a query",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search query text" },
                limit: { type: "number", description: "Number of items to return (1–50)" },
                offset: { type: "number", description: "Index of the first result to return" },
            },
            required: ["query"],
        },
    },
    {
        name: "search_artists",
        description: "Search for artists matching a query",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search query text" },
                limit: { type: "number", description: "Number of items to return (1–50)" },
                offset: { type: "number", description: "Index of the first result to return" },
            },
            required: ["query"],
        },
    },
    {
        name: "create_playlist",
        description: "Create a playlist for the current user",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "Playlist name" },
                description: { type: "string", description: "Playlist description" },
                public: { type: "boolean", description: "Whether playlist is public" },
            },
            required: ["name"],
        },
    },
    {
        name: "add_tracks_to_playlist",
        description: "Add tracks to a playlist",
        parameters: {
            type: "object",
            properties: {
                playlist_id: { type: "string", description: "Playlist ID" },
                track_ids: {
                    type: "array",
                    description: "Array of track IDs (max 100) to add",
                    items: { type: "string" },
                },
                position: { type: "number", description: "Insert position (optional)" },
            },
            required: ["playlist_id", "track_ids"],
        },
    },
    {
        name: "remove_tracks_from_playlist",
        description: "Remove tracks from a playlist",
        parameters: {
            type: "object",
            properties: {
                playlist_id: { type: "string", description: "Playlist ID" },
                track_ids: {
                    type: "array",
                    description: "Array of track IDs to remove",
                    items: { type: "string" },
                },
            },
            required: ["playlist_id", "track_ids"],
        },
    },
    {
        name: "get_playlist_items",
        description: "Get items in a playlist",
        parameters: {
            type: "object",
            properties: {
                playlist_id: { type: "string", description: "Playlist ID" },
                limit: { type: "number", description: "Number of items to return (1–100)" },
                offset: { type: "number", description: "Offset for paging" },
            },
            required: ["playlist_id"],
        },
    },
    {
        name: "get_current_playback",
        description: "Get current playback state",
        parameters: { type: "object", properties: {}, required: [] },
    },
    {
        name: "get_recommendations",
        description: "Get track recommendations based on genres",
        parameters: {
            type: "object",
            properties: {
                seed_genres: {
                    type: "array",
                    description: "Seed genres (1–5)",
                    items: { type: "string" },
                },
                limit: { type: "number", description: "Number of recommendations (1–100)" },
                market: { type: "string", description: "Market code (optional)" },
            },
            required: ["seed_genres"],
        },
    },
    {
        name: "get_recently_played",
        description: "Get user's recently played tracks",
        parameters: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of items to return (1–50)" },
            },
            required: [],
        },
    },
    {
        name: "get_user_profile",
        description: "Get current user's profile information",
        parameters: { type: "object", properties: {}, required: [] },
    },
];
