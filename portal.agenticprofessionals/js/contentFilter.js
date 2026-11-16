/**
 * SkillPedia Content Moderation & Safety Filter (Tier 1 Guardrails & YouTube SafeSearch)
 */

const SAFETY_BLACKLIST = [
  // Weapons & Explosives
  'bomb', 'explosive', 'grenade', 'dynamite', 'gun', 'firearm', 'ammunition', 'weapon',
  'detonator', 'ied', 'poison', 'toxic chemical', 'biohazard',
  // Illegal & Harmful Acts
  'hacking', 'ransomware', 'malware', 'phishing', 'counterfeit', 'illicit drug',
  'meth', 'cocaine', 'heroin', 'suicide', 'self-harm', 'assassination',
  // Explicit / Adult Content
  'porn', 'porno', 'pornography', 'xxx', 'erotic', 'nsfw', 'naked', 'sex video', 'hentai', 'nude'
];

/**
 * Checks if a user prompt violates platform safety policies
 * @param {string} prompt 
 * @returns {object} { safe: boolean, reason?: string }
 */
function sanitizeAndCheckPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { safe: false, reason: 'Please enter a valid skill learning topic.' };
  }

  const cleanPrompt = prompt.trim().toLowerCase();
  
  if (cleanPrompt.length < 3) {
    return { safe: false, reason: 'Topic description is too short. Please enter a specific skill.' };
  }

  // Check against safety blacklist keywords
  for (const term of SAFETY_BLACKLIST) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(cleanPrompt)) {
      return {
        safe: false,
        reason: `SkillPedia is a vocational skill learning portal. The topic "${term}" violates our community safety guidelines.`
      };
    }
  }

  return { safe: true };
}

/**
 * Validates a creator-inserted YouTube video URL/ID for age restrictions, explicit keywords & embedding safety
 */
async function validateYouTubeUrlSafety(videoIdOrUrl) {
  if (!videoIdOrUrl) {
    return { safe: false, reason: 'Please provide a valid YouTube video URL or ID.' };
  }

  // Extract 11-char video ID
  let videoId = videoIdOrUrl.trim();
  const match = videoId.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (match) videoId = match[1];

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return { safe: false, reason: 'Invalid YouTube video ID format.' };
  }

  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      signal: ctrl.signal
    });

    if (!res.ok) {
      return { safe: false, reason: 'This YouTube video is unavailable, deleted, or disabled for embedding.' };
    }

    const data = await res.json();
    const title = (data.title || '').toLowerCase();
    const author = (data.author_name || '').toLowerCase();

    // Check title against safety blacklist
    for (const term of SAFETY_BLACKLIST) {
      if (title.includes(term) || author.includes(term)) {
        return {
          safe: false,
          reason: `Video blocked: The title "${data.title}" violates SkillPedia community guidelines.`
        };
      }
    }

    return { safe: true, videoId, title: data.title, author: data.author_name };
  } catch (err) {
    return { safe: false, reason: 'Could not verify YouTube video safety. Please try a different video link.' };
  }
}
