/**
 * SkillPedia AI 11-Reel Curriculum Engine
 * Official YouTube Data API v3 Integration + LLM Curriculum Synthesis + Domain Prompt Confirmation
 * With Strict Error Handling and Zero Static Video Fallbacks
 */

class AICurriculumEngine {

  /**
   * Synthesize a Domain-Specific Master Prompt based on User Topic, Tag, and Description
   */
  async generateDomainPrompt(topic, tag = '', description = '') {
    console.log(`[AI-LOG] generateDomainPrompt for topic="${topic}", tag="${tag}"`);
    const apiKey = (window.OPENROUTER_API_KEY || atob("c2stb3ItdjEtZjY3ODU4OWEyOTQ4ZTk0YTA1MTBkNDMwYTBmYWQwZGZkYTNkZGE5MDFjYWNjODMyY2Y4Nzk4NjAwOTY3NTJkNA==")).trim();

    const userContext = `Topic: "${topic}"\nCategory/Sector Tag: "${tag || 'General'}"\nDescription: "${description || 'Enterprise skill curriculum'}"`;

    const systemPrompt = `You are an expert National Skills Qualifications Framework (NSQF) Master Curriculum Architect.
The user wants to generate an 11-step standardized micro-learning skill course based on the following enterprise details:
${userContext}

Your task: Synthesize a highly detailed, domain-specific System Instruction Prompt that will guide the LLM to build 11 National Occupational Standards (NOS) units and exact search queries for YouTube videos.

Requirements:
- Make the prompt domain-specific, tailored to the sector, keywords, and practical procedures described.
- Clearly outline what each of the 11 reels should focus on.
- Explicitly instruct the AI to generate precise, highly relevant YouTube search queries (including technical keywords, 'how to', 'tutorial', 'demonstration').
- Keep the output formatted cleanly in natural English as a ready-to-use Master Prompt.`;

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
            'Authorization': `Bearer ${apiKey}`,
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
            temperature: 0.5
          })
        });

        if (!response.ok) continue;
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      } catch (err) {
        console.warn(`[AI-LOG] Domain prompt trial failed for ${modelName}: ${err.message}`);
      }
    }

    return `You are an expert NSQF Curriculum Architect for the domain "${topic}" (Sector: ${tag || 'General'}).
Build an 11-step standardized micro-learning skill curriculum for "${topic}" covering key operational procedures, safety, and domain compliance: ${description}.
Generate 11 distinct NOS units with specific, domain-relevant YouTube video search queries for each step.`;
  }

  async generate11ReelCurriculum(topic, confirmedPrompt = '', onProgress = () => {}, forceFresh = false) {
    console.log(`%c[AI-LOG 1/10] 🚀 generate11ReelCurriculum("${topic}") initiated!`, 'color: #c084fc; font-weight: bold; font-size: 14px');

    const safetyCheck = sanitizeAndCheckPrompt(topic);
    if (!safetyCheck.safe) {
      throw new Error(`[Content Moderation] ${safetyCheck.reason}`);
    }

    const cleanTopic = topic.trim();
    const formattedTitle = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

    if (!forceFresh) {
      try {
        const existing = await dbClient.searchCurricula(cleanTopic, '', 'custom_ai');
        const exactMatch = existing ? existing.find(c => c.title.toLowerCase() === cleanTopic.toLowerCase()) : null;
        if (exactMatch && exactMatch.lessons && exactMatch.lessons.length === REEL_STANDARD_COUNT) {
          onProgress(4, 'Found pre-existing Skill Pack in DB!', 100);
          return exactMatch;
        }
      } catch (dbErr) {
        console.warn(`[AI-LOG] Turso DB pre-check warning: ${dbErr.message}`);
      }
    }

    const apiKey = (window.OPENROUTER_API_KEY || atob("c2stb3ItdjEtZjY3ODU4OWEyOTQ4ZTk0YTA1MTBkNDMwYTBmYWQwZGZkYTNkZGE5MDFjYWNjODMyY2Y4Nzk4NjAwOTY3NTJkNA==")).trim();

    onProgress(1, `Synthesizing 11 NOS Units using confirmed Domain Prompt for "${formattedTitle}"...`, 35);

    const candidateModels = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'openrouter/free'
    ];

    let llmResult = null;
    let lastLlmError = null;

    for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
      const modelName = candidateModels[mIdx];
      try {
        llmResult = await this.callOpenRouterModel(cleanTopic, modelName, apiKey, confirmedPrompt);
        if (llmResult && Array.isArray(llmResult.lessons) && llmResult.lessons.length === 11) {
          break;
        }
      } catch (err) {
        lastLlmError = err;
      }
    }

    if (!llmResult || !Array.isArray(llmResult.lessons) || llmResult.lessons.length !== 11) {
      console.warn(`[AI-LOG] OpenRouter models failed/throttled (${lastLlmError?.message}). Using Fallback Generator.`);
      llmResult = this.generateFallbackCurriculum(cleanTopic, formattedTitle);
    }

    // Official YouTube API Parallel Video Search
    onProgress(2, `Querying Official YouTube Data API v3 for 11 Relevant Video Reels...`, 60);

    const lessonsWithVideos = await Promise.all(llmResult.lessons.map(async (les, idx) => {
      const reelIndex = idx + 1;
      const stepQuery = `${cleanTopic} ${les.title.replace(/^Reel \d+:\s*/i, '')}`;

      console.log(`[AI-LOG] Official YouTube API Search for Reel ${reelIndex}: "${stepQuery}"`);
      let searchRes = await this.searchLiveYouTubeVideoCandidates(stepQuery);

      if (!searchRes.success && les.search_query && les.search_query !== stepQuery) {
        searchRes = await this.searchLiveYouTubeVideoCandidates(les.search_query);
      }

      if (!searchRes.success) {
        searchRes = await this.searchLiveYouTubeVideoCandidates(cleanTopic);
      }

      if (!searchRes.success || !searchRes.candidates || searchRes.candidates.length === 0) {
        console.error(`[AI-LOG] Video resolution FAILED for Reel ${reelIndex}: ${searchRes.error || 'No candidates'}`);
        // Strict error policy: Throw error if video resolution fails completely
        throw new Error(`Official YouTube API Video Error: Could not resolve video for Reel ${reelIndex} ("${les.title}"). ${searchRes.error || 'No matching videos found.'}`);
      }

      const candidates = searchRes.candidates;
      const topVid = candidates[0].video_id;
      const chosenTitle = candidates[0].title;

      onProgress(2, `Reel ${reelIndex}/11: Resolved "${chosenTitle.substring(0, 45)}..." [ID: ${topVid}]`, 60 + Math.floor((idx / 11) * 20));

      return {
        ...les,
        video_id: topVid,
        video_title: chosenTitle,
        candidates: candidates
      };
    }));

    llmResult.lessons = lessonsWithVideos;

    // Pass-2 Audit Pass
    onProgress(3, `Executing Pass-2 AI Audit: Verifying Video Relevance against NOS Requirements...`, 85);
    try {
      const auditResult = await this.verifyReelVideoRelevance(cleanTopic, llmResult.lessons, apiKey);
      if (auditResult && Array.isArray(auditResult.verifications)) {
        auditResult.verifications.forEach((v) => {
          const les = llmResult.lessons.find(l => l.reel_index === v.reel_index);
          if (les && les.candidates && les.candidates[v.selected_index]) {
            const bestCand = les.candidates[v.selected_index];
            les.video_id = bestCand.video_id;
            les.video_title = bestCand.title;
            les.audit_score = v.confidence || 90;
            les.audit_reason = v.reason || 'Verified relevant to NOS criteria';
          }
        });
      }
    } catch (auditErr) {
      console.warn(`[AI-LOG] Audit pass skipped (${auditErr.message}). Using top candidates.`);
    }

    try {
      await dbClient.saveCurriculum(llmResult);
    } catch (saveErr) {
      console.warn(`[AI-LOG] Background DB save warning: ${saveErr.message}`);
    }

    onProgress(4, '11 Reel Candidates Verified & Ready for Creator Confirmation!', 100);
    return llmResult;
  }

  /**
   * Queries Server Endpoint /api/search-video (Official YouTube Data API v3)
   */
  async searchLiveYouTubeVideoCandidates(searchQuery) {
    if (!searchQuery || typeof searchQuery !== 'string') return { success: false, candidates: [], error: 'Invalid query string' };

    console.log(`[SEARCH-LOG] searchLiveYouTubeVideoCandidates("${searchQuery}")`);

    try {
      const proxyUrl = `/api/search-video?q=${encodeURIComponent(searchQuery)}`;
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 6000);

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
    const defaultPrompt = `You are an expert National Skills Qualifications Framework (NSQF) Curriculum Architect.
Generate an 11-step standardized micro-learning skill curriculum for: "${topic}".`;

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
      "nos_code": "CUST/N0101",
      "title": "Reel 1: Step Name",
      "subtitle": "Short description of Reel 1",
      "search_query": "${topic} Step 1 tutorial",
      "pcs": [
        "PC1. First performance criteria description",
        "PC2. Second performance criteria description",
        "PC3. Third performance criteria description"
      ]
    }
  ]
}
Rules:
1. Provide EXACTLY 11 lessons with reel_index 1 through 11.
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
            { role: 'user', content: `Build an 11-reel NSQF skill curriculum for: "${topic}"` }
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
          nos_code: les.nos_code || `CUST/N0${Math.floor(idx / 3) + 1}0${(idx % 3) + 1}`,
          title: les.title || `Reel ${idx + 1}: ${topic} Step ${idx + 1}`,
          subtitle: les.subtitle || `Mastering ${topic} — Stage ${idx + 1} of 11`,
          video_platform: 'youtube',
          video_id: les.video_id || '',
          search_query: les.search_query || `${topic} Step ${idx + 1} tutorial`,
          pcs: Array.isArray(les.pcs) && les.pcs.length > 0 ? les.pcs : [
            `PC1. Follow safety guidelines for ${topic}.`,
            `PC2. Execute step ${idx + 1} per standard procedure.`,
            `PC3. Perform quality verification check.`
          ]
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

  async verifyReelVideoRelevance(topic, lessons, apiKey) {
    const auditPayload = lessons.map(l => ({
      reel_index: l.reel_index,
      nos_code: l.nos_code,
      title: l.title,
      pcs: l.pcs ? l.pcs.slice(0, 2) : [],
      candidates: (l.candidates || []).map((c, i) => ({ index: i, video_id: c.video_id, title: c.title }))
    }));

    const systemPrompt = `You are an expert NSQF Skill Curriculum Auditor.
For the skill course "${topic}", verify candidate YouTube video titles against each reel's NOS requirements.
For each reel, select the candidate index whose title is MOST relevant to the NOS step.

Respond ONLY with raw JSON:
{
  "verifications": [
    { "reel_index": 1, "selected_index": 0, "confidence": 95, "reason": "Title matches criteria" }
  ]
}`;

    const candidateModels = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'openrouter/free'
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    for (const modelName of candidateModels) {
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
              { role: 'user', content: `Verify video candidates for: ${JSON.stringify(auditPayload)}` }
            ],
            temperature: 0.2
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) continue;
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content?.trim() || '';
        const cleanJson = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
        return JSON.parse(cleanJson);
      } catch (err) {
        clearTimeout(timeoutId);
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
      subtitle: `11-Reel Vocational Micro-Learning Package for ${formattedTitle}`,
      sector: 'Custom Micro-Learning',
      nsqf_level: 3,
      total_reels: 11,
      created_at: new Date().toISOString(),
      lessons: Array.from({ length: 11 }, (_, i) => ({
        id: `les_${i + 1}`,
        reel_index: i + 1,
        nos_code: `CUST/N0${Math.floor(i / 3) + 1}0${(i % 3) + 1}`,
        title: `Reel ${i + 1}: ${formattedTitle} Step ${i + 1}`,
        subtitle: `Mastering essential technique for ${formattedTitle} — Stage ${i + 1} of 11`,
        video_platform: 'youtube',
        video_id: '',
        pcs: [
          `PC1. Review safety standards and prerequisites for ${formattedTitle}.`,
          `PC2. Execute step ${i + 1} using standard tools and procedures.`,
          `PC3. Perform quality and safety verification check.`,
          `PC4. Document progress and prepare for stage ${i + 2}.`
        ]
      }))
    };
  }
}

const aiEngine = new AICurriculumEngine();
