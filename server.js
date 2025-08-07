import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;


// 🟩 Fetch Anime List (Search or Discover)
app.get('/api/tmdb/anime', async (req, res) => {
  const query = req.query.q;
  const endpoint = query
    ? `/search/tv?language=en-US&query=${encodeURIComponent(query)}`
    : `/discover/tv?language=en-US&sort_by=popularity.desc&with_origin_country=JP`;

  try {
    const response = await fetch(`${BASE_URL}${endpoint}&api_key=${API_KEY}`);
    const json = await response.json();

    const results = (json.results || []).map(tv => ({
      id: tv.id,
      title: tv.name,
      poster: tv.poster_path ? `https://image.tmdb.org/t/p/w400${tv.poster_path}` : '',
      genres: [],
      rating: tv.vote_average.toFixed(1),
      year: tv.first_air_date?.split('-')[0] || 'N/A',
      status: 'Completed',
      episodes: tv.episode_count || 12,
      synopsis: tv.overview,
      studio: 'TMDB Studios'
    }));

    res.json({ success: true, data: results, total: results.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'TMDB fetch failed' });
  }
});

// 🟩 Fetch Anime Details by ID
app.get('/api/tmdb/anime/:id', async (req, res) => {
  
  const { id } = req.params;

  try {
    const response = await fetch(`${BASE_URL}/tv/${id}?language=en-US&api_key=${API_KEY}`);
    const tv = await response.json();

    res.json({
      success: true,
      data: {
        id: tv.id,
        title: tv.name,
        poster: tv.poster_path ? `https://image.tmdb.org/t/p/w400${tv.poster_path}` : '',
        genres: tv.genres.map(g => g.name),
        rating: tv.vote_average.toFixed(1),
        year: tv.first_air_date?.split('-')[0] || 'N/A',
        status: tv.status || 'Unknown',
        episodes: tv.number_of_episodes || 12,
        synopsis: tv.overview,
        studio: tv.networks.map(n => n.name).join(', ') || 'Unknown'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Details fetch failed' });
  }
});

// 🟩 Fetch Episodes for a Season
app.get('/api/tmdb/anime/:id/season/:season', async (req, res) => {
  
  const { id, season } = req.params;

  try {
    const response = await fetch(`${BASE_URL}/tv/${id}/season/${season}?language=en-US&api_key=${API_KEY}`);
    const seasonData = await response.json();

    const episodes = seasonData.episodes.map(ep => ({
      id: ep.id,
      animeId: id,
      episodeNumber: ep.episode_number,
      title: ep.name || `Episode ${ep.episode_number}`,
      thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w400${ep.still_path}` : '',
      duration: `${ep.runtime || 24}:00`,
      videoUrl: ''
    }));

    res.json({ success: true, data: episodes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Episodes fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
