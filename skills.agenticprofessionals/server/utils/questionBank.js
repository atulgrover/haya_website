'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * HPTI STANDARDIZED PSYCHOMETRIC QUESTION BANK
 * Decoupled from religious dogma; calibrated via Situational
 * Judgment Scenarios (SJS) for international psychological validity.
 * ══════════════════════════════════════════════════════════════════
 */

// ── TIER 1: RAPID SCREENING (9 SCENARIOS) ──
const RAPID_QUESTIONS = [
  {
    id: 'q1',
    tier: 'rapid',
    dimension: 'energy',
    title: 'Reaction to Sudden Crisis & Deadline Collapse',
    scenario: 'A mission-critical project faces an immediate operational breakdown 48 hours before launch due to an unforeseen external shock. What is your immediate, spontaneous physical and psychological reaction?',
    options: [
      { id: 'S', code: 'S', label: 'Centering in Calm Analysis (Sattva)', desc: 'Pulse remains steady; you systematically step back, isolate the variables, and calmly restructure priorities without panic.', weights: { guna: { S: 2 } } },
      { id: 'R', code: 'R', label: 'Surge of Kinetic Urgency (Rajas)', desc: 'Adrenaline spikes; you immediately rally the team, take decisive command, sprint through the night, and conquer the obstacle through sheer momentum.', weights: { guna: { R: 2 } } },
      { id: 'T', code: 'T', label: 'Need for Familiar Anchors (Tamas)', desc: 'You feel initial heaviness or resistance to the chaos; you retreat to verify established checklists and procedural baselines before committing to changes.', weights: { guna: { T: 2 } } }
    ]
  },
  {
    id: 'q2',
    tier: 'rapid',
    dimension: 'energy',
    title: 'Energy Replenishment & Rest Pattern',
    scenario: 'After an intense, exhausting multi-week work cycle, what restores your vitality most deeply and rapidly?',
    options: [
      { id: 'S', code: 'S', label: 'Contemplation & Silence (Sattva)', desc: 'Solitude in nature, deep reading, meditation, clean nourishment, and disconnecting from all devices.', weights: { guna: { S: 2 } } },
      { id: 'R', code: 'R', label: 'Active Stimulating Recreation (Rajas)', desc: 'High-energy socializing, intense physical sports, planning the next ambitious venture, or traveling to vibrant cities.', weights: { guna: { R: 2 } } },
      { id: 'T', code: 'T', label: 'Deep Sleep & Total Disengagement (Tamas)', desc: 'Prolonged sleep (10+ hours), staying in bed, binge-watching media, and completely avoiding all mental exertion.', weights: { guna: { T: 2 } } }
    ]
  },
  {
    id: 'q3',
    tier: 'rapid',
    dimension: 'energy',
    title: 'Deep Motivation for Professional Labor',
    scenario: 'What is the true underlying driver that compels you to sustain difficult, friction-heavy work over years?',
    options: [
      { id: 'S', code: 'S', label: 'Clarity of Duty & Self-Mastery (Sattva)', desc: 'The joy of uncovering truth, perfecting character, and serving the harmonious order of society without anxiety over rewards.', weights: { guna: { S: 2 } } },
      { id: 'R', code: 'R', label: 'Ambition, Impact & Worldly Conquest (Rajas)', desc: 'The thrill of competition, achieving public prestige, building empire, and proving capability against the highest benchmarks.', weights: { guna: { R: 2 } } },
      { id: 'T', code: 'T', label: 'Security, Stability & Comfort (Tamas)', desc: 'Securing dependable financial safety, protecting loved ones from risk, maintaining routine, and avoiding unpredictable hardship.', weights: { guna: { T: 2 } } }
    ]
  },
  {
    id: 'q4',
    tier: 'rapid',
    dimension: 'competency',
    title: 'Natural Contribution to an Enterprise',
    scenario: 'When joining an ambitious multi-disciplinary enterprise, in which role do your innate talents produce the most compounding value?',
    options: [
      { id: 'B', code: 'B', label: 'Theoretical Architecture & Strategy (Brahmana)', desc: 'Synthesizing complex information, establishing ethical policies, research, and formulating the core vision.', weights: { competency: { B: 2 }, cognition: { B: 1 } } },
      { id: 'K', code: 'K', label: 'Sovereign Command & Protection (Kshatriya)', desc: 'Leading operations from the front, taking absolute accountability, defending the team, and executing high-stakes decisions.', weights: { competency: { K: 2 }, cognition: { A: 1 } } },
      { id: 'V', code: 'V', label: 'Commercial Scaling & Capital Ecosystems (Vaishya)', desc: 'Identifying market opportunities, orchestrating partnerships, optimizing unit economics, and driving compound scale.', weights: { competency: { V: 2 }, cognition: { M: 1 } } },
      { id: 'S', code: 'S', label: 'Direct Craft, Implementation & Tooling (Shudra)', desc: 'Mastering the physical machinery, codebase, tangible materials, and ensuring flawless operational execution.', weights: { competency: { S: 2 }, cognition: { M: 1 } } }
    ]
  },
  {
    id: 'q5',
    tier: 'rapid',
    dimension: 'cognition',
    title: 'Processing Complex Conflicts & Disputes',
    scenario: 'Two key stakeholders in your company are locked in a bitter feud over resource allocation. What is your instinct in resolving the impasse?',
    options: [
      { id: 'D', code: 'B', label: 'Principle-Centered Arbitration (Buddhi-Led)', desc: 'Listen dispassionately to empirical facts; evaluate against constitutional principles, and issue a fair, unbendable ruling.', weights: { cognition: { B: 2 }, purpose: { D: 1 } } },
      { id: 'A', code: 'M', label: 'Pragmatic Economic Alignment (Manas-Led)', desc: 'Engage with emotional nuance; create a compromise where both parties feel heard and receive immediate transactional benefits.', weights: { cognition: { M: 2 }, purpose: { A: 1 } } },
      { id: 'M', code: 'A', label: 'Sovereign Executive Decision (Ahankara-Led)', desc: 'Take decisive executive command; establish boundaries based on strategic vision, and hold individual leaders strictly accountable.', weights: { cognition: { A: 2 }, purpose: { D: 1 } } }
    ]
  },
  {
    id: 'q6',
    tier: 'rapid',
    dimension: 'cognition',
    title: 'Decision-Making Under Radical Ambiguity',
    scenario: 'You must make a critical decision with only 30% of the required data available. What faculty guides your choice?',
    options: [
      { id: 'B', code: 'B', label: 'Rigorous First-Principles Deductions (Buddhi)', desc: 'Rely on timeless underlying axioms and structural causality rather than noisy surface trends.', weights: { cognition: { B: 2 } } },
      { id: 'S', code: 'M', label: 'Empathic Instinct & Pattern Resonance (Manas)', desc: 'Rely on holistic intuitive subconscious pattern recognition honed through years of lived immersion.', weights: { cognition: { M: 2 } } },
      { id: 'A', code: 'A', label: 'Courage of Conviction & Will (Ahankara)', desc: 'Make the bold call, own the risk completely, and bend reality through decisive subsequent execution.', weights: { cognition: { A: 2 } } }
    ]
  },
  {
    id: 'q7',
    tier: 'rapid',
    dimension: 'competency',
    title: 'Ideal Workplace Challenge',
    scenario: 'Which type of professional problem energizes your mind most profoundly?',
    options: [
      { id: 'B', code: 'B', label: 'Abstract Theoretical Modeling (Brahmana)', desc: 'Solving an unproven technical theorem, authoring policy frameworks, or mentoring intellectuals.', weights: { competency: { B: 2 }, purpose: { M: 1 } } },
      { id: 'K', code: 'K', label: 'High-Stakes Crisis Turnaround (Kshatriya)', desc: 'Taking over a failing unit in crisis, restoring order, enforcing discipline, and achieving victory.', weights: { competency: { K: 2 }, purpose: { D: 1 } } },
      { id: 'V', code: 'V', label: 'Market Arbitrage & Commercial Expansion (Vaishya)', desc: 'Bootstrapping an enterprise, negotiating cross-border deals, and compounding asset returns.', weights: { competency: { V: 2 }, purpose: { A: 1 } } },
      { id: 'S', code: 'S', label: 'Hands-on Technical Finesse & Craft (Shudra)', desc: 'Refining physical hardware, engineering production pipelines, and delivering pristine functional work.', weights: { competency: { S: 2 }, purpose: { K: 1 } } }
    ]
  },
  {
    id: 'q8',
    tier: 'rapid',
    dimension: 'purpose',
    title: 'Relationship with Capital, Scale & Ambition',
    scenario: 'What is your authentic, private perspective on capital accumulation, material leverage, and wealth?',
    options: [
      { id: 'D', code: 'D', label: 'Fuel for Sovereign Defense & Protection (Dharma)', desc: 'Capital is defensive ammunition: it provides the leverage required to defend freedom, protect your team, and fund noble civilizational causes.', weights: { purpose: { D: 2 } } },
      { id: 'A', code: 'A', label: 'The Objective Scoreboard of Realized Value (Artha)', desc: 'Capital is a precise metric measuring how effectively your system architecture solves human and economic problems in the open market.', weights: { purpose: { A: 2 } } },
      { id: 'M', code: 'M', label: 'A Functional Utility Subordinate to Truth (Moksha)', desc: 'Money is necessary for biological maintenance, but genuine wealth is knowledge, self-mastery, peace of mind, and intellectual sovereignty.', weights: { purpose: { M: 2 } } }
    ]
  },
  {
    id: 'q9',
    tier: 'rapid',
    dimension: 'purpose',
    title: 'Ultimate Existential Justification of Your Life',
    scenario: 'Standing at the very end of your life, looking back at all your labor, which statement would make you feel your existence on Earth was fully justified?',
    options: [
      { id: 'D', code: 'D', label: 'The Incorruptible Shield: "I upheld justice and protected duty." (Dharma)', desc: '"I stood firm when others compromised; I defended righteousness, protected those who trusted me, and lived an honorable life."', weights: { purpose: { D: 2 } } },
      { id: 'A', code: 'A', label: 'The Civilizational Builder: "I built enduring engines of abundance." (Artha)', desc: '"I created lasting institutions, provided livelihoods for thousands, and scaled systems that generated enduring prosperity."', weights: { purpose: { A: 2 } } },
      { id: 'M', code: 'M', label: 'The Luminous Clarifier: "I decoded truth and realized freedom." (Moksha)', desc: '"I mastered my inner mind, transmitted enduring wisdom, and walked through worldly illusions with unshakeable inner peace."', weights: { purpose: { M: 2 } } },
      { id: 'K', code: 'K', label: 'The Master Artisan: "I perfected my craft to divine standards." (Kama)', desc: '"I brought tangible beauty, precision, and functional grace into the world through the dedicated mastery of my hands and tools."', weights: { purpose: { K: 2 } } }
    ]
  }
];

// ── TIER 2: CERTIFIED VOCATIONAL BATTERY (27 SCENARIOS) ──
const VOCATIONAL_QUESTIONS_27 = [
  // ── SECTION 1: ENERGY & METABOLIC DYNAMICS (7 ITEMS: S/R/T) ──
  {
    id: 'v_q1',
    tier: 'vocational',
    section: 'Energy & Metabolic Dynamics',
    dimension: 'energy',
    title: 'Unforeseen Project Disruption & Pressure',
    scenario: 'A flagship initiative suffers a critical operational breakdown 48 hours before international release due to external supply chain failure. What is your immediate somatic and psychological response?',
    options: [
      { id: 'S', code: 'S', label: 'Serene Cognitive Isolation', desc: 'Heart rate stabilizes; you isolate emotional noise, gather the leads, and methodically re-architect the timeline with objective clarity.', weights: { guna: { S: 3 } } },
      { id: 'R', code: 'R', label: 'Kinetic Adrenaline Mobilization', desc: 'Surge of intense drive; you take direct personal command, rally the war room, work round the clock, and overcome the crisis through sheer tenacity.', weights: { guna: { R: 3 } } },
      { id: 'T', code: 'T', label: 'Protective Baseline Anchoring', desc: 'Initial heavy friction; you instinctively avoid panic by sticking strictly to proven legacy checklists and existing contingency buffers.', weights: { guna: { T: 3 } } }
    ]
  },
  {
    id: 'v_q2',
    tier: 'vocational',
    section: 'Energy & Metabolic Dynamics',
    dimension: 'energy',
    title: 'Recharge & Deep Vitality Restoration',
    scenario: 'Following months of grueling professional output, which rest protocol restores your highest baseline of mental sharpness?',
    options: [
      { id: 'S', code: 'S', label: 'Silent Contemplation & Nature', desc: 'Complete digital disconnection, solitary reflection in natural surroundings, clean nourishment, and deep philosophical reading.', weights: { guna: { S: 3 } } },
      { id: 'R', code: 'R', label: 'Stimulating Dynamic Pursuits', desc: 'High-intensity athletic pursuits, engaging vibrant social networks, brainstorming the next venture, or traveling to stimulating destinations.', weights: { guna: { R: 3 } } },
      { id: 'T', code: 'T', label: 'Prolonged Rest & Inactive Sleep', desc: 'Extensive uninterrupted sleep, staying stationary in a dark room, passive entertainment, and avoiding all mental demands.', weights: { guna: { T: 3 } } }
    ]
  },
  {
    id: 'v_q3',
    tier: 'vocational',
    section: 'Energy & Metabolic Dynamics',
    dimension: 'energy',
    title: 'Sustained Daily Work Motivation',
    scenario: 'What is the deepest internal engine that keeps you working through years of monotonous, high-friction obstacles?',
    options: [
      { id: 'S', code: 'S', label: 'Sacred Duty & Uncompromising Craft', desc: 'The intrinsic peace of doing what is right, honing inner mastery, and contributing to the harmonious order of society.', weights: { guna: { S: 3 } } },
      { id: 'R', code: 'R', label: 'Visible Impact & Worldly Stature', desc: 'The desire to scale systems, defeat competitors, earn respected recognition, and prove mastery at the highest institutional tiers.', weights: { guna: { R: 3 } } },
      { id: 'T', code: 'T', label: 'Unshakable Safety & Generational Comfort', desc: 'Ensuring absolute financial security for loved ones, preserving dependable routines, and avoiding disruption or loss.', weights: { guna: { T: 3 } } }
    ]
  },
  {
    id: 'v_q4',
    tier: 'vocational',
    section: 'Energy & Metabolic Dynamics',
    dimension: 'energy',
    title: 'Reaction to Interpersonal Friction in Teams',
    scenario: 'A colleague repeatedly pushes back against your technical proposals in executive meetings with aggressive tone. How do you instinctively respond?',
    options: [
      { id: 'S', code: 'S', label: 'Objective Examination of Merits', desc: 'Dispassionately separate the emotional tone from the underlying logic; address any valid points calmly while holding firm boundaries.', weights: { guna: { S: 3 } } },
      { id: 'R', code: 'R', label: 'Direct Tactical Confrontation', desc: 'Immediately engage with sharp verbal clarity, command the room, dismantle their assertions publicly, and defend your position.', weights: { guna: { R: 3 } } },
      { id: 'T', code: 'T', label: 'Quiet Strategic Avoidance', desc: 'Withdraw from immediate conflict to avoid unnecessary drama; let the tension blow over, and maintain quiet progress behind the scenes.', weights: { guna: { T: 3 } } }
    ]
  },
  {
    id: 'v_q5',
    tier: 'vocational',
    section: 'Energy & Metabolic Dynamics',
    dimension: 'energy',
    title: 'Quality Standards vs. Delivery Speed',
    scenario: 'Your team is pressured by management to ship an incomplete deliverable to beat a competitor to market. What is your instinct?',
    options: [
      { id: 'S', code: 'S', label: 'Non-Negotiable Integrity', desc: 'Refuse to compromise fundamental quality or ethics; insist on shipping only what is true and robust, regardless of short-term noise.', weights: { guna: { S: 3 } } },
      { id: 'R', code: 'R', label: 'Speed-to-Market Dominance', desc: 'Ship aggressively now to seize market share; run fast iterations, patch edge cases in production, and outpace rivals.', weights: { guna: { R: 3 } } },
      { id: 'T', code: 'T', label: 'Cautious Risk Preservation', desc: 'Delay deployment until every standard protocol is cleared to protect the organization from liability and reputational damage.', weights: { guna: { T: 3 } } }
    ]
  },
  {
    id: 'v_q6',
    tier: 'vocational',
    section: 'Energy & Metabolic Dynamics',
    dimension: 'energy',
    title: 'Reaction to Sudden Success & Acclaim',
    scenario: 'Your project receives an unexpected international award and extensive media praise. What is your internal mental state?',
    options: [
      { id: 'S', code: 'S', label: 'Quiet Gratitude & Detachment', desc: 'Acknowledge the honor gracefully as a passing event, credit the collective team, and return quietly to your foundational studies.', weights: { guna: { S: 3 } } },
      { id: 'R', code: 'R', label: 'Exhilaration & Momentum Acceleration', desc: 'Feel an immense rush of validation; leverage the spotlight immediately to fundraise, scale your operations, and expand influence.', weights: { guna: { R: 3 } } },
      { id: 'T', code: 'T', label: 'Relief & Desire for Routine', desc: 'Feel relieved that the ordeal of high visibility is over, hoping things can quickly return to comfortable, quiet normalcy.', weights: { guna: { T: 3 } } }
    ]
  },
  {
    id: 'v_q7',
    tier: 'vocational',
    section: 'Energy & Metabolic Dynamics',
    dimension: 'energy',
    title: 'Physical & Metabolic Rhythm',
    scenario: 'Which description most closely mirrors your natural biological circadian rhythm during peak health?',
    options: [
      { id: 'S', code: 'S', label: 'Luminous Early Dawn (Brahma Muhurta)', desc: 'Naturally waking with clarity at 4:30 - 5:30 AM; mental faculty is sharpest in morning stillness; minimal stimulants required.', weights: { guna: { S: 3 } } },
      { id: 'R', code: 'R', label: 'High-Energy Daytime Fire (Pitta Drive)', desc: 'Operating with relentless kinetic momentum throughout the day and into late evenings; driven by caffeine or intense activity.', weights: { guna: { R: 3 } } },
      { id: 'T', code: 'T', label: 'Heavy Night Owl (Kapha/Tamas Stability)', desc: 'Slow, groggy mornings requiring time to warm up; peak comfort in quiet late nights; naturally sleeping deeply and late.', weights: { guna: { T: 3 } } }
    ]
  },

  // ── SECTION 2: COGNITIVE ARCHITECTURE & ANTAHKARANA (7 ITEMS: BM/MM/AM) ──
  {
    id: 'v_q8',
    tier: 'vocational',
    section: 'Cognitive Architecture',
    dimension: 'cognition',
    title: 'Decision-Making Under Extreme Ambiguity',
    scenario: 'You are forced to make a irreversible strategic choice with only 25% of necessary empirical information available. What faculty guides you?',
    options: [
      { id: 'BM', code: 'BM', label: 'First-Principles Logical Deduction (Buddhi)', desc: 'Strip away noise to identify foundational structural axioms and causal relationships that must mathematically hold true.', weights: { cognition: { B: 3 } } },
      { id: 'MM', code: 'MM', label: 'Holistic Intuition & Empathic Resonance (Manas)', desc: 'Tune into subconscious patterns, gut resonance, and relational dynamics built over thousands of past sensory observations.', weights: { cognition: { M: 3 } } },
      { id: 'AM', code: 'AM', label: 'Sovereign Will & Risk Ownership (Ahankara)', desc: 'Commit decisively based on personal vision and integrity, accepting 100% of the consequences and forging reality through will.', weights: { cognition: { A: 3 } } }
    ]
  },
  {
    id: 'v_q9',
    tier: 'vocational',
    section: 'Cognitive Architecture',
    dimension: 'cognition',
    title: 'Processing Harsh Criticism from Leadership',
    scenario: 'A trusted senior leader harshly discredits your strategic roadmap in front of key executive stakeholders. What is your inner process?',
    options: [
      { id: 'BM', code: 'BM', label: 'Dispassionate Data Extraction (Buddhi)', desc: 'Filter out the harsh tone instantly; isolate the valid factual points to improve the architecture while discarding irrelevant emotion.', weights: { cognition: { B: 3 } } },
      { id: 'MM', code: 'MM', label: 'Relational Resonance & Empathic Repair (Manas)', desc: 'Feel deep interpersonal hurt initially; focus on understanding the emotional undercurrents and rebuilding social trust with the leader.', weights: { cognition: { M: 3 } } },
      { id: 'AM', code: 'AM', label: 'Righteous Sovereignty & Counter-Defense (Ahankara)', desc: 'Feel a direct challenge to your honor; stand tall, articulate your rationale with unyielding conviction, and prove your judgment right.', weights: { cognition: { A: 3 } } }
    ]
  },
  {
    id: 'v_q10',
    tier: 'vocational',
    section: 'Cognitive Architecture',
    dimension: 'cognition',
    title: 'Resolving Bitter Disputes in Your Team',
    scenario: 'Two senior architects in your team are locked in a zero-sum philosophical stalemate over technology stacks. How do you intervene?',
    options: [
      { id: 'BM', code: 'BM', label: 'Formal Objective Benchmarking (Buddhi)', desc: 'Establish an empirical testing matrix with rigorous mathematical criteria; let data and logical proofs settle the direction.', weights: { cognition: { B: 3 } } },
      { id: 'MM', code: 'MM', label: 'Empathetic Mediation & Compromise (Manas)', desc: 'Host informal one-on-ones, align emotional motivations, and craft a hybrid path where both feel respected and energized.', weights: { cognition: { M: 3 } } },
      { id: 'AM', code: 'AM', label: 'Executive Mandate & Clear Lines of Authority (Ahankara)', desc: 'Issue a decisive ruling on the architecture, establish clear operational ownership, and mandate full alignment behind the decision.', weights: { cognition: { A: 3 } } }
    ]
  },
  {
    id: 'v_q11',
    tier: 'vocational',
    section: 'Cognitive Architecture',
    dimension: 'cognition',
    title: 'Relationship with Attribution & Public Credit',
    scenario: 'A breakthrough invention you designed is celebrated globally, but an executive takes the primary public spotlight. How does your psyche react?',
    options: [
      { id: 'BM', code: 'BM', label: 'Indifference to Public Vanity (Buddhi)', desc: 'Content that the technological truth works in reality; external applause is fleeting vanity that does not alter objective reality.', weights: { cognition: { B: 3 } } },
      { id: 'MM', code: 'MM', label: 'Need for Warm Peer Recognition (Manas)', desc: 'You don’t care about public celebrity, but feel deeply hurt if your close colleagues and teammates fail to appreciate your contribution.', weights: { cognition: { M: 3 } } },
      { id: 'AM', code: 'AM', label: 'Fierce Defense of Legacy & Credit (Ahankara)', desc: 'Find it unacceptable for intellectual sovereignty to be stolen; take immediate proactive steps to ensure your rightful credit is recorded.', weights: { cognition: { A: 3 } } }
    ]
  },
  {
    id: 'v_q12',
    tier: 'vocational',
    section: 'Cognitive Architecture',
    dimension: 'cognition',
    title: 'Facing an Insoluble Cognitive Paradox',
    scenario: 'When you encounter an intellectual problem where two foundational theories contradict each other directly, how does your mind operate?',
    options: [
      { id: 'BM', code: 'BM', label: 'Synthesizing a Higher Epistemic Framework (Buddhi)', desc: 'Deconstruct both models to find the hidden meta-variable that resolves the contradiction at a higher level of abstraction.', weights: { cognition: { B: 3 } } },
      { id: 'MM', code: 'MM', label: 'Testing Through Lived Pragmatic Experience (Manas)', desc: 'Stop theorizing and run rapid tangible prototypes in the real world to see which behavior feels more harmonious and useful in practice.', weights: { cognition: { M: 3 } } },
      { id: 'AM', code: 'AM', label: 'Picking an Audacious Working Stance (Ahankara)', desc: 'Pick the bolder, more sovereign hypothesis, commit your reputation to proving it, and build momentum around your conviction.', weights: { cognition: { A: 3 } } }
    ]
  },
  {
    id: 'v_q13',
    tier: 'vocational',
    section: 'Cognitive Architecture',
    dimension: 'cognition',
    title: 'Learning & Acquiring Master Expertise',
    scenario: 'When mastering a completely new domain, what mental method do you naturally gravitate toward?',
    options: [
      { id: 'BM', code: 'BM', label: 'Formal Axiomatic Literature & Systems (Buddhi)', desc: 'Read dense foundational textbooks, academic papers, and systemic taxonomies from first principles before writing a single line of code.', weights: { cognition: { B: 3 } } },
      { id: 'MM', code: 'MM', label: 'Apprenticeship & Sensory Immersion (Manas)', desc: 'Shadow recognized masters, observe their micro-behaviors, absorb intuitive nuances, and learn through tactile mimicry.', weights: { cognition: { M: 3 } } },
      { id: 'AM', code: 'AM', label: 'Trial by Fire in High-Stakes Arenas (Ahankara)', desc: 'Jump directly into a live project with significant personal skin in the game, forcing yourself to master the domain through survival.', weights: { cognition: { A: 3 } } }
    ]
  },
  {
    id: 'v_q14',
    tier: 'vocational',
    section: 'Cognitive Architecture',
    dimension: 'cognition',
    title: 'Internal Dialogue During Critical Performance',
    scenario: 'During a career-defining presentation or high-stakes operation, what is the dominant nature of your inner mental voice?',
    options: [
      { id: 'BM', code: 'BM', label: 'Silent Witness & Flow State (Buddhi)', desc: 'Mind is quiet; you observe the room like a camera, letting well-structured arguments articulate themselves without personal interference.', weights: { cognition: { B: 3 } } },
      { id: 'MM', code: 'MM', label: 'Empathic Tuning with the Audience (Manas)', desc: 'Constantly reading emotional reactions, eye movements, and body language in the room, adapting your tone dynamically in real time.', weights: { cognition: { M: 3 } } },
      { id: 'AM', code: 'AM', label: 'Fierce Assertion of Authority (Ahankara)', desc: 'A surge of supreme self-belief and commanding presence; you channel personal conviction to captivate and bend the audience to your vision.', weights: { cognition: { A: 3 } } }
    ]
  },

  // ── SECTION 3: COMPETENCY & VARNA-SWABHAVA (7 ITEMS: B/K/V/S) ──
  {
    id: 'v_q15',
    tier: 'vocational',
    section: 'Competency & Swabhava',
    dimension: 'competency',
    title: 'The Systemic Organizational Crisis',
    scenario: 'Your organization discovers an edge-case architectural flaw that could cause systemic failure under rare circumstances. No regulator or client knows yet. What is your immediate instinct?',
    options: [
      { id: 'B', code: 'B', label: 'Formal Scientific Audit & Peer Review (Brahmana)', desc: 'Convene an emergency technical and ethical audit; isolate the algorithmic root cause, rewrite the mathematical proofs, and publish a rigorous post-mortem.', weights: { competency: { B: 3 } } },
      { id: 'K', code: 'K', label: 'Incident War-Room & Command Quarantine (Kshatriya)', desc: 'Form an emergency command war-room; take absolute command, freeze unauthorized communication, assign accountability, and protect organizational integrity.', weights: { competency: { K: 3 } } },
      { id: 'V', code: 'V', label: 'Financial Risk Hedging & Stakeholder Accord (Vaishya)', desc: 'Assess commercial exposure and customer contracts; negotiate proactive settlement buffers with enterprise clients to safeguard enterprise value.', weights: { competency: { V: 3 } } },
      { id: 'S', code: 'S', label: 'Hands-on Production Debugging & Patching (Shudra)', desc: 'Roll up your sleeves and dive into the physical servers and codebase; debug the production failure, patch the machine directly, and verify every wire.', weights: { competency: { S: 3 } } }
    ]
  },
  {
    id: 'v_q16',
    tier: 'vocational',
    section: 'Competency & Swabhava',
    dimension: 'competency',
    title: 'Natural Contribution to a Greenfield Venture',
    scenario: 'When co-founding a revolutionary new institution from scratch, where do your talents deliver the highest structural impact?',
    options: [
      { id: 'B', code: 'B', label: 'Foundational Theory & Epistemic Moats (Brahmana)', desc: 'Inventing the core patents, proprietary algorithms, regulatory whitepapers, and ethical boundaries.', weights: { competency: { B: 3 } } },
      { id: 'K', code: 'K', label: 'Strategic Leadership & Sovereign Governance (Kshatriya)', desc: 'Recruiting top talent, setting mission discipline, navigating cutthroat competition, and steering institutional policy.', weights: { competency: { K: 3 } } },
      { id: 'V', code: 'V', label: 'Capital Formation & Business Model Scaling (Vaishya)', desc: 'Structuring venture financing, establishing strategic commercial alliances, optimizing unit economics, and driving compound revenue.', weights: { competency: { V: 3 } } },
      { id: 'S', code: 'S', label: 'Rapid Prototype Fabrication & Infrastructure (Shudra)', desc: 'Building the actual physical hardware, setting up manufacturing tooling, maintaining server reliability, and engineering product details.', weights: { competency: { S: 3 } } }
    ]
  },
  {
    id: 'v_q17',
    tier: 'vocational',
    section: 'Competency & Swabhava',
    dimension: 'competency',
    title: 'Relationship with Tools, Code & Physical Machinery',
    scenario: 'What is your authentic, private relationship with physical tools, software code, and direct craft?',
    options: [
      { id: 'B', code: 'B', label: 'Tools as Manifestations of Abstract Proofs (Brahmana)', desc: 'Tools are secondary instruments; the true craft is conceptual understanding, theoretical models, and cognitive clarity.', weights: { competency: { B: 3 } } },
      { id: 'K', code: 'K', label: 'Tools as Weapons of Sovereign Execution (Kshatriya)', desc: 'Tools are levers of strategic impact; you master them only to command operations, enforce protection, and achieve mission goals.', weights: { competency: { K: 3 } } },
      { id: 'V', code: 'V', label: 'Tools as Capital Assets & Scalable Systems (Vaishya)', desc: 'Tools are evaluated by their return on investment, operational efficiency, and ability to generate commercial compounding.', weights: { competency: { V: 3 } } },
      { id: 'S', code: 'S', label: 'Tools as Sacred Extensions of the Hands (Shudra)', desc: 'You have a deep, intimate love for the tools themselves—tactile, precise, hands-on mastery of materials, machinery, and execution.', weights: { competency: { S: 3 } } }
    ]
  },
  {
    id: 'v_q18',
    tier: 'vocational',
    section: 'Competency & Swabhava',
    dimension: 'competency',
    title: 'Ideal Professional Legacy',
    scenario: 'Which crowning achievement would represent the truest expression of your innate vocational gifts?',
    options: [
      { id: 'B', code: 'B', label: 'A Seminal Treatise or Universal Scientific Law (Brahmana)', desc: 'Authoring a foundational framework or treatise that educates and guides thinkers for the next several centuries.', weights: { competency: { B: 3 } } },
      { id: 'K', code: 'K', label: 'Protecting and Transforming a Sovereign Entity (Kshatriya)', desc: 'Defending a civilization or enterprise in existential crisis, establishing enduring justice, and securing safety for millions.', weights: { competency: { K: 3 } } },
      { id: 'V', code: 'V', label: 'An Enduring Economic Conglomerate (Vaishya)', desc: 'Building a prosperous ecosystem that creates hundreds of thousands of jobs and generates generational economic abundance.', weights: { competency: { V: 3 } } },
      { id: 'S', code: 'S', label: 'A Flawlessly Engineered Wonder of Craft (Shudra)', desc: 'Fabricating a miraculous physical monument, legendary architectural complex, or precision machine of peerless beauty and reliability.', weights: { competency: { S: 3 } } }
    ]
  },
  {
    id: 'v_q19',
    tier: 'vocational',
    section: 'Competency & Swabhava',
    dimension: 'competency',
    title: 'Approach to Risk & Contracts',
    scenario: 'When entering into a long-term enterprise partnership, what clause do you scrutinize with the greatest intensity?',
    options: [
      { id: 'B', code: 'B', label: 'Ethical Principles & Intellectual Sovereignty (Brahmana)', desc: 'Ensuring absolute intellectual property protection, academic integrity, and alignment with uncompromised moral principles.', weights: { competency: { B: 3 } } },
      { id: 'K', code: 'K', label: 'Governance Control & Emergency Powers (Kshatriya)', desc: 'Establishing absolute command authority in times of breach, liability protection, and jurisdictional sovereignty.', weights: { competency: { K: 3 } } },
      { id: 'V', code: 'V', label: 'Profit Allocation & Liquid Exit Mechanics (Vaishya)', desc: 'Optimizing dividend structures, equity caps, downside financial hedges, and scalable compound commercial returns.', weights: { competency: { V: 3 } } },
      { id: 'S', code: 'S', label: 'Operational Scope & Tooling Specifications (Shudra)', desc: 'Verifying technical deliverables, working conditions, safety gear, and clear boundaries around physical labor.', weights: { competency: { S: 3 } } }
    ]
  },
  {
    id: 'v_q20',
    tier: 'vocational',
    section: 'Competency & Swabhava',
    dimension: 'competency',
    title: 'Instinct When Stepping into Chaos',
    scenario: 'You walk into a newly acquired department where morale is broken, processes are nonexistent, and goals are undefined. What is your first action?',
    options: [
      { id: 'B', code: 'B', label: 'Write the Taxonomy & Theoretical Blueprint (Brahmana)', desc: 'Draft the definitive knowledge architecture, define role ontologies, and establish the training curriculum for the department.', weights: { competency: { B: 3 } } },
      { id: 'K', code: 'K', label: 'Establish Discipline & Chain of Command (Kshatriya)', desc: 'Call an all-hands meeting, define unequivocal mission objectives, assign direct accountability, and inspire courageous morale.', weights: { competency: { K: 3 } } },
      { id: 'V', code: 'V', label: 'Audit Budgets & Cash Flow Incentives (Vaishya)', desc: 'Map expenditure leaks, redesign bonus and performance incentives, and renegotiate vendor agreements to restore profitability.', weights: { competency: { V: 3 } } },
      { id: 'S', code: 'S', label: 'Clean the Workspace & Fix Broken Machinery (Shudra)', desc: 'Immediately dive into fixing broken workflows, refactoring messy code, cleaning physical tools, and creating operational order.', weights: { competency: { S: 3 } } }
    ]
  },
  {
    id: 'v_q21',
    tier: 'vocational',
    section: 'Competency & Swabhava',
    dimension: 'competency',
    title: 'Workplace Environment that Multiplies Energy',
    scenario: 'In which physical and social environment does your energy organically expand without feeling drained?',
    options: [
      { id: 'B', code: 'B', label: 'The Scholarly Research Sanctuary (Brahmana)', desc: 'Quiet libraries, high-end think tanks, academic symposiums, and solitary studies surrounded by profound books.', weights: { competency: { B: 3 } } },
      { id: 'K', code: 'K', label: 'The Strategic War Room (Kshatriya)', desc: 'High-stakes executive command centers, crisis turnaround arenas, defense briefings, and decisive leadership summits.', weights: { competency: { K: 3 } } },
      { id: 'V', code: 'V', label: 'The Dynamic Commercial Exchange (Vaishya)', desc: 'Fast-paced trading floors, enterprise deal-closing negotiations, venture summits, and bustling marketplace hubs.', weights: { competency: { V: 3 } } },
      { id: 'S', code: 'S', label: 'The Precision Workshop & Fab Lab (Shudra)', desc: 'Advanced prototyping labs, industrial manufacturing plants, architectural construction studios, and hardware hacker spaces.', weights: { competency: { S: 3 } } }
    ]
  },

  // ── SECTION 4: PURPOSE & PURUSHARTHA (6 ITEMS: D/A/K/M) ──
  {
    id: 'v_q22',
    tier: 'vocational',
    section: 'Purpose & Purushartha',
    dimension: 'purpose',
    title: 'Philosophy on Wealth & Financial Capital',
    scenario: 'What is your authentic, private perspective on capital accumulation and financial power?',
    options: [
      { id: 'D', code: 'D', label: 'Defensive Ammunition for Duty (Dharma)', desc: 'Capital is necessary leverage to protect duty, defend institutions, support dependents, and sustain civilizational righteousness.', weights: { purpose: { D: 3 } } },
      { id: 'A', code: 'A', label: 'The Scoreboard of Compounding Value (Artha)', desc: 'Capital is the primary metric of economic reality, enabling massive systems building, resource coordination, and enduring wealth.', weights: { purpose: { A: 3 } } },
      { id: 'K', code: 'K', label: 'Fuel for Sensory Elegance & Beauty (Kama)', desc: 'Capital exists to be enjoyed—to fund exquisite arts, travel, sensory elegance, architectural magnificence, and elevated living.', weights: { purpose: { K: 3 } } },
      { id: 'M', code: 'M', label: 'A Functional Utility to Transcend (Moksha)', desc: 'Money is merely biological maintenance; genuine wealth is mental stillness, self-mastery, non-attachment, and spiritual liberation.', weights: { purpose: { M: 3 } } }
    ]
  },
  {
    id: 'v_q23',
    tier: 'vocational',
    section: 'Purpose & Purushartha',
    dimension: 'purpose',
    title: 'Deciding on a Career Pivot or Promotion',
    scenario: 'You are offered a prestigious C-suite role offering triple your current compensation, but it requires compromising one dimension of your values. What guides your decision?',
    options: [
      { id: 'D', code: 'D', label: 'Ethical Concordance (Dharma)', desc: 'Reject it instantly if it violates your moral compass or harms vulnerable stakeholders; honor and righteous conduct come first.', weights: { purpose: { D: 3 } } },
      { id: 'A', code: 'A', label: 'Long-Term Strategic Leverage (Artha)', desc: 'Evaluate if the financial and institutional power gained can be leveraged to outmaneuver the compromises and build net-positive scale.', weights: { purpose: { A: 3 } } },
      { id: 'K', code: 'K', label: 'Passion & Joy of the Craft (Kama)', desc: 'Accept only if the daily labor brings genuine creative thrill, joy, and aesthetic delight; life is too short for joyless toil.', weights: { purpose: { K: 3 } } },
      { id: 'M', code: 'M', label: 'Mental Freedom & Sovereignty (Moksha)', desc: 'Reject it if the status golden handcuffs increase mental agitation, trap you in toxic politics, or steal your contemplative peace.', weights: { purpose: { M: 3 } } }
    ]
  },
  {
    id: 'v_q24',
    tier: 'vocational',
    section: 'Purpose & Purushartha',
    dimension: 'purpose',
    title: 'Role of Aesthetics & Elegance in Work',
    scenario: 'How important is aesthetic grace, visual elegance, and sensory beauty in your daily deliverables?',
    options: [
      { id: 'D', code: 'D', label: 'Subordinate to Truth & Duty (Dharma)', desc: 'Aesthetics are secondary; what matters is whether the system is morally sound, honest, and reliably accomplishes its purpose.', weights: { purpose: { D: 3 } } },
      { id: 'A', code: 'A', label: 'Subordinate to Functional Utility (Artha)', desc: 'Aesthetics matter only insofar as they improve market conversion, increase user retention, and drive commercial profitability.', weights: { purpose: { A: 3 } } },
      { id: 'K', code: 'K', label: 'An Essential Core Value (Kama)', desc: 'Beauty and elegance are non-negotiable; a product without soul, harmony, and sensory refinement is a failure of craftsmanship.', weights: { purpose: { K: 3 } } },
      { id: 'M', code: 'M', label: 'Transcended in Pure Light (Moksha)', desc: 'All physical forms are transient illusions; inner equanimity and truth far surpass temporary outer ornamentation.', weights: { purpose: { M: 3 } } }
    ]
  },
  {
    id: 'v_q25',
    tier: 'vocational',
    section: 'Purpose & Purushartha',
    dimension: 'purpose',
    title: 'Response to Winning the Game of Life',
    scenario: 'Imagine you achieve absolute financial independence at age 40 with 100 million dollars in the bank. What does your next decade look like?',
    options: [
      { id: 'D', code: 'D', label: 'Civic Service & Protecting Righteousness (Dharma)', desc: 'Establish non-profit legal and ethical defense institutions to protect civilizational heritage, justice, and community resilience.', weights: { purpose: { D: 3 } } },
      { id: 'A', code: 'A', label: 'Scaling Even Larger Global Engines (Artha)', desc: 'Found an industrial conglomerate or sovereign fund to tackle multi-generational infrastructure and technological frontiers.', weights: { purpose: { A: 3 } } },
      { id: 'K', code: 'K', label: 'Total Cultural & Creative Immersion (Kama)', desc: 'Dedicate your life to high arts, patronizing master artisans, writing symphonies/epics, and exploring exquisite global experiences.', weights: { purpose: { K: 3 } } },
      { id: 'M', code: 'M', label: 'Solitary Contemplation & Sadhana (Moksha)', desc: 'Retire into meditative contemplation, study ancient sacred scriptures, master pranayama and inner consciousness in peaceful silence.', weights: { purpose: { M: 3 } } }
    ]
  },
  {
    id: 'v_q26',
    tier: 'vocational',
    section: 'Purpose & Purushartha',
    dimension: 'purpose',
    title: 'The Nature of True Freedom',
    scenario: 'What is your authentic definition of the word "Freedom"?',
    options: [
      { id: 'D', code: 'D', label: 'Freedom to Fulfill Sacred Duty (Dharma)', desc: 'Having the autonomy to live with moral integrity, protect those dependent on you, and uphold truth without political compromise.', weights: { purpose: { D: 3 } } },
      { id: 'A', code: 'A', label: 'Sovereign Material Power & Autonomy (Artha)', desc: 'Having complete economic leverage so that no external entity or market condition can ever dictate your actions or limit your scale.', weights: { purpose: { A: 3 } } },
      { id: 'K', code: 'K', label: 'Freedom to Pursue Deep Passion & Joy (Kama)', desc: 'Having the liberty to love, create, experience beauty, travel freely, and immerse yourself in creative flow without mundane restrictions.', weights: { purpose: { K: 3 } } },
      { id: 'M', code: 'M', label: 'Freedom from the Bondage of the Mind (Moksha)', desc: 'Transcendence of ego, desires, fears, and conditioning; resting permanently in the witness consciousness beyond birth and death.', weights: { purpose: { M: 3 } } }
    ]
  },
  {
    id: 'v_q27',
    tier: 'vocational',
    section: 'Purpose & Purushartha',
    dimension: 'purpose',
    title: 'Final Existential Retrospective',
    scenario: 'Looking back at the very conclusion of your lifespan, which realization confirms your journey was triumphant?',
    options: [
      { id: 'D', code: 'D', label: '"I Stood Firm for Righteousness" (Dharma)', desc: '"I never sold my soul for expediency; I shielded the defenseless, honored my commitments, and left an unblemished moral legacy."', weights: { purpose: { D: 3 } } },
      { id: 'A', code: 'A', label: '"I Built Enduring Prosperity" (Artha)', desc: '"I turned scarcity into abundance, founded enduring enterprises, and created engines of prosperity that nourished thousands of families."', weights: { purpose: { A: 3 } } },
      { id: 'K', code: 'K', label: '"I Celebrated the Wonder of Creation" (Kama)', desc: '"I tasted the deep nectar of human art, lived with fierce creative passion, loved deeply, and left the world richer in beauty."', weights: { purpose: { K: 3 } } },
      { id: 'M', code: 'M', label: '"I Woke Up from the Illusion" (Moksha)', desc: '"I conquered ignorance, severed identification with the transient ego, and returned to the unconditioned Supreme Truth in peace."', weights: { purpose: { M: 3 } } }
    ]
  }
];

// ── 6 VIKRITI BURNOUT AUDIT SCENARIOS ──
const VIKRITI_QUESTIONS = [
  {
    id: 'v1',
    category: 'Biological & Pranamaya Load',
    title: 'Sleep & Nervous System Depletion',
    prompt: 'Over the past 90 days, your sleep quality and morning energy can be described as:',
    options: [
      { code: 'V_LOW', label: 'Balanced (Sattva)', desc: 'Waking naturally refreshed around dawn; clear mental focus; zero sleep aids needed.', score: 0 },
      { code: 'V_MED', label: 'Agitated (Rajas)', desc: 'Waking with racing thoughts; relying on caffeine to start; heart palpitating occasionally.', score: 2 },
      { code: 'V_HIGH', label: 'Exhausted (Tamas)', desc: 'Heavy brain fog; feeling drained despite 8+ hours in bed; profound chronic fatigue.', score: 4 }
    ]
  },
  {
    id: 'v2',
    category: 'Cognitive & Manomaya Fragmentation',
    title: 'Attention Span & Digital Sensory Load',
    prompt: 'When attempting 90 minutes of continuous deep work, your mind experiences:',
    options: [
      { code: 'V_LOW', label: 'Unbroken Flow', desc: 'Effortless immersion in single-pointed focus (Ekagrata) without impulse to check notifications.', score: 0 },
      { code: 'V_MED', label: 'Restless Multi-Tasking', desc: 'Compulsive tab-switching; feeling anxious if away from communication tools for more than 20 minutes.', score: 2 },
      { code: 'V_HIGH', label: 'Cognitive Paralysis', desc: 'Overwhelmed by micro-decisions; doom-scrolling to escape dread; inability to complete tasks.', score: 4 }
    ]
  },
  {
    id: 'v3',
    category: 'Workplace Environment & Paradharma',
    title: 'Alignment with Current Job Role',
    prompt: 'How closely does your current daily corporate role align with your natural Swabhava?',
    options: [
      { code: 'V_LOW', label: 'Strong Swadharma', desc: 'I do work that feels organic to my natural gifts; my energy expands after working.', score: 0 },
      { code: 'V_MED', label: 'Mild Paradharma', desc: 'I am good at my job, but it drains me; I perform for compensation and social status.', score: 2 },
      { code: 'V_HIGH', label: 'Severe Paradharma', desc: 'I feel like a fraud or machine; daily tasks contradict my deepest values; intense burnout.', score: 4 }
    ]
  },
  {
    id: 'v4',
    category: 'Emotional Reactivity',
    title: 'Response to Mild Workplace Friction',
    prompt: 'When a colleague or manager gives critical feedback or challenges your proposal:',
    options: [
      { code: 'V_LOW', label: 'Objective Discernment', desc: 'I listen calmly, extract useful data, and improve without taking personal offense.', score: 0 },
      { code: 'V_MED', label: 'Defensive Irritation', desc: 'I feel an instant surge of defensive pride, irritability, or need to prove them wrong.', score: 2 },
      { code: 'V_HIGH', label: 'Numb Withdrawal', desc: 'I feel crushed, cynical, or completely disconnected, thinking "nothing matters anyway".', score: 4 }
    ]
  },
  {
    id: 'v5',
    category: 'Somatic Health & Digestion (Agni)',
    title: 'Digestive Fire & Metabolic Vitality',
    prompt: 'How is your digestion and physical metabolism under current work deadlines?',
    options: [
      { code: 'V_LOW', label: 'Clean Agni', desc: 'Steady appetite, clean digestion, no acid reflux or bloating, robust vitality.', score: 0 },
      { code: 'V_MED', label: 'Irregular Pitta/Vata', desc: 'Acid reflux, skipped meals, nervous stomach, or stress snacking on junk food.', score: 2 },
      { code: 'V_HIGH', label: 'Sluggish Manda-Agni', desc: 'Heavy sluggishness after food, chronic bloating, relying on antacids and stimulants.', score: 4 }
    ]
  },
  {
    id: 'v6',
    category: 'Existential Fulfillment',
    title: 'Sense of Sacred Purpose (Purushartha)',
    prompt: 'When you reflect on the ultimate meaning and impact of your work over the past year:',
    options: [
      { code: 'V_LOW', label: 'Deeply Meaningful', desc: 'I feel my labor serves a noble purpose and contributes to human flourishing.', score: 0 },
      { code: 'V_MED', label: 'Mixed / Transactional', desc: 'It pays the bills and gives status, but leaves my deeper soul somewhat empty.', score: 2 },
      { code: 'V_HIGH', label: 'Existential Nausea', desc: 'I feel trapped in soul-crushing corporate theater; desperate for a radical life pivot.', score: 4 }
    ]
  }
];

module.exports = {
  RAPID_QUESTIONS,
  VOCATIONAL_QUESTIONS_27,
  VIKRITI_QUESTIONS
};
