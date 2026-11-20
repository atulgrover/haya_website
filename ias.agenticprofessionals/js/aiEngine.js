/**
 * SkillPedia AI 11-Reel Curriculum Engine
 * Primary Provider: Sarvam AI (sarvam-105b / sarvam-105b-conversations)
 * Fallback Provider: OpenRouter Multi-Model Array
 * Official YouTube Data API v3 Integration + 2-Step Confirmation Workflow
 */

class AICurriculumEngine {

  getSarvamApiKey() {
    return (window.SARVAM_API_KEY || 'sk_seyvp34z_e9uFel9TjYw0fYerbEcc3ikc').trim();
  }

  getOpenRouterApiKey() {
    return (window.OPENROUTER_API_KEY || atob("c2stb3ItdjEtZjY3ODU4OWEyOTQ4ZTk0YTA1MTBkNDMwYTBmYWQwZGZkYTNkZGE5MDFjYWNjODMyY2Y4Nzk4NjAwOTY3NTJkNA==")).trim();
  }

  /**
   * STEP 1: Synthesize Domain-Specific Master System Prompt using Sarvam AI
   */
  async generateDomainPrompt(topic, tag = '', description = '') {
    console.log(`[AI-LOG] generateDomainPrompt for topic="${topic}", tag="${tag}"`);
    const userContext = `Topic: "${topic}"\nCategory/Sector Tag: "${tag || 'General'}"\nDescription: "${description || 'Enterprise skill curriculum'}"`;

    const systemPrompt = `You are an expert Master Curriculum Architect.
The user wants to generate an 11-chapter micro-learning skill course based on the following enterprise details:
${userContext}

Your task: Synthesize a highly detailed, domain-specific System Instruction Prompt that will guide the AI to outline 11 logical, step-by-step chapter titles and exact search queries for YouTube videos.

Requirements:
- Make the prompt domain-specific, tailored to the sector, keywords, and practical procedures described.
- Clearly outline what each of the 11 chapters should focus on.
- Instruct the AI to generate clean, practical chapter titles (Chapter 1 through Chapter 11) and precise YouTube search queries.
- Keep the output formatted cleanly in natural English as a ready-to-use Master Prompt.`;

    // Primary: Sarvam AI
    const sarvamKey = this.getSarvamApiKey();
    if (sarvamKey) {
      console.log(`[AI-LOG] [Primary Provider] Trying Sarvam AI (sarvam-105b) for domain prompt...`);
      try {
        const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': sarvamKey
          },
          body: JSON.stringify({
            model: 'sarvam-105b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Generate the domain-specific master curriculum prompt for: ${topic}` }
            ],
            temperature: 0.4,
            max_tokens: 1500
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim() || data.choices?.[0]?.message?.reasoning_content?.trim();
          if (content) {
            console.log(`%c[AI-LOG] ✅ Sarvam AI (sarvam-105b) successfully generated domain prompt!`, 'color:#4ade80;font-weight:bold');
            return content;
          }
        }
      } catch (sarvamErr) {
        console.warn(`[AI-LOG] Sarvam AI prompt fetch exception (${sarvamErr.message}). Falling back to OpenRouter...`);
      }
    }

    // Fallback: OpenRouter Models
    const openRouterKey = this.getOpenRouterApiKey();
    const candidateModels = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'openrouter/free'
    ];

    for (const modelName of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://hayagriva.app',
            'X-Title': 'SkillPedia PWA'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Generate the domain-specific master curriculum prompt for: ${topic}` }
            ],
            temperature: 0.5,
            max_tokens: 1500
          })
        });

        if (!response.ok) continue;
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      } catch (err) {
        console.warn(`[AI-LOG] OpenRouter prompt trial failed for ${modelName}: ${err.message}`);
      }
    }

    return `You are an expert Curriculum Architect for the domain "${topic}" (Sector: ${tag || 'General'}).
Build an 11-step standardized micro-learning skill curriculum for "${topic}" covering key operational procedures, safety, and domain compliance: ${description}.
Generate 11 distinct chapters with specific, domain-relevant YouTube video search queries for each step.`;
  }

  /**
   * STEP 2: Generate 11 Clean Chapter Titles & Summaries (No YouTube API calls yet!)
   */
  async generate11ChapterTitles(topic, confirmedPrompt = '') {
    console.log(`[AI-LOG] Generating 11 Chapter Titles for "${topic}"...`);
    const cleanTopic = topic.trim();
    const formattedTitle = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

    let llmResult = null;

    // Primary: Sarvam AI
    const sarvamKey = this.getSarvamApiKey();
    if (sarvamKey) {
      try {
        llmResult = await this.callSarvamModel(cleanTopic, 'sarvam-105b', sarvamKey, confirmedPrompt);
      } catch (err) {
        console.warn(`[AI-LOG] Sarvam chapter generation failed (${err.message}). Trying OpenRouter fallback...`);
      }
    }

    // Fallback: OpenRouter
    if (!llmResult) {
      const openRouterKey = this.getOpenRouterApiKey();
      const candidateModels = [
        'meta-llama/llama-3.3-70b-instruct:free',
        'meta-llama/llama-3.1-8b-instruct:free',
        'google/gemini-2.0-flash-exp:free',
        'openrouter/free'
      ];

      for (const modelName of candidateModels) {
        try {
          llmResult = await this.callOpenRouterModel(cleanTopic, modelName, openRouterKey, confirmedPrompt);
          if (llmResult && Array.isArray(llmResult.lessons) && llmResult.lessons.length === 11) break;
        } catch (err) {
          console.warn(`[AI-LOG] OpenRouter model "${modelName}" failed: ${err.message}`);
        }
      }
    }

    if (!llmResult || !Array.isArray(llmResult.lessons) || llmResult.lessons.length !== 11) {
      llmResult = this.generateFallbackCurriculum(cleanTopic, formattedTitle);
    }

    return llmResult;
  }

  /**
   * STEP 3: Query Official YouTube Data API v3 ONLY AFTER User Confirms 11 Chapters
   */
  async resolveVideosForChapters(topic, confirmedCurriculum, onProgress = () => {}) {
    console.log(`[AI-LOG] Resolving YouTube API videos for 11 Confirmed Chapters of "${topic}"...`);
    const cleanTopic = topic.trim();

    onProgress(2, `Querying Official YouTube Data API v3 for 11 Confirmed Chapters...`, 60);

    const lessonsWithVideos = await Promise.all(confirmedCurriculum.lessons.map(async (les, idx) => {
      const reelIndex = idx + 1;
      const stepQuery = `${cleanTopic} ${les.title.replace(/^Chapter \d+:\s*/i, '').replace(/^Reel \d+:\s*/i, '')}`;

      console.log(`[AI-LOG] Official YouTube API Search for Chapter ${reelIndex}: "${stepQuery}"`);
      let searchRes = await this.searchLiveYouTubeVideoCandidates(stepQuery);

      if (!searchRes.success && les.search_query && les.search_query !== stepQuery) {
        searchRes = await this.searchLiveYouTubeVideoCandidates(les.search_query);
      }

      if (!searchRes.success) {
        searchRes = await this.searchLiveYouTubeVideoCandidates(cleanTopic);
      }

      const candidates = (searchRes && searchRes.success && Array.isArray(searchRes.candidates) && searchRes.candidates.length > 0)
        ? searchRes.candidates
        : [{ video_id: 'sR7RKyHHyTg', title: `${les.title} Demonstration`, channelTitle: 'HAYAGRIVA Skillpedia' }];

      const topVid = candidates[0].video_id || candidates[0].id || 'sR7RKyHHyTg';
      const rawTitle = candidates[0].title || candidates[0].video_title || les.title || 'Demonstration Video';
      const chosenTitle = String(rawTitle);

      onProgress(2, `Chapter ${reelIndex}/11: Resolved "${chosenTitle.substring(0, 45)}..." [ID: ${topVid}]`, 60 + Math.floor((idx / 11) * 20));

      return {
        ...les,
        video_id: topVid,
        video_title: chosenTitle,
        candidates: candidates
      };
    }));

    confirmedCurriculum.lessons = lessonsWithVideos;

    // Pass-2 Audit Pass
    onProgress(3, `Executing Pass-2 AI Audit: Verifying Video Relevance against Chapter Goals...`, 85);
    try {
      const auditResult = await this.verifyReelVideoRelevance(cleanTopic, confirmedCurriculum.lessons);
      if (auditResult && Array.isArray(auditResult.verifications)) {
        auditResult.verifications.forEach((v) => {
          const les = confirmedCurriculum.lessons.find(l => l.reel_index === v.reel_index);
          if (les && les.candidates && les.candidates[v.selected_index]) {
            const bestCand = les.candidates[v.selected_index];
            les.video_id = bestCand.video_id || bestCand.id || les.video_id;
            les.video_title = String(bestCand.title || bestCand.video_title || les.video_title);
            les.audit_score = v.confidence || 90;
            les.audit_reason = v.reason || 'Verified relevant to chapter goal';
          }
        });
      }
    } catch (auditErr) {
      console.warn(`[AI-LOG] Audit pass skipped (${auditErr.message}). Using top candidates.`);
    }

    if (typeof dbClient !== 'undefined' && typeof dbClient.saveCurriculum === 'function') {
      try {
        await dbClient.saveCurriculum(confirmedCurriculum);
      } catch (saveErr) {
        console.warn(`[AI-LOG] Background DB save warning: ${saveErr.message}`);
      }
    }

    onProgress(4, '11 Chapter Reels Resolved & Ready for Creator Confirmation Studio!', 100);
    return confirmedCurriculum;
  }

  /**
   * Helper call for Sarvam AI (sarvam-105b)
   */
  async callSarvamModel(topic, modelName, apiKey, confirmedPrompt = '') {
    const defaultPrompt = `You are an expert Curriculum Architect.
Generate an 11-chapter standardized micro-learning skill curriculum for: "${topic}".`;

    const systemPrompt = `${confirmedPrompt || defaultPrompt}

Respond ONLY with a valid JSON object matching this exact structure:
{
  "title": "Title of the Skill Course",
  "subtitle": "Clear 1-sentence course overview",
  "sector": "Relevant Industry Sector",
  "lessons": [
    {
      "id": 1,
      "reel_index": 1,
      "title": "Chapter 1: Step Name",
      "subtitle": "Short summary description of Chapter 1",
      "search_query": "${topic} Step 1 tutorial"
    }
  ]
}
Rules:
1. Provide EXACTLY 11 chapter lessons with reel_index 1 through 11.
2. Return raw JSON only (no markdown codeblock formatting).`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Build an 11-chapter skill curriculum for: "${topic}"` }
          ],
          temperature: 0.3
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Sarvam HTTP ${response.status}: ${errText.substring(0, 100)}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content?.trim() || data.choices?.[0]?.message?.reasoning_content?.trim() || '';

      const cleanJson = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.lessons)) {
        parsed.lessons = parsed.lessons.map((les, idx) => ({
          id: `les_${idx + 1}`,
          reel_index: idx + 1,
          title: les.title || `Chapter ${idx + 1}: ${topic} Part ${idx + 1}`,
          subtitle: les.subtitle || `Mastering ${topic} — Part ${idx + 1} of 11`,
          video_platform: 'youtube',
          video_id: les.video_id || '',
          search_query: les.search_query || `${topic} Chapter ${idx + 1} tutorial`
        }));
        return parsed;
      } else {
        throw new Error(`Invalid JSON schema: Missing 'lessons' array`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async searchLiveYouTubeVideoCandidates(searchQuery) {
    if (!searchQuery || typeof searchQuery !== 'string') return { success: false, candidates: [], error: 'Invalid query string' };

    try {
      const proxyUrl = `/api/search-video?q=${encodeURIComponent(searchQuery)}`;
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 15000);

      const proxyRes = await fetch(proxyUrl, { signal: ctrl.signal });
      clearTimeout(timeoutId);

      const proxyData = await proxyRes.json();

      if (proxyRes.ok && proxyData.success && Array.isArray(proxyData.results) && proxyData.results.length > 0) {
        const validCandidates = proxyData.results.filter(item => this.quickCheckVideoId(item.video_id));
        if (validCandidates.length > 0) {
          return { success: true, candidates: validCandidates };
        }
      }

      return {
        success: false,
        candidates: [],
        error: proxyData.error || `HTTP ${proxyRes.status}: YouTube search returned no video results`
      };

    } catch (err) {
      console.warn(`[SEARCH-LOG] Fetch exception for "${searchQuery}": ${err.message}`);
      return { success: false, candidates: [], error: `Network/API Exception: ${err.message}` };
    }
  }

  quickCheckVideoId(videoId) {
    return typeof videoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  async callOpenRouterModel(topic, modelName, apiKey, confirmedPrompt = '') {
    const defaultPrompt = `You are an expert Curriculum Architect.
Generate an 11-chapter micro-learning skill curriculum for: "${topic}".`;

    const systemPrompt = `${confirmedPrompt || defaultPrompt}

Respond ONLY with a valid JSON object matching this exact structure:
{
  "title": "Title of the Skill Course",
  "subtitle": "Clear 1-sentence course overview",
  "sector": "Relevant Industry Sector",
  "lessons": [
    {
      "id": 1,
      "reel_index": 1,
      "title": "Chapter 1: Step Name",
      "subtitle": "Short summary description of Chapter 1",
      "search_query": "${topic} Step 1 tutorial"
    }
  ]
}
Rules:
1. Provide EXACTLY 11 chapter lessons with reel_index 1 through 11.
2. Return raw JSON only (no markdown codeblock formatting).`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hayagriva.app',
          'X-Title': 'SkillPedia PWA'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Build an 11-chapter skill curriculum for: "${topic}"` }
          ],
          temperature: 0.4
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`OpenRouter HTTP ${response.status}: ${errText.substring(0, 100)}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content?.trim() || '';

      const cleanJson = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.lessons)) {
        parsed.lessons = parsed.lessons.map((les, idx) => ({
          id: `les_${idx + 1}`,
          reel_index: idx + 1,
          title: les.title || `Chapter ${idx + 1}: ${topic} Part ${idx + 1}`,
          subtitle: les.subtitle || `Mastering ${topic} — Part ${idx + 1} of 11`,
          video_platform: 'youtube',
          video_id: les.video_id || '',
          search_query: les.search_query || `${topic} Chapter ${idx + 1} tutorial`
        }));
        return parsed;
      } else {
        throw new Error(`Invalid JSON schema: Missing 'lessons' array`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async verifyReelVideoRelevance(topic, lessons) {
    const auditPayload = lessons.map(l => ({
      reel_index: l.reel_index,
      title: l.title,
      subtitle: l.subtitle,
      candidates: (l.candidates || []).map((c, i) => ({ index: i, video_id: c.video_id, title: c.title }))
    }));

    const systemPrompt = `You are an expert Skill Curriculum Auditor.
For the skill course "${topic}", verify candidate YouTube video titles against each chapter's topic goals.
For each chapter, select the candidate index whose title is MOST relevant to the chapter title.

Respond ONLY with raw JSON:
{
  "verifications": [
    { "reel_index": 1, "selected_index": 0, "confidence": 95, "reason": "Title matches criteria" }
  ]
}`;

    const sarvamKey = this.getSarvamApiKey();
    if (sarvamKey) {
      try {
        const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': sarvamKey
          },
          body: JSON.stringify({
            model: 'sarvam-105b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Verify video candidates for: ${JSON.stringify(auditPayload)}` }
            ],
            temperature: 0.2
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawContent = data.choices?.[0]?.message?.content?.trim() || data.choices?.[0]?.message?.reasoning_content?.trim() || '';
          const cleanJson = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
          return JSON.parse(cleanJson);
        }
      } catch (err) {
        console.warn(`[AUDIT-LOG] Sarvam AI audit pass trial failed: ${err.message}`);
      }
    }

    return null;
  }

  generateFallbackCurriculum(topic, formattedTitle) {
    return {
      id: `CUSTOM-${topic.toUpperCase().replace(/\s+/g, '_').substring(0, 15)}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'custom_ai',
      version: '1.0',
      title: formattedTitle,
      subtitle: `11-Chapter Micro-Learning Skill Package for ${formattedTitle}`,
      sector: 'Custom Micro-Learning',
      total_reels: 11,
      created_at: new Date().toISOString(),
      lessons: Array.from({ length: 11 }, (_, i) => ({
        id: `les_${i + 1}`,
        reel_index: i + 1,
        title: `Chapter ${i + 1}: ${formattedTitle} Part ${i + 1}`,
        subtitle: `Mastering essential procedure for ${formattedTitle} — Chapter ${i + 1} of 11`,
        search_query: `${formattedTitle} Chapter ${i + 1} tutorial`,
        video_platform: 'youtube',
        video_id: ''
      }))
    };
  }
}

const aiEngine = new AICurriculumEngine();
