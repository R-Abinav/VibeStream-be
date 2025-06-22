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
    get_current_user_playlists: {
        limit?: number;
        offset?: number;
    };
    add_custom_playlist_cover_image: {
        playlist_id: string;
        image_base64: string; // Raw Base64 string (not data URI)
    };
    get_available_genre_seeds: Record<string, never>;
    save_track_for_user: {
        track_ids: string[]; // ≤ 50 Spotify track IDs
    };
    check_user_saved_tracks: {
        track_ids: string[]; // ≤ 50 track IDs
    };
    get_user_saved_tracks: {
        limit?: number;
        offset?: number;
        market?: string;
    };
    get_new_releases: {
        limit?: number;
        offset?: number;
        country?: string;
    };
    save_album_for_user: {
        album_ids: string[]; // ≤ 50 album IDs
    };
    get_artist_albums: {
        artist_id: string;
        include_groups?: string; // comma-separated list per Spotify docs
        market?: string;
        limit?: number;
        offset?: number;
    };
    get_artist_top_tracks: {
        artist_id: string;
        market: string; // Required
    };
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
    {
        name: "get_current_user_playlists",
        description: "Get playlists owned or followed by the current user (GET /me/playlists)",
        parameters: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of playlists to return (1–50)" },
                offset: { type: "number", description: "Offset for paging, multiple of limit" },
            },
            required: [],
        },
    },
    {
        name: "add_custom_playlist_cover_image",
        description: "Upload a custom JPEG image (Base64 encoded) as a playlist cover",
        parameters: {
            type: "object",
            properties: {
                playlist_id: { type: "string", description: "Target playlist ID" },
                image_base64: { type: "string", description: "Base64-encoded JPEG image data (no data URI prefix)" },
            },
            required: ["playlist_id", "image_base64"],
        },
    },
    {
        name: "get_available_genre_seeds",
        description: "Retrieve the list of available genre seeds for recommendations",
        parameters: { type: "object", properties: {}, required: [] },
    },
    {
        name: "save_track_for_user",
        description: "Save one or more tracks to the current user's library",
        parameters: {
            type: "object",
            properties: {
                track_ids: {
                    type: "array",
                    description: "Array of track IDs to save (max 50)",
                    items: { type: "string" },
                },
            },
            required: ["track_ids"],
        },
    },
    {
        name: "check_user_saved_tracks",
        description: "Check if the current user has saved particular tracks",
        parameters: {
            type: "object",
            properties: {
                track_ids: {
                    type: "array",
                    description: "Array of track IDs to check (max 50)",
                    items: { type: "string" },
                },
            },
            required: ["track_ids"],
        },
    },
    {
        name: "get_user_saved_tracks",
        description: "Retrieve tracks saved in the user's library",
        parameters: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of items to return (1–50)" },
                offset: { type: "number", description: "Offset for paging" },
                market: { type: "string", description: "Market code (optional)" },
            },
            required: [],
        },
    },
    {
        name: "get_new_releases",
        description: "Get a list of new album releases featured on Spotify",
        parameters: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of items to return (1–50)" },
                offset: { type: "number", description: "Offset for paging" },
                country: { type: "string", description: "Country code (optional)" },
            },
            required: [],
        },
    },
    {
        name: "save_album_for_user",
        description: "Save one or more albums to the user's library",
        parameters: {
            type: "object",
            properties: {
                album_ids: {
                    type: "array",
                    description: "Array of album IDs to save (max 50)",
                    items: { type: "string" },
                },
            },
            required: ["album_ids"],
        },
    },
    {
        name: "get_artist_albums",
        description: "Get an artist's albums",
        parameters: {
            type: "object",
            properties: {
                artist_id: { type: "string", description: "Spotify artist ID" },
                include_groups: { type: "string", description: "Filter by album groups, comma separated" },
                market: { type: "string", description: "Market code" },
                limit: { type: "number", description: "Number of items (1–50)" },
                offset: { type: "number", description: "Offset for paging" },
            },
            required: ["artist_id"],
        },
    },
    {
        name: "get_artist_top_tracks",
        description: "Get an artist's top tracks by market",
        parameters: {
            type: "object",
            properties: {
                artist_id: { type: "string", description: "Spotify artist ID" },
                market: { type: "string", description: "Market code (required by Spotify)" },
            },
            required: ["artist_id", "market"],
        },
    },
];
