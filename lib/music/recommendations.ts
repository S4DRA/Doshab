import type { MusicTrack } from "./types";

const genres = ["alternative rock", "indie rock", "indie pop", "deep house", "progressive house", "tech house", "synth pop", "k pop", "afrobeats", "reggaeton", "hip hop", "rhythm and blues", "r&b", "heavy metal", "lo fi", "electronic", "ambient", "techno", "trance", "house", "disco", "funk", "soul", "jazz", "blues", "classical", "country", "folk", "reggae", "rock", "pop", "rap", "metal"];
const moods = ["acoustic", "instrumental", "chill", "relaxing", "melancholic", "upbeat", "dance", "piano"];
const languages: Record<string, string> = { fa: "Persian", tr: "Turkish", ar: "Arabic", hi: "Hindi", ko: "Korean", ja: "Japanese", es: "Spanish", fr: "French", de: "German", ru: "Russian", pt: "Portuguese" };
const languageTags: Record<string, string[]> = { fa: ["persian", "farsi", "iranian"], tr: ["turkish", "türkçe"], ar: ["arabic"], hi: ["hindi", "bollywood"], ko: ["korean", "k pop"], ja: ["japanese", "j pop"], es: ["spanish"], fr: ["french"], de: ["german"], ru: ["russian"], pt: ["portuguese", "brazilian"] };
const normalize = (value: string) => value.toLowerCase().normalize("NFKC").replace(/[_-]+/g, " ").replace(/[^\p{L}\p{N}&\s]/gu, " ").replace(/\b(?:kpop|hiphop|rnb|lofi|synthpop)\b/g, (term) => ({ kpop: "k pop", hiphop: "hip hop", rnb: "r&b", lofi: "lo fi", synthpop: "synth pop" })[term]!).replace(/\s+/g, " ").trim();

// Only bounded, recognized musical descriptors enter the room metadata or search query.
export function musicTaste(tags: string[], topics: string[], language?: string): NonNullable<MusicTrack["taste"]> {
  const text = ` ${normalize(tags.join(" "))} `;
  const topicText = ` ${normalize(topics.map((topic) => topic.split("/").at(-1) ?? "").join(" "))} `;
  const matches = genres.filter((genre) => text.includes(` ${genre} `));
  const selected = matches.length ? matches : genres.filter((genre) => topicText.includes(` ${genre} `));
  const inferredLanguage = Object.entries(languageTags).find(([, words]) => words.some((word) => text.includes(` ${word} `)))?.[0];
  const audioLanguage = language && /^[a-z]{2,3}(?:-[\w]+)?$/i.test(language) ? language.toLowerCase() : inferredLanguage;
  return {
    genres: selected.filter((genre) => !selected.some((other) => other !== genre && other.includes(genre))).slice(0, 3),
    moods: moods.filter((mood) => text.includes(` ${mood} `)).slice(0, 2),
    ...(audioLanguage ? { language: audioLanguage } : {}),
  };
}

export function artistIdentity(track: MusicTrack) {
  // Upload channels can be labels; artist-prefixed titles are a stronger signal.
  const prefix = track.title.split(/\s+[-–—]\s+/);
  return normalize(prefix.length > 1 ? prefix[0] : track.artist).replace(/(?:\s*(?:vevo|official|topic))+\s*$/g, "").trim();
}

function songIdentity(track: MusicTrack) {
  return normalize(track.title.replace(/\([^)]*\)|\[[^\]]*\]/g, "").replace(/\b(?:official|music video|lyrics?|audio|hd|4k)\b/gi, ""));
}

export function discoveryQueries(track: MusicTrack) {
  const styles = track.taste?.genres.length ? track.taste.genres : track.genre && track.genre !== "Music" ? [track.genre] : [];
  if (!styles.length) return [`${artistIdentity(track)} similar artists songs`];
  const style = styles[0];
  const mood = track.taste?.moods[0] ?? "";
  const language = languages[track.taste?.language?.split("-")[0] ?? ""] ?? "";
  return [...new Set([`${language} ${style} ${mood} music official audio`, `${language} ${styles.at(-1)} songs official music video`].map((query) => query.replace(/\s+/g, " ").trim()))];
}

export function selectAutoplayTrack(seed: MusicTrack, candidates: MusicTrack[], excludedIds: string[], random = Math.random): MusicTrack | null {
  const excluded = new Set([seed.id, ...excludedIds]);
  const seen = new Set<string>();
  const seedArtist = artistIdentity(seed);
  const eligible = candidates.filter((track) => {
    const song = songIdentity(track);
    if (excluded.has(track.id) || song === songIdentity(seed) || seen.has(song)) return false;
    seen.add(song);
    // Avoid turning a single-song session into a long compilation or DJ set.
    return seed.duration > 900 || track.duration <= Math.max(600, seed.duration * 2);
  });
  const ranked = eligible.map((track) => {
    const overlap = track.taste?.genres.filter((genre) => seed.taste?.genres.includes(genre)).length ?? 0;
    const mood = track.taste?.moods.filter((value) => seed.taste?.moods.includes(value)).length ?? 0;
    const different = artistIdentity(track) !== seedArtist;
    const languageMismatch = seed.taste?.language && track.taste?.language && seed.taste.language.split("-")[0] !== track.taste.language.split("-")[0];
    return { track, different, weight: (1 + overlap * 4 + mood * 2) * (languageMismatch ? 0.35 : 1) };
  });
  // When known genre matches exist, unrelated search hits must not dilute them.
  const matching = ranked.filter(({ track }) => track.taste?.genres.some((genre) => seed.taste?.genres.includes(genre)));
  const pool = matching.length ? matching : ranked;
  const different = pool.filter((item) => item.different);
  const same = pool.filter((item) => !item.different);
  const choices = different.length && (!same.length || random() < 0.85) ? different : same.length ? same : pool;
  const counts = new Map<string, number>();
  for (const item of choices) { const artist = artistIdentity(item.track); counts.set(artist, (counts.get(artist) ?? 0) + 1); }
  const balanced = choices.map((item) => ({ ...item, weight: item.weight / counts.get(artistIdentity(item.track))! }));
  let cursor = random() * balanced.reduce((sum, item) => sum + item.weight, 0);
  for (const item of balanced) { cursor -= item.weight; if (cursor < 0) return item.track; }
  return choices.at(-1)?.track ?? null;
}
