/**
 * SkillPedia Standardized Data Schemas
 * 🔍 EXTENSIVE DEBUG LOGGING ENABLED
 */

const CURRICULUM_TYPES = {
  NSQF_OFFICIAL: 'nsqf_official',
  CUSTOM_AI: 'custom_ai'
};

const REEL_STANDARD_COUNT = 11;

/**
 * Validates a Curriculum object structure
 */
function validateCurriculum(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.id || !data.title || !data.type) return false;
  if (!Array.isArray(data.lessons)) return false;
  return true;
}

/**
 * Formats a raw curriculum object into the standardized 11-reel format
 */
function formatStandardizedCurriculum(raw) {
  console.log(`%c[SCHEMA] formatStandardizedCurriculum() called`, 'color: #f59e0b; font-weight: bold');
  console.log(`  [SCHEMA] Input: id="${raw.id}" title="${raw.title}" type="${raw.type}"`);
  console.log(`  [SCHEMA] Input lessons count: ${raw.lessons?.length || 0}`);
  
  if (raw.lessons) {
    raw.lessons.forEach((l, i) => {
      console.log(`  [SCHEMA] INPUT lesson[${i}]: video_id="${l.video_id}" title="${l.title?.substring(0, 50)}"`);
    });
  }

  const rawLessons = raw.lessons || [];
  const lessons = rawLessons.slice(0, REEL_STANDARD_COUNT).map((lesson, idx) => {
    const originalVideoId = lesson.video_id;
    const isBlacklisted = originalVideoId === 'mQ-05b1b4vA' || originalVideoId === 'Vk6d0lzAtaQ';

    if (!originalVideoId || isBlacklisted) {
      const errMessage = `[Schema Integrity Error] Reel ${idx + 1} ("${lesson.title || 'Untitled'}") is missing a valid YouTube video ID!`;
      console.error(`  [SCHEMA] ❌ ${errMessage}`);
      throw new Error(errMessage);
    }

    return {
      id: lesson.id || `les_${idx + 1}`,
      reel_index: idx + 1,
      nos_code: lesson.nos_code || `MODULE-${String(idx + 1).padStart(2, '0')}`,
      title: lesson.title || `Lesson ${idx + 1}`,
      subtitle: lesson.subtitle || 'Skill learning objective',
      video_platform: lesson.video_platform || 'youtube',
      video_id: originalVideoId,
      pcs: Array.isArray(lesson.pcs) ? lesson.pcs : ['PC1. Demonstrate basic technique cleanly and safely.']
    };
  });

  const result = {
    id: raw.id || `CURR-${Date.now()}`,
    type: raw.type || CURRICULUM_TYPES.CUSTOM_AI,
    title: raw.title || 'Custom Skill Course',
    subtitle: raw.subtitle || '11-Reel Vocational Learning Package',
    sector: raw.sector || 'General Vocational',
    nsqf_level: raw.nsqf_level || 3,
    total_reels: lessons.length,
    creator_id: raw.creator_id || 'system',
    lessons: lessons,
    created_at: raw.created_at || new Date().toISOString()
  };

  console.log(`%c[SCHEMA] formatStandardizedCurriculum() OUTPUT:`, 'color: #f59e0b; font-weight: bold');
  console.log(`  [SCHEMA] id="${result.id}" title="${result.title}" lessons=${result.lessons.length}`);
  result.lessons.forEach((l, i) => {
    console.log(`  [SCHEMA] OUTPUT lesson[${i}]: video_id="${l.video_id}" title="${l.title?.substring(0, 50)}"`);
  });

  return result;
}
