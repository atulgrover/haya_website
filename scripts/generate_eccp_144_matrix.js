'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * HPTI 144 ARCHETYPE MATRIX GENERATOR
 * Generates the complete 144-cell ECCP Ontological Lexicon
 * 3 Energies x 3 Cognitions x 4 Competencies x 4 Purposes = 144
 * ══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// 16 Core Functional Archetypes (Competency x Purpose)
const CORE_FUNCTIONAL_TITLES = {
  'B-D': {
    title: 'The Ethical Jurist',
    sanskrit: 'Niti-Kovidha',
    epic_anchor: 'Vidura',
    primary_sector: 'Constitutional Law, Institutional Ethics & Public Policy',
    qp_code: 'MEP/Q0214',
    nsqf_level: 9,
    onet: '23-1011.00',
    base_summary: 'Dedicated to upholding universal righteousness, constitutional law, and moral clarity through theoretical depth and systemic discernment.',
    careers: ['Supreme Court Justice / Constitutional Arbitrator', 'AI & Bioethics Lead Commissioner', 'Institutional Integrity Ombudsperson', 'Legal Philosophy Scholar']
  },
  'B-A': {
    title: 'The Institutional Architect',
    sanskrit: 'Kautilya-Niti',
    epic_anchor: 'Chanakya',
    primary_sector: 'Geopolitics, Macroeconomic Systems & Strategic Governance',
    qp_code: 'MEP/Q0202',
    nsqf_level: 9,
    onet: '19-3011.00',
    base_summary: 'Applies deep intellectual models, systemic incentives, and theoretical rigor to design resilient economic and state governance engines.',
    careers: ['National Security & Geopolitical Advisor', 'Macroeconomic Policy Architect', 'Quantitative Systems Strategist', 'Chief Risk & Governance Officer']
  },
  'B-K': {
    title: 'The Creative Theorist',
    sanskrit: 'Jnana-Kavi',
    epic_anchor: 'Valmiki',
    primary_sector: 'Culture, Narrative Architecture & Humanistic Sciences',
    qp_code: 'MES/Q0108',
    nsqf_level: 8,
    onet: '27-3043.00',
    base_summary: 'Unites profound philosophical knowledge with aesthetic finessing, narrative design, and cultural storytelling that transforms human consciousness.',
    careers: ['Cultural Historian & Author', 'Narrative Worldbuilding Architect', 'Cognitive Ergonomics & Design Philosopher', 'Creative Media Director']
  },
  'B-M': {
    title: 'The Transcendent Sage',
    sanskrit: 'Brahma-Vid',
    epic_anchor: 'Sage Vyasa',
    primary_sector: 'Epistemology, Pure Research & Contemplative Science',
    qp_code: 'EDU/Q0101',
    nsqf_level: 10,
    onet: '25-1126.00',
    base_summary: 'Devoted to foundational first principles, consciousness research, metaphysical inquiry, and the preservation of civilizational wisdom.',
    careers: ['Foundational Epistemological Theorist', 'Consciousness & Cognitive Neuroscientist', 'Distinguished Research Chair', 'Vedantic & Shastric Preceptor']
  },
  'K-D': {
    title: 'The Righteous Sovereign',
    sanskrit: 'Dharmika-Sovereign',
    epic_anchor: 'Sri Rama',
    primary_sector: 'Sovereign Executive Leadership & Defense Governance',
    qp_code: 'MEP/Q0211',
    nsqf_level: 10,
    onet: '11-1011.00',
    base_summary: 'High-stakes sovereign leadership anchored in incorruptible duty, protective stewardship, and absolute commitment to societal well-being.',
    careers: ['Head of State / Chancellor of Public Administration', 'Defense Operations Commander', 'National Disaster Relief Director', 'Crisis Governance Lead']
  },
  'K-A': {
    title: 'The Strategic Commander',
    sanskrit: 'Dhananjaya',
    epic_anchor: 'Arjuna',
    primary_sector: 'Strategic Operations, Aerospace & Enterprise Command',
    qp_code: 'MEP/Q0201',
    nsqf_level: 9,
    onet: '11-1021.00',
    base_summary: 'Elite tactical mastery, competitive focus, decisive execution, and high-performance mission assembly under extreme crisis conditions.',
    careers: ['Chief Technology & Operations Officer', 'Tactical Defense Wing Commander', 'High-Growth Enterprise Scale Executive', 'Mission Incident Commander']
  },
  'K-K': {
    title: 'The Chivalric Vanguard',
    sanskrit: 'Yoddha-Premi',
    epic_anchor: 'Abhimanyu',
    primary_sector: 'Elite Tactical Intervention & High-Risk Vanguard Operations',
    qp_code: 'SEC/Q0105',
    nsqf_level: 8,
    onet: '33-3011.00',
    base_summary: 'Heroic valor, passionate devotion to breakthrough missions, chivalric loyalty, and dramatic tactical interventions in impossible scenarios.',
    careers: ['Elite Tactical Squadron Leader', 'Emergency Special Operations Director', 'Experimental Aerospace Test Pilot', 'High-Stakes Expedition Commander']
  },
  'K-M': {
    title: 'The Detached Sovereign',
    sanskrit: 'Mahavira-Bhakta',
    epic_anchor: 'Sri Hanuman',
    primary_sector: 'Sovereign Service, Aerospace & Humanitarian Crisis Missions',
    qp_code: 'MEP/Q0220',
    nsqf_level: 9,
    onet: '29-1021.00',
    base_summary: 'Colossal physical and strategic capability surrendered entirely to selfless service, egoless duty, and transcendent mission execution.',
    careers: ['Aerospace Deep Space Operations Director', 'Trauma Surgery Crisis Team Lead', 'Global Humanitarian Rescue Director', 'National Defense Chief of Staff']
  },
  'V-D': {
    title: 'The Fiduciary Custodian',
    sanskrit: 'Dharma-Vanik',
    epic_anchor: 'King Janaka',
    primary_sector: 'Ethical Finance, Sovereign Wealth & Social Impact Funds',
    qp_code: 'BSC/Q0101',
    nsqf_level: 9,
    onet: '13-2051.00',
    base_summary: 'Stewards capital, economic ecosystems, and material resources strictly as a sacred fiduciary trust for regenerative societal abundance.',
    careers: ['Sovereign Wealth Fund Custodian', 'Regenerative Impact Fund Managing Director', 'Ethical Supply Chain Chief Commissioner', 'Foundation Trust President']
  },
  'V-A': {
    title: 'The Enterprise Scaler',
    sanskrit: 'Vanijya-Pati',
    epic_anchor: 'Sugriva',
    primary_sector: 'Commercial Conglomerates, Venture Capital & Global Markets',
    qp_code: 'MEP/Q0102',
    nsqf_level: 8,
    onet: '11-2022.00',
    base_summary: 'Commands market forces, resource pooling, strategic commercial alliances, and exponential compound growth across multi-tiered economies.',
    careers: ['Industrial Conglomerate CEO', 'Venture Capital Managing Partner', 'Global Supply Logistics Director', 'Commercial Ecosystem Founder']
  },
  'V-K': {
    title: 'The Cultural Merchant',
    sanskrit: 'Rasa-Vanik',
    epic_anchor: 'Kubera (Rajas)',
    primary_sector: 'Luxury Commerce, Experiential Arts & Creative Retail',
    qp_code: 'RET/Q0104',
    nsqf_level: 7,
    onet: '41-1011.00',
    base_summary: 'Bridges market efficiency with refined aesthetic enjoyment, sensory luxury, experiential hospitality, and patronage of the fine arts.',
    careers: ['Luxury Brand Global Director', 'Cultural Experience & Hospitality Executive', 'Fine Arts & Antiquities Market Broker', 'High-End Retail Ecosystem Architect']
  },
  'V-M': {
    title: 'The Philanthropic Custodian',
    sanskrit: 'Maha-Data',
    epic_anchor: 'Bharata',
    primary_sector: 'Civilizational Endowments & Non-Profit Institutions',
    qp_code: 'MEP/Q0218',
    nsqf_level: 8,
    onet: '11-9151.00',
    base_summary: 'Orchestrates enterprise surplus specifically to dissolve wealth into philanthropic foundations, hospitals, and civilizational sanctuaries.',
    careers: ['Civilizational Endowment Managing Trustee', 'Philanthropic Healthcare Network President', 'Education Access Trust Director', 'Sovereign Heritage Fund Lead']
  },
  'S-D': {
    title: 'The Steadfast Operational Guardian',
    sanskrit: 'Seva-Sthira',
    epic_anchor: 'Vidura (Loyalty)',
    primary_sector: 'Critical Infrastructure, Safety & Operational Reliability',
    qp_code: 'MEP/Q0106',
    nsqf_level: 7,
    onet: '17-2111.00',
    base_summary: 'Provides the unwavering operational discipline, safety oversight, and hands-on maintenance required to preserve critical human infrastructure.',
    careers: ['Nuclear & Power Grid Safety Marshal', 'Critical Infrastructure Maintenance Lead', 'Hospital Operations Lead Officer', 'Regulatory Compliance Inspector']
  },
  'S-A': {
    title: 'The Industrial Operations Lead',
    sanskrit: 'Karmadhikari',
    epic_anchor: 'Nala (Engineer)',
    primary_sector: 'Advanced Manufacturing, Robotics & Tooling Engineering',
    qp_code: 'CSC/Q0112',
    nsqf_level: 8,
    onet: '17-2199.00',
    base_summary: 'Direct master craftsman of complex hardware, automated robotics lines, industrial assembly, and precision physical tooling.',
    careers: ['Advanced Manufacturing Plant Director', 'Robotics Hardware Systems Specialist', 'Precision Aerospace Tooling Machinist', 'Industrial Process Lead']
  },
  'S-K': {
    title: 'The Master Artisan',
    sanskrit: 'Shilpi-Raja',
    epic_anchor: 'Vishvakarma',
    primary_sector: 'Precision Craft, Architectural Heritage & Spatial Design',
    qp_code: 'HCS/Q0102',
    nsqf_level: 7,
    onet: '27-1012.00',
    base_summary: 'Exceptional sensory and tactile refinement; transforms raw physical matter into beautiful sacred architecture, artifacts, and tools.',
    careers: ['Sacred Architectural Restorer', 'Master Industrial Product Designer', 'High-End Spatial & Physical Fabricator', 'Heritage Instrument Maker']
  },
  'S-M': {
    title: 'The Selfless Karma-Yogi',
    sanskrit: 'Yajna-Karmi',
    epic_anchor: 'Shabari',
    primary_sector: 'Regenerative Agriculture, Organic Ecology & Sacred Service',
    qp_code: 'AGR/Q0108',
    nsqf_level: 6,
    onet: '19-1011.00',
    base_summary: 'Transforms everyday manual labor, agriculture, and hands-on service into a meditative communion of pure devotion and inner stillness.',
    careers: ['Regenerative Organic Farm Director', 'Soil Biology & Permaculture Specialist', 'Contemplative Hospice Caregiver', 'Heritage Sanctuary Custodian']
  }
};

// Energy Dynamic Modifiers
const ENERGY_PROFILES = {
  'S': {
    name: 'Sattvik',
    prefix: 'Sattvik',
    sanskrit_prefix: 'Sattvik',
    summary_tint: 'governed by serene clarity, non-possessive detachment, incorruptible ethics, and unshakeable balance',
    shadow_risk: 'Can become overly aloof, slow to enforce swift punitive measures, or vulnerable to paralysis by perfectionism.',
    sadhana: {
      pranayama: 'Nadi Shodhana (15 mins) & Sheetali for nervous system poise',
      ahara: 'Fresh seasonal fruits, whole grains, cow ghee, warm almond milk',
      dinacharya: 'Brahma Muhurta (04:30 AM) silent contemplation and nature walking'
    }
  },
  'R': {
    name: 'Rajasik',
    prefix: 'Rajasik',
    sanskrit_prefix: 'Rajasik',
    summary_tint: 'fueled by high kinetic drive, competitive intensity, scaling ambitions, and relentless transformative momentum',
    shadow_risk: 'Vulnerable to adrenal exhaustion, impatience with slower collaborators, chronic status anxiety, and burnout.',
    sadhana: {
      pranayama: 'Bhastrika & Kapalabhati followed by grounding deep belly breathing',
      ahara: 'Hydrating coconut water, calming cooling herbs (Brahmi, Ashwagandha), reduced caffeine',
      dinacharya: 'Strict digital detox by 9:00 PM; intentional stillness breaks during peak work'
    }
  },
  'T': {
    name: 'Tamasik',
    prefix: 'Conservator',
    sanskrit_prefix: 'Sthira (Conservator)',
    summary_tint: 'characterized by deep stability, institutional memory, routine adherence, or in stressful shadow states, inertia and resistance to change',
    shadow_risk: 'Prone to cognitive rigidity, complacency in obsolete protocols, cynical withdrawal, or risk paralysis under crisis.',
    sadhana: {
      pranayama: 'Surya Bhedana & vigorous Kapalabhati to awaken sluggish metabolic agni',
      ahara: 'Light, warm, pungent spices (ginger, black pepper, turmeric); zero heavy oily foods',
      dinacharya: 'Mandatory 6:00 AM brisk exercise; progressive task slicing to overcome inertia'
    }
  }
};

// Cognition Modifiers
const COGNITION_PROFILES = {
  'BM': {
    name: 'Buddhi-Led',
    moniker: 'Intellect-Led',
    sanskrit_mid: 'Buddhi',
    focus: 'Strategic discernment, first-principles logic, long-range systemic forecasting, and objective detachment from temporary emotions.'
  },
  'MM': {
    name: 'Manas-Led',
    moniker: 'Intuition-Led',
    sanskrit_mid: 'Manas',
    focus: 'High emotional sensitivity, relational resonance, intuitive pattern recognition, and experiential empathy.'
  },
  'AM': {
    name: 'Ahankara-Led',
    moniker: 'Sovereign-Will',
    sanskrit_mid: 'Ahankara',
    focus: 'Indomitable personal agency, high identity pride, sovereign responsibility, and deep drive for lasting personal legacy.'
  }
};

// Generate Centroid Vector [v_E(3) | v_C(3) | v_V(4) | v_P(4)] -> 14 Dimensions
function generateCentroid(gunaKey, cogKey, compKey, purpKey) {
  const eVec = { S: [1.0, 0.0, 0.0], R: [0.0, 1.0, 0.0], T: [0.0, 0.0, 1.0] }[gunaKey];
  const cVec = { BM: [1.0, 0.0, 0.0], MM: [0.0, 1.0, 0.0], AM: [0.0, 0.0, 1.0] }[cogKey];
  const vVec = { B: [1.0, 0.0, 0.0, 0.0], K: [0.0, 1.0, 0.0, 0.0], V: [0.0, 0.0, 1.0, 0.0], S: [0.0, 0.0, 0.0, 1.0] }[compKey];
  const pVec = { D: [1.0, 0.0, 0.0, 0.0], A: [0.0, 1.0, 0.0, 0.0], K: [0.0, 0.0, 1.0, 0.0], M: [0.0, 0.0, 0.0, 1.0] }[purpKey];

  return [...eVec, ...cVec, ...vVec, ...pVec];
}

// Generate the 144 Matrix
function build144Matrix() {
  const matrix = {};
  const archetypesList = [];

  const gunas = ['S', 'R', 'T'];
  const cognitions = ['BM', 'MM', 'AM'];
  const competencies = ['B', 'K', 'V', 'S'];
  const purposes = ['D', 'A', 'K', 'M'];

  let count = 0;

  for (const g of gunas) {
    for (const c of cognitions) {
      for (const comp of competencies) {
        for (const p of purposes) {
          count++;
          const code = `${g}-${c}-${comp}-${p}`;
          const coreKey = `${comp}-${p}`;
          const core = CORE_FUNCTIONAL_TITLES[coreKey];
          const energy = ENERGY_PROFILES[g];
          const cognition = COGNITION_PROFILES[c];

          const englishTitle = `${energy.prefix} ${cognition.moniker} ${core.title}`;
          const sanskritTitle = `${energy.sanskrit_prefix} ${cognition.sanskrit_mid} ${core.sanskrit}`;

          const centroid = generateCentroid(g, c, comp, p);

          const record = {
            id: code.toLowerCase(),
            eccp_code: code,
            english_title: englishTitle,
            sanskrit_title: sanskritTitle,
            core_functional_title: core.title,
            energy_mode: energy.name,
            cognition_locus: cognition.name,
            competency_domain: { B: 'Brahmana', K: 'Kshatriya', V: 'Vaishya', S: 'Shudra' }[comp],
            purpose_vector: { D: 'Dharma', A: 'Artha', K: 'Kama', M: 'Moksha' }[p],
            epic_anchor: core.epic_anchor,
            psychological_summary: `An archetype that channels ${energy.summary_tint}. Cognition is ${cognition.focus.toLowerCase()} Operating as ${core.title}, the individual is ${core.base_summary.toLowerCase()}`,
            shadow_warning: energy.shadow_risk,
            ncvet_alignment: {
              primary_sector: core.primary_sector,
              nsqf_level: core.nsqf_level,
              qp_code: core.qp_code,
              us_onet_code: core.onet,
              aligned_careers: core.careers
            },
            sadhana_protocol: energy.sadhana,
            centroid_vector: centroid,
            rag_prompt_template: `You are evaluating an individual with HPTI Code ${code} (${englishTitle}). Innate Competency: ${{ B: 'Brahmana (Knowledge & Systems)', K: 'Kshatriya (Sovereign Executive & Defense)', V: 'Vaishya (Capital Stewardship & Scale)', S: 'Shudra (Operational Precision & Direct Craft)' }[comp]}. Teleological Drive: ${{ D: 'Dharma (Righteous Order)', A: 'Artha (Economic Abundance)', K: 'Kama (Creative & Aesthetic Mastery)', M: 'Moksha (Detachment & Inner Freedom)' }[p]}. Provide counseling grounded in ${core.epic_anchor}'s conduct in the Itihasas and map their career pathways to NSQF Level ${core.nsqf_level} standard (${core.qp_code}).`
          };

          matrix[code] = record;
          archetypesList.push(record);
        }
      }
    }
  }

  return { matrix, archetypesList, total: count };
}

// Write to Disk
const { matrix, archetypesList, total } = build144Matrix();

const outPath = path.join(__dirname, '../server/data/eccp_144_matrix.json');
fs.writeFileSync(outPath, JSON.stringify({ total, archetypes: matrix, list: archetypesList }, null, 2), 'utf8');

console.log(`Successfully generated complete 144 Archetype Matrix at ${outPath} (${total} profiles).`);
