'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {
  loadMatrix,
  normalizeSubvectors,
  matchCentroids,
  getArchetypeByCode,
  synthesizeDynamicProfile
} = require('../utils/eccpMatrix');

const {
  RAPID_QUESTIONS,
  VOCATIONAL_QUESTIONS_27,
  VIKRITI_QUESTIONS
} = require('../utils/questionBank');

const {
  recordSessionTelemetry,
  getPsychometricReport,
  exportFactorAnalysisCSV
} = require('../utils/psychometrics');

const {
  generateGroundedCounsel,
  searchKnowledge,
  searchKnowledgeDb
} = require('../utils/knowledgeRetriever');

const db = require('../db');
const {
  TOP_FLAGSHIP_SECTORS,
  FLAGSHIP_ALIGNMENTS,
  getAvailableSectors,
  getCareersForSector
} = require('../utils/careerAligner');

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  HAYA PERSONALITIES API ROUTER                                  ║
 * ║  Vedic Typology • ECCP Framework • Ramayana & Mahabharata        ║
 * ║  NCVET & NSQF Certified Vocational Alignment                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// 24 Curated Epic Archetypes spanning the Three Sovereign Tiers
const EPIC_ARCHETYPES = [
  // ══════════════════════════════════════════════════════════════════
  // TIER 1: SATTVIK VANGUARD (Clarity, Ethics, Wisdom & Detachment)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'rama',
    name: 'Sri Rama',
    sanskrit_title: 'Maryada Purushottama',
    english_moniker: 'The Sovereign Dharmic Anchor',
    tier: 'sattvik',
    epic: 'Ramayana',
    eccp_code: 'SS-BM-K-D',
    guna_base: 'Shuddha Sattva (Incorruptible Moral Equilibrium & Grace)',
    antahkarana: 'Buddhi-Led (Steadfast Adherence to Universal Righteous Order)',
    competency: 'Kshatriya (Protector of Ecosystems, King of Kings)',
    purpose: 'Dharma (The Anchor of Righteous Living, Truth as Highest Command)',
    epic_citation: 'Valmiki Ramayana Aranya Kanda 37.13',
    devanagari: 'रामो विग्रहवान् धर्मः साधुः सत्यपराक्रमः ।\nराजा सर्वस्य लोकस्य देवानाम् इव वासवः ॥',
    quote: 'rāmo vigrahavān dharmaḥ sādhuḥ satya-parākramaḥ (Rama is the very embodiment of Dharma, saintly, whose valour is rooted solely in truth).',
    psychological_summary: 'The ultimate standard of disciplined leadership. Unswayed by comfort or adversity, puts the well-being of the collective above personal sovereignty or gratification. Rules as a constitutional servant of cosmic order.',
    shadow_warning: 'Vulnerability to sacrificing personal happiness and private intimacies to satisfy perceived public expectations (Lokapavada).',
    aligned_ncvet_careers: [
      'Supreme Court Chief Justice / Constitutional Arbitrator (NSQF Level 10)',
      'Head of State / Chancellor of Public Administration',
      'Global Ethics & Integrity Officer (Fortune 500)',
      'President of Social Reconstruction Foundations',
      'Chief Regulatory Commissioner'
    ],
    ncvet_details: {
      nsqf_level: 10,
      qp_code: 'MEP/Q0214',
      ssc_council: 'Management & Professional Skills (MEPSC)',
      us_onet_code: '11-1011.00'
    },
    sadhana_protocol: {
      pranayama: 'Nadi Shodhana (15 mins) & Ujjayi to anchor serene nervous system balance',
      ahara: 'Pure Sattvik seasonal fruits, whole grains, cow ghee, almond milk; zero processed stims',
      dinacharya: 'Brahma Muhurta (04:30 AM) contemplation; non-reactive evening walking in nature'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Judiciary, Sovereign Leadership, Institutional Ethics',
    color: '#0284C7',
    icon: '👑'
  },
  {
    id: 'vidura',
    name: 'Vidura',
    sanskrit_title: 'Niti-Kovidha',
    english_moniker: 'The Constitutional Jurist & Policy Architect',
    tier: 'sattvik',
    epic: 'Mahabharata',
    eccp_code: 'SS-BM-B-D',
    guna_base: 'Sattvik (Unshakable Cognitive Clarity & Ethical Rectitude)',
    antahkarana: 'Buddhi-Led (First-Principles, Systems-Oriented, Universal Laws)',
    competency: 'Brahmana (Knowledge Architecture, Synthesis, Policy Debugging)',
    purpose: 'Dharma (Systemic Integrity, Fearless Counsel, Institutional Justice)',
    epic_citation: 'Mahabharata Udyoga Parva (Vidura Niti 33.15)',
    devanagari: 'एकं हन्ति न शस्त्रेण विप्रश्चरन्नपि ।\nहन्ति राष्ट्रं सराजाकं यन्मन्त्रो न प्रशस्यते ॥',
    quote: 'ekaṁ hanti na śastreṇa... (A single weapon kills but one soldier, but a corrupted council destroys an entire empire, king, and society).',
    psychological_summary: 'Unshakable objective discernment (Viveka). Sees macro trends decades in advance. Unflinching truth-teller who creates governance structures that withstand corruption, greed, and generational decay.',
    shadow_warning: 'Deep psychological sorrow and isolation watching leaders self-destruct after ignoring wise counsel; must cultivate detached transcendence.',
    aligned_ncvet_careers: [
      'Chief Ethics & Legal Compliance Officer (NSQF Level 10)',
      'Lead Independent Board Director & Governance Lead',
      'Principal Policy Advisor & Public Think-Tank Director',
      'Artificial Intelligence Safety & Algorithmic Auditor',
      'National Economic Advisory Council Member'
    ],
    ncvet_details: {
      nsqf_level: 10,
      qp_code: 'MEP/Q0108',
      ssc_council: 'Management & Professional Skills (MEPSC)',
      us_onet_code: '23-1011.00'
    },
    sadhana_protocol: {
      pranayama: 'Bhramari (Humming bee resonance) to cool mental sorrow + Sheetali',
      ahara: 'Light Sattvik steamed lentils, leafy greens, warm cumin infusions; avoidance of stimulants',
      dinacharya: 'Daily study of classical treatises (Svadhyaya) during sunset sandhya'
    },
    compendium_chapter: 'Chapter 15: The Mahabharata Archetypal Spectrum',
    sector: 'IT-ITeS, Public Governance, Enterprise Architecture',
    color: '#7C3AED',
    icon: '📜'
  },
  {
    id: 'hanuman',
    name: 'Hanuman',
    sanskrit_title: 'Mahavira-Bhakta',
    english_moniker: 'The Integrated Polymath: Bal, Buddhi & Seva',
    tier: 'sattvik',
    epic: 'Ramayana',
    eccp_code: 'SS-BM-K-D',
    guna_base: 'Shuddha Sattva (Colossal Energy Channelled into Selfless Duty)',
    antahkarana: 'Buddhi-Ahankara (Infinite Agency Surrendered to Higher Mission)',
    competency: 'Kshatriya-Shudra (Absolute Tactical Execution & Operational Might)',
    purpose: 'Dharma & Seva (Nishkama Seva, Ultimate Problem Solver)',
    epic_citation: 'Valmiki Ramayana Sundara Kanda 1.1',
    devanagari: 'बुद्धिर्बलं यशोधैर्यं निर्भयत्वमरोगता ।\nअजाड्यं वाक्पटुत्वं च हनुमत्स्मरणाद्भवेत् ॥',
    quote: 'buddhir balaṁ yaśo dhairyaṁ nirbhayatvam arogatā... (Intellect, vigor, fame, fortitude, fearlessness, health, agility, and eloquence shine where Hanuman is contemplated).',
    psychological_summary: 'Possesses boundless energy and ingenuity. No obstacle is insurmountable; combines deep grammatical diplomacy with raw kinetic execution. Humble before the mission, unstoppable before adversity.',
    shadow_warning: 'The "Jambavan Effect": Tendency to underestimate one’s own boundless capability until awakened by trusted mentors.',
    aligned_ncvet_careers: [
      'VP of Mission-Critical Operations (NSQF Level 9)',
      'Chief Emergency Response & Disaster Relief Director',
      'Global Aerospace Payload & Mission Commander',
      'High-Risk Surgical Trauma Department Chair',
      'National Strategic Infrastructure Commander'
    ],
    ncvet_details: {
      nsqf_level: 9,
      qp_code: 'AAS/Q1101',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      us_onet_code: '11-9161.00'
    },
    sadhana_protocol: {
      pranayama: 'Surya Bhedana & Bhastrika (vitalizing lung capacity) + Trataka for focus',
      ahara: 'High-protein Sattvik nuts, figs, soaked almonds, dates, fresh dairy, banana flowers',
      dinacharya: 'Rigorous dawn physical discipline followed by silent contemplative surrender'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Disaster Relief, Aerospace Logistics, Critical Infrastructure',
    color: '#D97706',
    icon: '⛰️'
  },
  {
    id: 'sita',
    name: 'Sita Devi',
    sanskrit_title: 'Dharma-Dharini',
    english_moniker: 'The Resilient Sovereign & Ecological Conscience',
    tier: 'sattvik',
    epic: 'Ramayana',
    eccp_code: 'SS-BM-B-D',
    guna_base: 'Sattva-Pure (Dignity, Moral Fortitude, Ecological Equilibrium)',
    antahkarana: 'Buddhi-Led (Unshakable Sovereign Dignity in the Face of Tyranny)',
    competency: 'Brahmana-Kshatriya (Spiritual Sovereignty, Moral Defense)',
    purpose: 'Dharma (Universal Truth, Integrity, Sacred Balance)',
    epic_citation: 'Valmiki Ramayana Sundara Kanda 21.15',
    devanagari: 'न स्मराम्यपरं किञ्चिद् धर्मकार्यादृतेऽनघे ।\nमनसा कर्मणा वाचा नाधर्मं रोचयाम्यहम् ॥',
    quote: 'na smarāmy-aparaṁ kiñcid dharma-kāryād ṛte... (I know of nothing higher than righteous duty; in thought, word, and deed, I delight never in unrighteousness).',
    psychological_summary: 'Radiant psychological sovereignty; absolute refusal to capitulate to intimidation, bribery, or luxury. Stands unbending against an imperial tyrant (Ravana in Ashoka Vatika). Deep affinity with living earth and nature.',
    shadow_warning: 'Vulnerability to unmerited societal ingratitude and institutional betrayals despite spotless rectitude.',
    aligned_ncvet_careers: [
      'Chief Sustainability Officer & Environmental Director (NSQF Level 9)',
      'International Human Rights Legal Commissioner',
      'Ecological Restoration & Forest Governance Architect',
      'Supreme Appellate Mediator & Constitutional Trustee',
      'Dean of Bioethics & Planetary Health'
    ],
    ncvet_details: {
      nsqf_level: 9,
      qp_code: 'MEP/Q0205',
      ssc_council: 'Management & Professional Skills (MEPSC)',
      us_onet_code: '19-3094.00'
    },
    sadhana_protocol: {
      pranayama: 'Chandra Bhedana & Nadi Shodhana for deep cooling nervous resilience',
      ahara: 'Wild forest botanicals, fresh herbal decoctions, raw honey, ancient millets',
      dinacharya: 'Dawn walking barefoot on dewy earth; silence during morning twilight'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Environmental Governance, Human Rights, Bioethics',
    color: '#059669',
    icon: '🌿'
  },
  {
    id: 'vyasa',
    name: 'Sage Vyasa',
    sanskrit_title: 'Jnana-Sagara',
    english_moniker: 'The Universal Chronicler & Ontological Architect',
    tier: 'sattvik',
    epic: 'Mahabharata',
    eccp_code: 'SS-MM-B-M',
    guna_base: 'Sattvik-Tamasik (Grounded Stability, Deep Endurance, Preservation)',
    antahkarana: 'Buddhi-Led (Analytical, Synthesis of Civilizational Libraries)',
    competency: 'Brahmana (Deep Research, Philosophy, Historical Compilations)',
    purpose: 'Moksha (Truth-Seeking, Self-Realization, Timeless Clarity)',
    epic_citation: 'Mahabharata Adi Parva 1.267',
    devanagari: 'धर्मे चार्थे च कामे च मोक्षे च भरतर्षभ ।\nयदिहास्ति तदन्यत्र यन्नेहास्ति न तत् क्वचित् ॥',
    quote: 'dharme cārthe ca kāme ca mokṣe ca... (What is found here regarding human life may be found elsewhere; what is not found here cannot be found anywhere on Earth).',
    psychological_summary: 'Immense cognitive bandwidth for synthesizing vast, heterogeneous corpuses. Unmoved by short-term market noise; dedicates decades to establishing definitive reference frameworks.',
    shadow_warning: 'Aloofness from immediate human administrative frictions; tendency to view real-world suffering with philosophical detachment.',
    aligned_ncvet_careers: [
      'Chief Research Scientist & Foundational R&D Lead (NSQF Level 10)',
      'Domain Theorist & AI Model Architect',
      'University Chair & Dean of Philosophical Studies',
      'Compiler of National Technical Ontologies',
      'Open-Source Foundations Architect'
    ],
    ncvet_details: {
      nsqf_level: 10,
      qp_code: 'SSC/Q8108',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      us_onet_code: '15-2051.00'
    },
    sadhana_protocol: {
      pranayama: 'Ujjayi Pranayama during deep writing sprints; deep diaphragmatic retention',
      ahara: 'Simple satvik kichari, clarified butter, brahmi herbal infusions, warm milk',
      dinacharya: 'Unbroken 4-hour deep writing blocks before sunrise with absolute digital isolation'
    },
    compendium_chapter: 'Chapter 15: The Mahabharata Archetypal Spectrum',
    sector: 'Research & Development, Higher Education, Knowledge Repositories',
    color: '#0891B2',
    icon: '🪶'
  },
  {
    id: 'janaka',
    name: 'King Janaka',
    sanskrit_title: 'Rajarshi',
    english_moniker: 'The Philosopher-King & Sacred Capitalist',
    tier: 'sattvik',
    epic: 'Ramayana',
    eccp_code: 'SS-BM-V-D',
    guna_base: 'Sattva-Pure (Complete Detachment amidst Imperial Wealth)',
    antahkarana: 'Buddhi-Led (Non-attached Administration & Economic Mastery)',
    competency: 'Vaishya-Kshatriya (Sovereign Resource Governance & Philosophy)',
    purpose: 'Dharma & Moksha (Jivanmukta in Action, Stewardship)',
    epic_citation: 'Bhagavad Gita 3.20 (Karmanayeva hi samsiddhim asthita janakadayah)',
    devanagari: 'कर्मणैव हि संसिद्धिमास्थिता जनकादयः ।\nलोकसंग्रहमेवापि संपश्यन् कर्तुमर्हसि ॥',
    quote: 'karmaṇaiva hi saṁsiddhim āsthitā janakādayaḥ (By dedicated work alone did King Janaka and other great seers attain perfection; perform duty for universal welfare).',
    psychological_summary: 'The ultimate exemplar of the Jivanmukta ruler. Governs a prosperous empire, commands vast capital reserves, yet remains inwardly as detached as a hermit in the forest. Master of Nishkama Karma.',
    shadow_warning: 'Risk of intellectual fatigue when dealing with petty court squabbles; requires regular philosophical retreats.',
    aligned_ncvet_careers: [
      'Sovereign Wealth Fund Chairman (NSQF Level 10)',
      'Impact Investing Global Managing Director',
      'Chancellor of National Macroeconomic Architecture',
      'Philanthropic Endowment President',
      'Ecosystem Venture Builder'
    ],
    ncvet_details: {
      nsqf_level: 10,
      qp_code: 'BFS/Q4101',
      ssc_council: 'BFSI Sector Skill Council',
      us_onet_code: '11-3031.00'
    },
    sadhana_protocol: {
      pranayama: 'Nadi Shodhana with Kumbhaka (retention) + Vedantic Self-Inquiry (Atma-Vichara)',
      ahara: 'Sattvik royal fare: saffron milk, pomegranate, roasted barley, pure spring water',
      dinacharya: 'Morning meditation on the witness self (Sakshi) before reviewing treasury ledgers'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Capital Markets, Sovereign Wealth, Macroeconomic Policy',
    color: '#4F46E5',
    icon: '🏛️'
  },
  {
    id: 'bharata',
    name: 'Bharata',
    sanskrit_title: 'Paduka-Sevaka',
    english_moniker: 'The Fiduciary Trustee & Servant Leader',
    tier: 'sattvik',
    epic: 'Ramayana',
    eccp_code: 'SS-BM-K-D',
    guna_base: 'Shuddha Sattva (Supreme Renunciation of Imperial Greed)',
    antahkarana: 'Buddhi-Led (Fiduciary Custodianship over Personal Ownership)',
    competency: 'Kshatriya (Administrative Vigilance, Selfless Governance)',
    purpose: 'Dharma (Service to Principle, Incorruptible Stewardship)',
    epic_citation: 'Valmiki Ramayana Ayodhya Kanda 112.21',
    devanagari: 'एते हि सर्वलोकस्य योगक्षेमं विधास्यतः ।\nपादुके तव राजेन्द्र न्यासो मे दीयतामिति ॥',
    quote: 'ete hi sarva-lokasya yoga-kṣemaṁ vidhāsyataḥ... (These sacred sandals of Rama alone shall govern the realm; I rule merely as their humble trustee).',
    psychological_summary: 'Governs a vast superpower for 14 years without taking a single ounce of wealth or claiming personal status. Places his brother’s sandals on the throne and lives as an ascetic administrator in Nandigrama.',
    shadow_warning: 'Excessive self-inflicted guilt and austere self-denial; prone to taking total blame for historical family mistakes.',
    aligned_ncvet_careers: [
      'Managing Trustee of Global Public Endowments (NSQF Level 9)',
      'Interim Turnaround CEO / Caretaker Director',
      'Public Sector Corporation Managing Director',
      'Charitable Foundation Executive Trustee',
      'Constitutional Asset Custodian'
    ],
    ncvet_details: {
      nsqf_level: 9,
      qp_code: 'MEP/Q0101',
      ssc_council: 'Management & Professional Skills (MEPSC)',
      us_onet_code: '11-1011.00'
    },
    sadhana_protocol: {
      pranayama: 'Anuloma Viloma (15 mins) + Heart-centered meditation (Hridayakasha)',
      ahara: 'Simple ascetic satvik meals: boiled grains, root vegetables, pure milk, water',
      dinacharya: 'Early dawn review of administrative obligations with complete ego-detachment'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Fiduciary Management, Trust Administration, Public Service',
    color: '#2563EB',
    icon: '👡'
  },
  {
    id: 'vishvakarma',
    name: 'Vishvakarma',
    sanskrit_title: 'Kala-Yogi',
    english_moniker: 'The Sacred Architect & Precision Tooling Master',
    tier: 'sattvik',
    epic: 'Mahabharata',
    eccp_code: 'SS-BM-S-D',
    guna_base: 'Sattva-Pure (Divine Craftsmanship, Mathematical Harmony)',
    antahkarana: 'Buddhi-Manas (Aesthetic Vision coupled with Precision Execution)',
    competency: 'Shudra-Brahmana (Mastery of Tools, Materials, Geometry)',
    purpose: 'Dharma & Kama (Realizing Divine Forms in Physical Matter)',
    epic_citation: 'Vishnu Purana & Mahabharata Adi Parva',
    devanagari: 'विश्वकर्मा नमस्तेऽस्तु विश्वात्मन् विश्वसम्भव ।\nशिल्पशास्त्रप्रवक्ता त्वं सर्वयन्त्रप्रवर्तकः ॥',
    quote: 'viśvakarmā namaste \'stu... (Salutations to Vishvakarma, the master of engineering and craft, the revealer of technology, creator of all devices).',
    psychological_summary: 'Treats manual execution, architecture, and engineering as high spiritual yoga. Believes that God is in the tolerances of the machine. Disdains sloppy work and superficial ornamentation; values structural perfection.',
    shadow_warning: 'Impatience with non-technical bureaucratic managers who do not understand how physical materials and systems operate.',
    aligned_ncvet_careers: [
      'Master Precision Nanofabrication Lead (NSQF Level 8-9)',
      'Principal Site Reliability Engineer (SRE) & Systems Architect',
      'Chief Product Industrial Designer (Hardware)',
      'Lead Robotics & Automation Fabricator',
      'Heritage Structural Architecture Director'
    ],
    ncvet_details: {
      nsqf_level: 8,
      qp_code: 'CAP/Q9102',
      ssc_council: 'Capital Goods Sector Skill Council (CGSC)',
      us_onet_code: '17-2199.11'
    },
    sadhana_protocol: {
      pranayama: 'Trataka (gazing focus) + Sheetakari breath to maintain cool hand-eye precision',
      ahara: 'Mineral-rich grounding diet: sesame, walnuts, ghee, seasonal root vegetables',
      dinacharya: 'Clean workspace consecration before touching tools; unbroken 3-hour fabrication sprints'
    },
    compendium_chapter: 'Chapter 16: The Master 144 Archetypal Lexicon',
    sector: 'Precision Engineering, Advanced Robotics, Industrial Design',
    color: '#0D9488',
    icon: '⚙️'
  },

  // ══════════════════════════════════════════════════════════════════
  // TIER 2: RAJASIK KINETIC DRIVERS (Scale, Ambition, Strategy & Speed)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'arjuna',
    name: 'Arjuna',
    sanskrit_title: 'Dhananjaya',
    english_moniker: 'The Strategic Commander & Deep Work Craftsman',
    tier: 'rajasik',
    epic: 'Mahabharata',
    eccp_code: 'SR-BM-K-D',
    guna_base: 'Sattva-Rajas (High Spiritual Clarity Propelled by Kinetic Drive)',
    antahkarana: 'Buddhi-Led (Objective Reasoning, Moral Reflection, Focus)',
    competency: 'Kshatriya (Strategic Execution, Crisis Leadership, Bow Mastery)',
    purpose: 'Dharma (Righteous Order, Structural Integrity, Institutional Justice)',
    epic_citation: 'Bhagavad Gita 11.33 (Nimitta-matram bhava savya-sacin)',
    devanagari: 'तस्मात्त्वमुत्तिष्ठ यशो लभस्व जित्वा शत्रून् भुङ्क्ष्व राज्यं समृद्धम् ।\nमयैवैते निहताः पूर्वमेव निमित्तमात्रं भव सव्यसाचिन् ॥',
    quote: 'tasmāt tvam uttiṣṭha yaśo labhasva... nimitta-mātraṁ bhava savya-sācin (Therefore arise, attain glory, conquer your foes, and enjoy a prosperous realm. They have already been slain by Me; become merely an instrument, O ambidextrous archer!).',
    psychological_summary: 'World-class mastery through single-pointed concentration (Abhyasa). Masters archery in the dark. Deeply reflective and conscientious, but vulnerable to existential despondency (Vishada) when personal affections clash with duty.',
    shadow_warning: 'Paralyzing existential despondency and over-thinking when high-stakes decisions inflict pain on former mentors or peers.',
    aligned_ncvet_careers: [
      'Chief Technology Officer (CTO) & Systems Lead (NSQF Level 9)',
      'Strategic Operations Commander (Defense & Aerospace)',
      'Managing Director of Enterprise Restructuring & Turnarounds',
      'Advanced Weaponry & Missile Guidance Lead Engineer',
      'High-Stakes Crisis Incident Director'
    ],
    ncvet_details: {
      nsqf_level: 9,
      qp_code: 'AAS/Q1101',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      us_onet_code: '11-1011.00'
    },
    sadhana_protocol: {
      pranayama: 'Nadi Shodhana (15 mins) + Ujjayi to anchor focus and dissolve despondency',
      ahara: 'High-energy Sattvik fare: almonds, dates, unpolished rice, fresh green vegetables',
      dinacharya: 'One-pointed practice (Ekagrata) at dawn; nightly reflection on Nishkama Karma'
    },
    compendium_chapter: 'Chapter 15: The Mahabharata Archetypal Spectrum',
    sector: 'Management, Defense, Aerospace & High-Stakes Operations',
    color: '#2563EB',
    icon: '🏹'
  },
  {
    id: 'chanakya',
    name: 'Chanakya (Kautilya)',
    sanskrit_title: 'Kautilya-Niti',
    english_moniker: 'The Strategic Realist & Civilizational Architect',
    tier: 'rajasik',
    epic: 'Mahabharata',
    eccp_code: 'SR-BM-B-D',
    guna_base: 'Sattva-Rajas (Razor-Sharp Intellect Bound to Sovereign Strategy)',
    antahkarana: 'Buddhi-Led (Ruthless Strategic Pragmatism, Realpolitik)',
    competency: 'Brahmana (Statecraft, Macroeconomics, Geopolitics, Law)',
    purpose: 'Dharma & Artha (Civilizational Security, Sovereign Wealth)',
    epic_citation: 'Chanakya Sutras & Kautilya Arthashastra 1.1',
    devanagari: 'सुखस्य मूलं धर्मः । धर्मस्य मूलमर्थः । अर्थस्य मूलं राज्यम् ॥',
    quote: 'sukhasya mūlaṁ dharmaḥ | dharmasya mūlam arthaḥ | arthasya mūlaṁ rājyam (The root of happiness is Dharma; the root of Dharma is Artha [economic capability]; the root of Artha is a sovereign state).',
    psychological_summary: 'Master of strategic statecraft. Understands that ethics without material leverage is toothless, and power without ethics is monstrous. Completely uncorrupted by personal luxury; lives in a mud hut while directing an empire.',
    shadow_warning: 'Risk of extreme utilitarian cynicism; deploying covert methods that may erode internal team trust if over-applied.',
    aligned_ncvet_careers: [
      'National Security Advisor & Strategic Intelligence Director (NSQF Level 10)',
      'Macroeconomic Policy & Sovereign Asset Architect',
      'Chief Corporate Strategy Officer (Fortune 100)',
      'Geopolitical Risk & Intelligence Advisory Lead',
      'Enterprise Anti-Monopoly & Regulatory Strategist'
    ],
    ncvet_details: {
      nsqf_level: 10,
      qp_code: 'MEP/Q0214',
      ssc_council: 'Management & Professional Skills (MEPSC)',
      us_onet_code: '11-9199.02'
    },
    sadhana_protocol: {
      pranayama: 'Kapalabhati (clearing cognitive fog) followed by silent dhyana on universal order',
      ahara: 'Strict ascetic diet: bitter greens, triphala, fresh curd, warm water; zero intoxicants',
      dinacharya: 'Midnight strategic review of systemic vulnerabilities; early dawn shastric study'
    },
    compendium_chapter: 'Chapter 15: The Mahabharata Archetypal Spectrum',
    sector: 'Geopolitics, Macroeconomics, Sovereign Strategy',
    color: '#B45309',
    icon: '♟️'
  },
  {
    id: 'sugriva',
    name: 'Sugriva',
    sanskrit_title: 'Mitra-Sangrahi',
    english_moniker: 'The Alliance Architect & Scale Multiplier',
    tier: 'rajasik',
    epic: 'Ramayana',
    eccp_code: 'RR-MM-V-A',
    guna_base: 'Rajasik-Sattvik (Pragmatic, Coalition-Conscious, Scale-Driven)',
    antahkarana: 'Manas-Led (Relational Intelligence, Multi-Party Bargaining)',
    competency: 'Vaishya (Resource Mobilization, Distributed Logistics, Networks)',
    purpose: 'Artha & Kama (Ecosystem Expansion, Mutual Security, Power Alliances)',
    epic_citation: 'Valmiki Ramayana Kishkindha Kanda 40.1',
    devanagari: 'मित्रकृत्ये हि यः शक्तो न स मुह्येत् कदाचन ।\nसैन्यं च सर्वतो दिक्षु प्रेषयिष्यामि सत्वरम् ॥',
    quote: 'mitra-kṛtye hi yaḥ śakto... (He who is true to alliances never falters; I shall dispatch forces across all directions of the Earth immediately).',
    psychological_summary: 'Master of networks and resource mobilization. Knows how to bring diverse factions together, manage vast distributed supply chains, and broker mutually enriching pacts.',
    shadow_warning: 'Vulnerability to sensual complacency and procrastination once security is achieved (needing a stern wake-up call to fulfill neglected commitments).',
    aligned_ncvet_careers: [
      'Venture Capital General Partner & Ecosystem Builder (NSQF Level 9)',
      'Multi-Sided Platform Founder & CEO',
      'Global Supply Chain & Logistics Managing Director',
      'Cross-Border Trade Association President',
      'Commercial Strategic Partnerships Director'
    ],
    ncvet_details: {
      nsqf_level: 9,
      qp_code: 'LOG/Q7108',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      us_onet_code: '11-2022.00'
    },
    sadhana_protocol: {
      pranayama: 'Bhastrika to clear sluggishness + Nadi Shodhana to restore sharp executive focus',
      ahara: 'Energy-dense fruits, cooling coconut water, herbal teas, seasonal leafy vegetables',
      dinacharya: 'Rigorous morning accountability audit; strict boundary against afternoon sensory indulgence'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Commerce, Supply Chain Logistics, Venture Capital',
    color: '#059669',
    icon: '🤝'
  },
  {
    id: 'draupadi',
    name: 'Draupadi',
    sanskrit_title: 'Agni-Suta',
    english_moniker: 'The Dynamic Moral Conscience & Reform Catalyst',
    tier: 'rajasik',
    epic: 'Mahabharata',
    eccp_code: 'SR-AM-K-D',
    guna_base: 'Sattva-Rajas (Fierce Conscience, Intolerance for Injustice)',
    antahkarana: 'Ahankara-Buddhi (High Sovereign Identity Grounded in Legal Truth)',
    competency: 'Kshatriya (Transformational Upheaval, Legal Cross-Examination)',
    purpose: 'Dharma (Reckoning with Corrupt Power, Systemic Accountability)',
    epic_citation: 'Mahabharata Sabha Parva (The Great Assembly Debate)',
    devanagari: 'किं नु पूर्वं पराजैषीरात्मानमथवा नु माम् ।\nइति पृच्छामि वः सर्वे कुरवः सदसि स्थिताः ॥',
    quote: 'kiṁ nu pūrvaṁ parājaiṣīr ātmānam athavā nu mām... (Did you gamble yourself away first, or did you gamble me? Answer me, elders of the Kuru assembly!).',
    psychological_summary: 'Fierce intellectual dignity and legal mastery. Refuses to accept procedural corruption or polite institutional complicity. Challenges corrupt elders directly in public debate; the ultimate catalyst for systemic cleansing.',
    shadow_warning: 'Vulnerability to consuming rage and relentless desire for retribution when institutional channels fail to deliver justice.',
    aligned_ncvet_careers: [
      'High-Stakes Constitutional Trial Litigator (NSQF Level 9)',
      'Investigative Journalist & Public Anti-Corruption Lead',
      'Labor Rights Reformer & Systemic Advocate',
      'Institutional Ethics Whistleblower Director',
      'Corporate Ombudsman & Workplace Safety Commissioner'
    ],
    ncvet_details: {
      nsqf_level: 9,
      qp_code: 'MEP/Q0214',
      ssc_council: 'Management & Professional Skills (MEPSC)',
      us_onet_code: '23-1011.00'
    },
    sadhana_protocol: {
      pranayama: 'Sheetali & Sheetakari (cooling breath) to temper internal fire (Pitta)',
      ahara: 'Cooling cucumber, melon, mint, coriander, coconut oil, sweet fruits',
      dinacharya: 'Evening reflection in silence; channeling righteous indignation into structured legal action'
    },
    compendium_chapter: 'Chapter 15: The Mahabharata Archetypal Spectrum',
    sector: 'Constitutional Law, Investigative Journalism, Systemic Reform',
    color: '#9333EA',
    icon: '🔥'
  },
  {
    id: 'karna',
    name: 'Karna',
    sanskrit_title: 'Danavira',
    english_moniker: 'The Fierce Achiever & Boundless Altruist',
    tier: 'rajasik',
    epic: 'Mahabharata',
    eccp_code: 'RR-AM-K-A',
    guna_base: 'Rajasik-Ahankara (Fierce Individuality, High Merit, Generosity)',
    antahkarana: 'Ahankara-Led (Agency-Driven, Merit-Obsessed, Loyalty-Bound)',
    competency: 'Kshatriya-Shudra (Supreme Technical Prowess & Battle Agency)',
    purpose: 'Artha & Dana (Radical Generosity, Meritocratic Sovereignty)',
    epic_citation: 'Mahabharata Udyoga Parva 141.2',
    devanagari: 'दैवायत्तं कुले जन्म मदायत्तं तु पौरुषम् ।\nदानेन च यशो लोके स्थापयिष्यामि शाश्वतम् ॥',
    quote: 'daivāyattaṁ kule janma mad-āyattaṁ tu pauruṣam... (Lineage of birth was determined by fate; but my prowess, valor, and honor belong solely to me).',
    psychological_summary: 'Self-made technical genius who values direct operational mastery above all lineage or status. Fiercely generous (Dana-Veera), unwavering in loyalty to allies who honor their craft.',
    shadow_warning: 'Deep resentment (Dvesha) and blind loyalty to corrupt patrons who gave early recognition; tragic moral complicity.',
    aligned_ncvet_careers: [
      'Founding Venture Partner & Scale Engineer (NSQF Level 8)',
      'Lead Aerospace & Advanced Defense Fabricator',
      'Aggressive Corporate Turnaround Lead',
      'High-Performance Industrial Prototyper',
      'Advanced Robotics & Mechatronics Director'
    ],
    ncvet_details: {
      nsqf_level: 8,
      qp_code: 'CAP/Q9102',
      ssc_council: 'Capital Goods Sector Skill Council (CGSC)',
      us_onet_code: '11-1021.00'
    },
    sadhana_protocol: {
      pranayama: 'Nadi Shodhana with emphasis on long exhalations to discharge bitterness',
      ahara: 'Cooling, unstimulating diet; avoiding excess chili and vinegar to balance fiery Pitta',
      dinacharya: 'Morning solar meditation (Surya Arghya) dedicating gifts directly to the divine, not human patrons'
    },
    compendium_chapter: 'Chapter 15: The Mahabharata Archetypal Spectrum',
    sector: 'Capital Goods, Precision Engineering, Venture Scaling',
    color: '#EA580C',
    icon: '☀️'
  },
  {
    id: 'lakshmana',
    name: 'Lakshmana',
    sanskrit_title: 'Soumitra',
    english_moniker: 'The Vigilant Sentinel & Tactical Enforcer',
    tier: 'rajasik',
    epic: 'Ramayana',
    eccp_code: 'RR-AM-K-D',
    guna_base: 'Rajasik (High-Intensity, Hyper-Vigilant, Zero Compromise)',
    antahkarana: 'Ahankara-Led (Protective Will, Instant Reflex, Boundless Loyalty)',
    competency: 'Kshatriya (Tactical Ground Defense, Threat Neutralization)',
    purpose: 'Dharma & Sneha (Unwavering Loyalty, Vigilant Defense)',
    epic_citation: 'Valmiki Ramayana Aranya Kanda 15.7',
    devanagari: 'अहोरात्रं न जानामि न जानामि सुखं क्वचित् ।\nधनुर्हस्तः प्रपन्नोऽहं रक्षणाय रघूत्तमम् ॥',
    quote: 'ahorātraṁ na jānāmi... (Day or night, I know of no personal pleasure; bow in hand, I stand vigil solely to protect the sovereign mission).',
    psychological_summary: 'Hyper-vigilant operational guard. Thrives on the tactical front line, detects threats before they materialize, and takes immediate, uncompromising protective action.',
    shadow_warning: 'Hair-trigger anger and explosive defensiveness; quick to assume malice in others; requires a calm Sattvik leader to prevent overreach.',
    aligned_ncvet_careers: [
      'Chief Information Security Officer (CISO) (NSQF Level 9)',
      'Critical Infrastructure Perimeter Defense Director',
      'High-Risk Field Operations Commander',
      'Financial Fraud & Sanctions Investigation Director',
      'Lead Site Reliability Incident Commander'
    ],
    ncvet_details: {
      nsqf_level: 9,
      qp_code: 'TEL/Q6211',
      ssc_council: 'Telecom & Security SSC (TSCI)',
      us_onet_code: '33-1012.00'
    },
    sadhana_protocol: {
      pranayama: 'Shitali Pranayama (10 mins) to calm reactive nervous system spikes',
      ahara: 'Sweet fruits, coconut milk, mild cooling dishes; complete avoidance of caffeine',
      dinacharya: 'Scheduled midday relaxation to release muscular tension in neck and shoulders'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Cybersecurity, Site Reliability, Tactical Defense',
    color: '#DC2626',
    icon: '🗡️'
  },

  // ══════════════════════════════════════════════════════════════════
  // TIER 3: TAMASIK & SHADOW MIRRORS (Conservators & Tragic Warnings)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ravana',
    name: 'Ravana (The Tragic Titan)',
    sanskrit_title: 'Dashanana',
    english_moniker: 'The Hubristic Oligarch & Corrupted Intellect',
    tier: 'tamasik',
    epic: 'Ramayana',
    eccp_code: 'RT-AM-B-A',
    guna_base: 'Rajasik-Tamasik (Vast Power & Intellect Subverted by Narcissism)',
    antahkarana: 'Ahankara-Led (Unbounded Ego, Entitlement, Grandiosity)',
    competency: 'Brahmana-Asura (Cosmic Mastery of Arts, Architecture, Weapons)',
    purpose: 'Artha & Kama (Imperial Domination, Sensory Monopolization)',
    epic_citation: 'Valmiki Ramayana Yuddha Kanda (The Fall of Lanka)',
    devanagari: 'न नमेयं कथञ्चिद् वै न हि मे विद्यते भयम् ।\nऐश्वर्यं मम साम्राज्यं सर्वं बाहुबले स्थितम् ॥',
    quote: 'na nameyaṁ kathañcid... (I shall never bow to any authority; my golden empire rests entirely on the unbending strength of my own arms).',
    psychological_summary: 'Master of the Vedas, inventor of the Rudra Veena, architect of the golden capital of Lanka. Possessed genius in music, weapons, and economics, yet completely ruined by unchecked narcissistic pride and predatory entitlement.',
    shadow_warning: 'THE ULTIMATE SHADOW WARNING: Intellect, technical brilliance, and wealth without Dharma inevitably lead to total institutional destruction.',
    aligned_ncvet_careers: [
      'Cautionary Archetype: The Hubristic Corporate Raider',
      'Predatory Tech Monopolist (Warning Pattern)',
      'Imperial Empire Builder (High Risk of Bankruptcy & Ruin)'
    ],
    ncvet_details: {
      nsqf_level: 10,
      qp_code: 'SHADOW/Q001',
      ssc_council: 'Cautionary Diagnostic Shadow',
      us_onet_code: '11-1011.00'
    },
    sadhana_protocol: {
      pranayama: 'Vigorous Kapalabhati followed by ego-dissolving Savasana and prostrations',
      ahara: 'Immediate cessation of rich, stimulating, heavy foods; fasting on water and fruits',
      dinacharya: 'Voluntary anonymous service (Seva) to strip away the delusions of Ahankara'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Cautionary Shadow Profile, Enterprise Risk Analysis',
    color: '#991B1B',
    icon: '👹'
  },
  {
    id: 'duryodhana',
    name: 'Duryodhana (The Entitled Monopolist)',
    sanskrit_title: 'Suyodhana',
    english_moniker: 'The Zero-Sum Competitor & Insecure Autocrat',
    tier: 'tamasik',
    epic: 'Mahabharata',
    eccp_code: 'TT-AM-K-A',
    guna_base: 'Tamasik-Rajasik (Jealousy, Territorial Entitlement, Paranoia)',
    antahkarana: 'Ahankara-Led (Zero-Sum Insecurity, Inability to Share Power)',
    competency: 'Kshatriya (Mace Mastery, Ruthless Political Maneuvering)',
    purpose: 'Artha (Absolute Monopolization, Total Control)',
    epic_citation: 'Mahabharata Udyoga Parva (Refusal to Grant Five Villages)',
    devanagari: 'सूच्यग्रं नैव दास्यामि विना युद्धेन केशव ।\nयावद् भूमिं न गृह्णीयाद् राज्यं तावन्न मे ध्रुवम् ॥',
    quote: 'sūcy-agraṁ naiva dāsyāmi... (I will not part with even as much land as can be covered by the point of a needle without total war).',
    psychological_summary: 'Incapable of experiencing joy in his own vast wealth while competitors possess anything. Views market life as zero-sum; manipulates legal loopholes (the Game of Dice) to destroy competitors rather than building authentic value.',
    shadow_warning: 'Envy (Matsarya); destroying one’s own company and family rather than conceding a fair share to partners.',
    aligned_ncvet_careers: [
      'Cautionary Archetype: Hostile Corporate Takeover Raider',
      'Antitrust Monopolist (High Vulnerability to Litigation)',
      'Paranoid Board Dictator'
    ],
    ncvet_details: {
      nsqf_level: 9,
      qp_code: 'SHADOW/Q002',
      ssc_council: 'Cautionary Diagnostic Shadow',
      us_onet_code: '11-1021.00'
    },
    sadhana_protocol: {
      pranayama: 'Heart-opening Bhramari and Chandra Bhedana to dissolve toxic jealousy',
      ahara: 'Cooling bitter greens, raw cucumber, herbal teas, zero stimulants or red meat',
      dinacharya: 'Practicing Mudita (rejoicing in the success of others) as daily mental medicine'
    },
    compendium_chapter: 'Chapter 15: The Mahabharata Archetypal Spectrum',
    sector: 'Cautionary Shadow Profile, Corporate Antitrust Risk',
    color: '#7F1D1D',
    icon: '🪓'
  },
  {
    id: 'kumbhakarna',
    name: 'Kumbhakarna (The Slumbering Giant)',
    sanskrit_title: 'Nidra-Yoddha',
    english_moniker: 'The Dormant Colossus & Reluctant Loyalist',
    tier: 'tamasik',
    epic: 'Ramayana',
    eccp_code: 'TT-MM-S-K',
    guna_base: 'Tamasik-Pure (Colossal Latent Energy Shrouded in Sloth)',
    antahkarana: 'Manas-Led (Somatic Desires, Long Rest, Reluctant Action)',
    competency: 'Shudra-Kshatriya (Unstoppable Physical Force when Awakened)',
    purpose: 'Kama & Nidra (Rest, Bodily Comfort, Reluctant Loyalty)',
    epic_citation: 'Valmiki Ramayana Yuddha Kanda (The Awakening)',
    devanagari: 'जानामि रामं धर्मिष्ठं जानामि च पराक्रमम् ।\nकिन्तु भ्रातृकृते युद्धं करिष्यामि रणाजिरे ॥',
    quote: 'jānāmi rāmaṁ dharmiṣṭhaṁ... (I know Rama is righteous and invincible; yet out of fraternal duty to my brother Ravana, I shall march onto the battlefield).',
    psychological_summary: 'Possesses immense latent technical or physical power, but spends long cycles in hibernation, apathy, or procrastination. Clearly sees that his leadership is corrupt, yet fights for them anyway out of weary resignation.',
    shadow_warning: 'Chronic procrastination, cognitive apathy, and fighting for a doomed cause because it is easier than breaking free.',
    aligned_ncvet_careers: [
      'Heavy Industrial Emergency Reserve Lead',
      'Critical Systems Standby Maintenance Director',
      'Overnight Disaster Recovery Engineer'
    ],
    ncvet_details: {
      nsqf_level: 7,
      qp_code: 'CAP/Q1102',
      ssc_council: 'Capital Goods Sector Skill Council (CGSC)',
      us_onet_code: '51-4041.00'
    },
    sadhana_protocol: {
      pranayama: 'Surya Bhedana & Kapalabhati at dawn to shake off physiological Tamas',
      ahara: 'Light, un-fried foods, bitter greens, ginger tea; eliminating heavy carbs and late meals',
      dinacharya: 'Strict morning waking routine before 06:00 AM with zero afternoon naps'
    },
    compendium_chapter: 'Chapter 14: The Ramayana Archetypal Spectrum',
    sector: 'Heavy Industry, Emergency Reserves, Standby Operations',
    color: '#475569',
    icon: '💤'
  },
  {
    id: 'sthira_karmi',
    name: 'Sthira-Karmi (The Grounded Custodian)',
    sanskrit_title: 'Sthira-Karmi',
    english_moniker: 'The Unsung Preserver & Quality Anchor',
    tier: 'tamasik',
    epic: 'Mahabharata',
    eccp_code: 'TT-BM-S-D',
    guna_base: 'Healthy Tamas (High Stability, Routine Mastery, Invariance)',
    antahkarana: 'Buddhi-Led (Meticulous Rule Adherence, Safety Vigilance)',
    competency: 'Shudra (Operational Precision, Procedural Perfection)',
    purpose: 'Dharma (Safety Preservation, Zero-Defect Maintenance)',
    epic_citation: 'Traditional Shastric Operational Lore',
    devanagari: 'नित्यं कुरु सदा कर्म यदुक्तं शास्त्रसम्मतम् ।\nअचलो भव राजेन्द्र पर्वतो वा यथा स्थिरः ॥',
    quote: 'nityaṁ kuru sadā karma... (Steadfastly perform prescribed action with unswerving stability, standing firm like an immovable mountain).',
    psychological_summary: 'The healthy embodiment of Tamas: absolute stability, emotional unshakeability, and deep love for routine. While others chase volatile startup trends, this custodian guards nuclear safety, archival data, and water purification.',
    shadow_warning: 'Resistance to necessary evolutionary upgrades; feeling invisible while flashy, unprincipled marketers receive praise.',
    aligned_ncvet_careers: [
      'Nuclear & Power Grid Safety Operations Lead (NSQF Level 7)',
      'Quality Assurance & Zero-Defect Audit Director',
      'High-Security Vault & Data Custodian',
      'National Archive Preservation Specialist',
      'Pharmaceutical Formulation Compliance Officer'
    ],
    ncvet_details: {
      nsqf_level: 7,
      qp_code: 'CGSC/Q4101',
      ssc_council: 'Capital Goods & Infrastructure SSC',
      us_onet_code: '51-8011.00'
    },
    sadhana_protocol: {
      pranayama: 'Alternate nostril breathing (10 mins) + gentle spinal movement to maintain flexibility',
      ahara: 'Light, easily digestible warm soups, lightly steamed greens, turmeric milk',
      dinacharya: 'Incorporate 20 minutes of novel learning daily to prevent cognitive calcification'
    },
    compendium_chapter: 'Chapter 16: The Master 144 Archetypal Lexicon',
    sector: 'Infrastructure Safety, Quality Assurance, Regulatory Custodianship',
    color: '#334155',
    icon: '⚓'
  }
];

// ══════════════════════════════════════════════════════════════════
// STANDARDIZED PSYCHOMETRIC BATTERY (Loaded from questionBank.js)
// ══════════════════════════════════════════════════════════════════
const PRAKRITI_QUESTIONS = RAPID_QUESTIONS;

// Helper: Calculate ECCP Vector from Answer Key using 14-Simplex Normalization & Euclidean Centroids
function evaluateECCP(answers, vikritiAnswers = {}, tier = 'vocational') {
  const scores = {
    guna: { S: 0, R: 0, T: 0 },
    cognition: { B: 0, M: 0, A: 0 },
    competency: { B: 0, K: 0, V: 0, S: 0 },
    purpose: { D: 0, A: 0, K: 0, M: 0 }
  };

  const activeQuestions = tier === 'rapid' ? RAPID_QUESTIONS : VOCATIONAL_QUESTIONS_27;

  // Process answers with weighted mappings
  activeQuestions.forEach(q => {
    const userVal = answers[q.id];
    if (!userVal) return;

    const opt = q.options.find(o => o.id === userVal || o.code === userVal);
    if (opt && opt.weights) {
      if (opt.weights.guna) {
        for (const [k, v] of Object.entries(opt.weights.guna)) {
          scores.guna[k] = (scores.guna[k] || 0) + v;
        }
      }
      if (opt.weights.cognition) {
        for (const [k, v] of Object.entries(opt.weights.cognition)) {
          scores.cognition[k] = (scores.cognition[k] || 0) + v;
        }
      }
      if (opt.weights.competency) {
        for (const [k, v] of Object.entries(opt.weights.competency)) {
          scores.competency[k] = (scores.competency[k] || 0) + v;
        }
      }
      if (opt.weights.purpose) {
        for (const [k, v] of Object.entries(opt.weights.purpose)) {
          scores.purpose[k] = (scores.purpose[k] || 0) + v;
        }
      }
    } else {
      // Fallback for direct single-letter answer codes
      if (['S', 'R', 'T'].includes(userVal)) scores.guna[userVal] = (scores.guna[userVal] || 0) + 2;
      else if (['BM', 'MM', 'AM'].includes(userVal)) scores.cognition[userVal[0]] = (scores.cognition[userVal[0]] || 0) + 2;
      else if (['B', 'K', 'V', 'S'].includes(userVal)) scores.competency[userVal] = (scores.competency[userVal] || 0) + 2;
      else if (['D', 'A', 'M'].includes(userVal)) scores.purpose[userVal] = (scores.purpose[userVal] || 0) + 2;
    }
  });

  // Calculate 14-dimensional normalized simplex vector
  const { vector14, normalized } = normalizeSubvectors(scores);

  // Euclidean distance matching across all 144 Archetype Centroids
  const { bestMatch, secondMatch, minDistance, confidenceIndex, allDistances } = matchCentroids(vector14);

  // Find nearest curated Epic Archetype (from the 24 living mirrors)
  let bestCurated = EPIC_ARCHETYPES[0];
  let maxCuratedScore = -1;
  const topGuna = Object.keys(scores.guna).reduce((a, b) => scores.guna[a] >= scores.guna[b] ? a : b);
  const topCognition = Object.keys(scores.cognition).reduce((a, b) => scores.cognition[a] >= scores.cognition[b] ? a : b);
  const topCompetency = Object.keys(scores.competency).reduce((a, b) => scores.competency[a] >= scores.competency[b] ? a : b);
  const topPurpose = Object.keys(scores.purpose).reduce((a, b) => scores.purpose[a] >= scores.purpose[b] ? a : b);

  EPIC_ARCHETYPES.forEach(arch => {
    let matchScore = 0;
    const parts = arch.eccp_code.split('-');
    if (parts[0] && parts[0].includes(topGuna)) matchScore += 2;
    if (parts[1] && parts[1].includes(topCognition)) matchScore += 2;
    if (parts[2] && parts[2].includes(topCompetency)) matchScore += 3;
    if (parts[3] && parts[3].includes(topPurpose)) matchScore += 3;

    if (matchScore > maxCuratedScore) {
      maxCuratedScore = matchScore;
      bestCurated = arch;
    }
  });

  // Dynamic Synthesis Profile
  const dynamicSynthesis = synthesizeDynamicProfile(bestMatch, normalized, confidenceIndex);

  // Calculate Vikriti Burnout Score if provided
  let vikritiScore = 0;
  const vikritiMax = 24;
  let vikritiLevel = 'Optimal Equilibrium (Sattvik State)';
  let vikritiAlert = 'Your daily metabolic and emotional load is well-integrated with your innate constitution.';

  if (Object.keys(vikritiAnswers).length > 0) {
    Object.values(vikritiAnswers).forEach(val => {
      if (val === 'V_MED') vikritiScore += 2;
      else if (val === 'V_HIGH') vikritiScore += 4;
    });

    const vPct = Math.round((vikritiScore / vikritiMax) * 100);
    if (vPct >= 60) {
      vikritiLevel = 'Severe Burnout & Paradharma Fatigue';
      vikritiAlert = `You are operating under an estimated ${vPct}% Tamasik-Rajasik stress mask. Your daily role contradicts your natural Swabhava. Urgent career realignment recommended.`;
    } else if (vPct >= 30) {
      vikritiLevel = 'Moderate Cognitive Agitation';
      vikritiAlert = `You have an estimated ${vPct}% Rajasik agitation leakage. Your mind is hyper-reactive; apply Sattvik Ahara and Pranayama protocols to prevent deeper fatigue.`;
    } else {
      vikritiLevel = 'Equilibrium Baseline';
      vikritiAlert = `Your current state mirrors your innate Prakriti closely (${vPct}% stress delta). Your vitality is preserved.`;
    }
  }

  return {
    eccp_code: bestMatch.eccp_code,
    confidence_index: confidenceIndex,
    euclidean_distance: minDistance,
    scores,
    normalized,
    vector14,
    dominant: {
      energy: bestMatch.energy_mode,
      cognition: bestMatch.cognition_locus,
      competency: bestMatch.competency_domain,
      purpose: bestMatch.purpose_vector
    },
    matched_archetype: bestCurated,
    master_144_archetype: {
      ...bestMatch,
      compound_title: bestMatch.english_title
    },
    secondary_archetype: secondMatch,
    top_candidate_archetypes: allDistances,
    dynamic_synthesis: dynamicSynthesis,
    vikriti_audit: {
      score: vikritiScore,
      max_score: vikritiMax,
      percentage: Math.round((vikritiScore / vikritiMax) * 100),
      level: vikritiLevel,
      alert: vikritiAlert
    }
  };
}

// ── GET /api/personalities/archetypes ──
router.get('/archetypes', (req, res) => {
  const { epic, tier, mode, competency, purpose } = req.query;

  if (mode === '144') {
    const data = loadMatrix();
    let list = data.list;

    if (tier && tier !== 'all') {
      list = list.filter(a => a.energy_mode.toLowerCase().includes(tier.toLowerCase()));
    }
    if (competency && competency !== 'all') {
      list = list.filter(a => a.competency_domain.toLowerCase() === competency.toLowerCase());
    }
    if (purpose && purpose !== 'all') {
      list = list.filter(a => a.purpose_vector.toLowerCase() === purpose.toLowerCase());
    }

    return res.json({
      success: true,
      mode: '144_matrix',
      total: list.length,
      archetypes: list
    });
  }

  // Default: Return 24 curated epic archetypes
  let filtered = EPIC_ARCHETYPES;
  if (epic && epic !== 'all') {
    filtered = filtered.filter(a => a.epic.toLowerCase() === epic.toLowerCase());
  }
  if (tier && tier !== 'all') {
    filtered = filtered.filter(a => a.tier.toLowerCase() === tier.toLowerCase());
  }

  const enriched = filtered.map(a => ({
    ...a,
    generic_title: a.english_moniker,
    leadership_axiom: LEADERSHIP_AXIOMS[a.id] || "Lead with systemic clarity, principled execution, and dedication to institutional excellence.",
    compendium_file: getArchetypeCompendiumFile(a)
  }));

  res.json({ success: true, mode: 'curated_24', count: enriched.length, archetypes: enriched });
});

// Executive Leadership Axioms for Corporate / Generic Mode
const LEADERSHIP_AXIOMS = {
  rama: "Institutional leadership requires unwavering adherence to truth and constitutional order above personal convenience.",
  vidura: "A single flawed policy compromise can dismantle an entire enterprise; maintain uncompromising systemic integrity.",
  hanuman: "Mastery of physical execution combined with humble service produces unmatched compound organizational velocity.",
  janaka: "True executive sovereignty lies in detached systemic oversight while operating in the midst of commercial scale.",
  yudhishthira: "Sustainable enterprise requires ethical invariants; sacrificing integrity for short-term gain guarantees long-term ruin.",
  bhishma: "Institutional continuity and governance stability are anchored by leaders who keep their fiduciary word at all costs.",
  arjuna: "Peak execution demands laser-focused concentration, deliberate training, and the emotional discipline to act without paralysis.",
  krishna: "Strategic agility and game-theoretic wisdom must guide leaders through complex, high-stakes competitive landscapes.",
  lakshmana: "Vigilant operational protection and proactive risk defense safeguard the core mission before threats materialize.",
  bharata: "Servant leadership means acting as a fiduciary custodian of the enterprise, never treating shared resources as private entitlement.",
  sugriva: "Strategic alliances, trust-building, and pragmatic resource-sharing turn fragmented teams into market-leading coalitions.",
  karna: "Unmatched technical talent and merit must be anchored in righteous corporate alignment, or loyalty will be tragic.",
  drona: "Rigorous pedagogy and unbending standards of discipline transform raw potential into world-class practitioners.",
  kripa: "Institutional memory and protocol consistency prevent the chaos of erratic change during crisis.",
  ashwatthama: "Brilliant technical capabilities without emotional regulation lead to reckless destruction under high-stress failure.",
  duryodhana: "Cautionary Profile: Zero-sum competitiveness and paranoia destroy enterprises from within; true growth is non-zero-sum.",
  shakuni: "Cautionary Profile: Manipulative corporate politicking and short-term games create toxic culture and regulatory doom.",
  ravana: "Cautionary Profile: Hyper-competence and material resources corrupted by hubristic entitlement lead to inevitable collapse.",
  kumbhakarna: "Cautionary Profile: Colossal latent technical strength wasted through chronic procrastination and passive compliance.",
  vibheeshana: "Courageous whistleblowing and principled defection protect societal truth when leadership loses its moral compass.",
  dhrishtadyumna: "Purpose-built execution focus: cutting through distractions to achieve the single decisive operational objective.",
  sahadeva: "Dispassionate predictive analytics and systems forecasting detect market inflection points years in advance.",
  nakula: "Meticulous stewardship, operational maintenance, and systems care keep complex infrastructure running smoothly.",
  sthira_karmi: "The bedrock of all industrial value: quiet, flawless craft, and relentless pride in operational execution."
};

function enrichQuestionsWithDualLabels(qList) {
  return qList.map(q => {
    const enrichedOptions = q.options.map(opt => {
      const genericLabel = (opt.label || '')
        .replace(/\s*\((Sattva|Rajas|Tamas|Brahmana|Kshatriya|Vaishya|Shudra|Buddhi|Buddhi-Led|Manas|Manas-Led|Ahankara|Ahankara-Led|Dharma|Artha|Kama|Moksha)\)/gi, '')
        .replace(/\s*\(Brahma Muhurta\)/gi, ' (Early Dawn)')
        .replace(/\s*\(Pitta Drive\)/gi, ' (High-Energy Drive)')
        .replace(/\s*\(Kapha\/Tamas Stability\)/gi, ' (Grounded Stability)')
        .trim();

      const genericDesc = opt.desc
        ? opt.desc
            .replace(/\bSattva\b/gi, 'clarity')
            .replace(/\bRajas\b/gi, 'kinetic drive')
            .replace(/\bTamas\b/gi, 'stability')
            .replace(/\bBrahmana\b/gi, 'systems architecture')
            .replace(/\bKshatriya\b/gi, 'executive command')
            .replace(/\bVaishya\b/gi, 'commercial scaling')
            .replace(/\bShudra\b/gi, 'operational craft')
            .replace(/\bDharma\b/gi, 'integrity & duty')
            .replace(/\bMoksha\b/gi, 'intellectual freedom')
        : '';

      return {
        ...opt,
        generic_label: genericLabel,
        generic_desc: genericDesc,
        vedic_label: opt.label,
        vedic_desc: opt.desc
      };
    });

    return {
      ...q,
      options: enrichedOptions
    };
  });
}

function enrichVikritiQuestions(vList) {
  return vList.map(v => {
    const enrichedOptions = v.options.map(opt => {
      let gLabel = opt.label;
      if (opt.label.includes('Sattva')) gLabel = 'Balanced & Restored';
      else if (opt.label.includes('Rajas')) gLabel = 'Agitated & Over-Stimulated';
      else if (opt.label.includes('Tamas')) gLabel = 'Exhausted & Drained';
      else if (opt.label.includes('Swadharma')) gLabel = 'Strong Role Fit & Alignment';
      else if (opt.label.includes('Mild Paradharma')) gLabel = 'Mild Role Misalignment';
      else if (opt.label.includes('Severe Paradharma')) gLabel = 'Severe Role Burnout';
      else if (opt.label.includes('Clean Agni')) gLabel = 'Optimal Physical Vitality';
      else if (opt.label.includes('Pitta/Vata')) gLabel = 'Stress-Induced Metabolic Friction';
      else if (opt.label.includes('Manda-Agni')) gLabel = 'Chronic Sluggishness & Depletion';

      return {
        ...opt,
        generic_label: gLabel,
        vedic_label: opt.label
      };
    });

    return {
      ...v,
      options: enrichedOptions
    };
  });
}

// ── GET /api/personalities/questions ──
router.get('/questions', (req, res) => {
  const tier = req.query.tier || 'vocational';
  const baseQuestions = tier === 'rapid' ? RAPID_QUESTIONS : VOCATIONAL_QUESTIONS_27;
  const questions = enrichQuestionsWithDualLabels(baseQuestions);
  const vikritiQuestions = enrichVikritiQuestions(VIKRITI_QUESTIONS);

  res.json({
    success: true,
    tier,
    count: questions.length,
    questions,
    vikriti_questions: vikritiQuestions,
    tier_info: {
      rapid: { name: 'Tier 1 Rapid Screening', count: RAPID_QUESTIONS.length, estimated_time: '3 minutes' },
      vocational: { name: 'Tier 2 Certified Vocational Battery', count: VOCATIONAL_QUESTIONS_27.length, estimated_time: '8 minutes' }
    }
  });
});

// ── POST /api/personalities/evaluate ──
router.post('/evaluate', async (req, res) => {
  const { answers, vikriti_answers, tier } = req.body;
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ success: false, error: 'Answers payload must be an object with question keys.' });
  }

  const determinedTier = tier || (Object.keys(answers).length > 12 ? 'vocational' : 'rapid');
  const result = evaluateECCP(answers, vikriti_answers, determinedTier);

  const sessionId = req.body.session_id || crypto.randomUUID();

  // Record psychometric telemetry in database
  try {
    await recordSessionTelemetry({
      sessionId,
      tier: determinedTier,
      eccpCode: result.eccp_code,
      confidenceIndex: result.confidence_index,
      rawScores: result.scores,
      normalizedVector: result.normalized,
      matchedArchetypeId: result.matched_archetype ? result.matched_archetype.id : result.master_144_archetype.id,
      vikritiScore: result.vikriti_audit.score,
      answers,
      questionBank: determinedTier === 'rapid' ? RAPID_QUESTIONS : VOCATIONAL_QUESTIONS_27
    });
  } catch (err) {
    console.warn('[ECCP Telemetry] Non-fatal error logging session:', err.message);
  }

  res.json({
    success: true,
    session_id: sessionId,
    tier: determinedTier,
    ...result
  });
});

// ── GET /api/personalities/psychometrics/stats ──
router.get('/psychometrics/stats', async (req, res) => {
  const report = await getPsychometricReport();
  res.json(report);
});

// ── GET /api/personalities/psychometrics/export ──
router.get('/psychometrics/export', async (req, res) => {
  const data = await exportFactorAnalysisCSV();
  if (!data.success) {
    return res.status(400).json(data);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="hpti_eccp_empirical_dataset.csv"');
  res.send(data.csv);
});

// ── POST /api/personalities/chat ──
router.post('/chat', async (req, res) => {
  const { query, archetype_id, eccp_code } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required.' });
  }

  // Lookup archetype from 24 curated or 144 master matrix
  let arch = EPIC_ARCHETYPES.find(a => a.id === archetype_id);
  if (!arch && eccp_code) {
    const mArch = getArchetypeByCode(eccp_code);
    if (mArch) {
      arch = {
        name: mArch.epic_anchor,
        sanskrit_title: mArch.sanskrit_title,
        english_moniker: mArch.english_title,
        epic: 'Itihasa (Ramayana / Mahabharata)',
        eccp_code: mArch.eccp_code,
        guna_base: mArch.energy_mode,
        antahkarana: mArch.cognition_locus,
        competency: mArch.competency_domain,
        purpose: mArch.purpose_vector,
        quote: mArch.psychological_summary,
        shadow_warning: mArch.shadow_warning,
        aligned_ncvet_careers: mArch.ncvet_alignment.aligned_careers,
        ncvet_details: {
          nsqf_level: mArch.ncvet_alignment.nsqf_level,
          qp_code: mArch.ncvet_alignment.qp_code,
          ssc_council: mArch.ncvet_alignment.primary_sector,
          us_onet_code: mArch.ncvet_alignment.us_onet_code
        },
        sadhana_protocol: mArch.sadhana_protocol,
        compendium_chapter: 'Chapter 16: The Master 144 Archetypal Lexicon'
      };
    }
  }

  if (!arch) arch = EPIC_ARCHETYPES[0];
  const qLower = query.toLowerCase();

  let answer = '';
  if (qLower.includes('why') || qLower.includes('match') || qLower.includes('who') || qLower.includes('meaning')) {
    answer = `Based on your ECCP code (${eccp_code || arch.eccp_code}), your psychological vector mirrors ${arch.name} (${arch.sanskrit_title || arch.english_moniker}). In classical literature, ${arch.name} embodies your core drive: "${arch.quote}". Your dominant energy is ${arch.guna_base} and your cognitive style operates via ${arch.antahkarana}. You do not merely seek routine employment; you are fueled by ${arch.purpose}, which makes your natural leverage flourish in high-responsibility environments without burning out.`;
  } else if (qLower.includes('career') || qLower.includes('job') || qLower.includes('ncvet') || qLower.includes('nsqf') || qLower.includes('role')) {
    answer = `Under India's certified NCVET and NSQF national framework, an archetype of ${arch.name} (${arch.competency}) is accredited for ${arch.aligned_ncvet_careers ? arch.aligned_ncvet_careers.slice(0, 3).join(', ') : 'High-level Strategic Leadership'} under ${arch.ncvet_details.ssc_council} (NSQF Level ${arch.ncvet_details.nsqf_level}, QP Code: ${arch.ncvet_details.qp_code}). Globally, this crosswalks directly to US O*NET SOC ${arch.ncvet_details.us_onet_code}. In these roles, your Swadharma creates high multiplicative value because your energy operates with natural authority, strategic resilience, and systematic clarity.`;
  } else if (qLower.includes('burnout') || qLower.includes('friction') || qLower.includes('stress') || qLower.includes('vikriti')) {
    answer = `In Vedic psychology, burnout is diagnosed as Vikriti (temporary pathological deviation from your innate Prakriti). With an energy dynamic of ${arch.guna_base}, your primary shadow risk is: "${arch.shadow_warning}". As Lord Krishna instructs in Bhagavad Gita 18.47: "śhreyān swa-dharmo viguṇaḥ para-dharmāt sv-anuṣhṭhitāt" (Better is one's own duty though imperfect, than another's duty well-performed). To heal this imbalance, follow your personalized Sadhana Protocol: ${arch.sadhana_protocol.pranayama}, combined with ${arch.sadhana_protocol.ahara}.`;
  } else if (qLower.includes('sadhana') || qLower.includes('elevation') || qLower.includes('diet') || qLower.includes('pranayama')) {
    answer = `For the ${arch.name} archetype (${arch.eccp_code}), your custom Guna Elevation Protocol is:\n• Pranayama: ${arch.sadhana_protocol.pranayama}\n• Sensory & Nutritional Intake (Ahara): ${arch.sadhana_protocol.ahara}\n• Circadian Rhythms (Dinacharya): ${arch.sadhana_protocol.dinacharya}\nConsistently practicing these resets your nervous system from Rajasik agitation into pure Sattvik clarity.`;
  } else if (qLower.includes('blind') || qLower.includes('shadow') || qLower.includes('weakness') || qLower.includes('pitfall')) {
    answer = `Every heroic archetype carries an Epic Shadow. For ${arch.name}, your primary vulnerability is: "${arch.shadow_warning}". In corporate settings, be vigilant not to let your natural drive degenerate into this shadow pattern. Ground your intellect daily in Viveka (objective discernment) to remain in your supreme Sattvik state.`;
  } else {
    answer = `In the Vedic tradition, self-knowledge (Atma-Jnana) begins by understanding your inner instrument (Antahkarana). For a profile aligned with ${arch.name} (${arch.eccp_code}), your intimate reason to live is expressed through ${arch.purpose}. In modern professional practice, focus on high-leverage domains: ${arch.aligned_ncvet_careers ? arch.aligned_ncvet_careers[0] : 'Strategic Leadership'}, ensuring your operational cadence remains steady, dignified, and anchored in truth. Consult ${arch.compendium_chapter} in the HPTI Compendium for the full shastric analysis.`;
  }

  // Synthesize dynamic RAG counsel from compendium shastras and NCVET qualification packs (PostgreSQL Full-Text Search)
  const grounded = await generateGroundedCounsel(query, arch, eccp_code || arch.eccp_code);
  if (grounded && grounded.shastric_insight) {
    answer += grounded.shastric_insight;
  }
  if (grounded && grounded.career_pathways && (qLower.includes('career') || qLower.includes('job') || qLower.includes('role') || qLower.includes('ncvet') || qLower.includes('pathway') || !qLower.includes('burnout'))) {
    answer += grounded.career_pathways;
  }

  res.json({
    success: true,
    response: answer,
    archetype: arch.name,
    sanskrit_title: arch.sanskrit_title,
    epic: arch.epic,
    citation: arch.epic_citation || (grounded.citations && grounded.citations.length ? grounded.citations[0] : 'HPTI Master Lexicon'),
    devanagari: arch.devanagari || '',
    shadow_warning: arch.shadow_warning,
    ncvet_details: arch.ncvet_details,
    shastric_citations: grounded.citations || []
  });
});

// ── GET /api/personalities/corpus/search ──
router.get('/corpus/search', async (req, res) => {
  const { q, type, competency, min_nsqf, max_nsqf, limit } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, error: 'Query parameter "q" is required.' });
  }

  const results = await searchKnowledgeDb(q, {
    corpusType: type,
    varnaCompetency: competency,
    nsqfLevelMin: min_nsqf ? parseInt(min_nsqf, 10) : undefined,
    nsqfLevelMax: max_nsqf ? parseInt(max_nsqf, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : 10
  });

  res.json({
    success: true,
    query: q,
    count: results.length,
    results
  });
});

// ── GET /api/personalities/sectors ──
router.get('/sectors', async (req, res) => {
  try {
    const sectorsData = await getAvailableSectors(db);
    res.json({
      success: true,
      count: sectorsData.all_sectors ? sectorsData.all_sectors.length : 0,
      flagships: sectorsData.flagships || TOP_FLAGSHIP_SECTORS,
      sectors: sectorsData.all_sectors || []
    });
  } catch (err) {
    console.error('Error in /api/personalities/sectors:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/personalities/careers ──
router.get('/careers', async (req, res) => {
  try {
    const { code, sector } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Query parameter "code" is required.' });
    }
    const alignment = await getCareersForSector(code, sector, db);
    res.json(alignment);
  } catch (err) {
    console.error('Error in /api/personalities/careers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// COMPENDIUM ARCHITECTURE & TABLE OF CONTENTS
// ══════════════════════════════════════════════════════════════════
const COMPENDIUM_BASE_DIR = path.join(__dirname, '../../docs/hpti_compendium');

const COMPENDIUM_TOC = [
  {
    volume: 1,
    volume_title: 'Ontological Foundations',
    subtitle: 'The Vedic Architecture of the Human Being',
    chapters: [
      { num: 1, title: 'Sāmkhya Cosmology & the 24 Tattvas', file: '01_Ontological_Foundations/chapter_01_samkhya_and_tattvas.md', summary: 'The metaphysical ladder from Purusha and Prakriti to the 24 constituent elements of experience.' },
      { num: 2, title: 'The Pancha Kosha Architecture (Five Sheaths of Being)', file: '01_Ontological_Foundations/chapter_02_pancha_kosha.md', summary: 'Mapping somatic, energetic, mental, intellectual, and bliss sheaths to personality.' },
      { num: 3, title: 'Antahkarana Chatushtaya (The Fourfold Inner Mind)', file: '01_Ontological_Foundations/chapter_03_antahkarana_chatushtaya.md', summary: 'Manas, Buddhi, Ahankara, and Chitta as distinct cognitive faculties and their operational roles.' },
      { num: 4, title: 'Ayurveda: Sharirika vs. Manasa Prakriti', file: '01_Ontological_Foundations/chapter_04_ayurveda_prakriti_doshas.md', summary: 'Differentiating physiological constitutional doshas from mental Guna orientations.' }
    ]
  },
  {
    volume: 2,
    volume_title: 'The Triguna Dynamic & The Gita’s Psychometrics',
    subtitle: 'Energetics, Cognitive Vectors, and Transcendent Consciousness',
    chapters: [
      { num: 5, title: 'The Physics of the Mind: Sattva, Rajas & Tamas', file: '02_The_Triguna_Dynamic/chapter_05_triguna_physics_of_mind.md', summary: 'How the three primary forces govern perception, drive, and inertia in the subtle body.' },
      { num: 6, title: 'The 6-Vector Psychometric Model of Bhagavad Gita 18', file: '02_The_Triguna_Dynamic/chapter_06_gita_six_vector_model.md', summary: 'Sri Krishna’s rigorous empirical breakdown of Knowledge, Action, Agent, Intellect, Fortitude, and Happiness.' },
      { num: 7, title: 'Charaka Samhita’s 16 Clinical Manasa Prakritis', file: '02_The_Triguna_Dynamic/chapter_07_charaka_16_manasa_prakritis.md', summary: 'The 7 Sattvik, 6 Rajasik, and 3 Tamasik clinical mental typologies from ancient Indian medicine.' },
      { num: 8, title: 'Gunatita: The Psychology of Transcendence & Witness State', file: '02_The_Triguna_Dynamic/chapter_08_gunatita_and_transcendence.md', summary: 'Operating beyond Gunic conditioning while remaining exceptionally effective in worldly work.' }
    ]
  },
  {
    volume: 3,
    volume_title: 'The ECCP Framework (The 144 Matrix)',
    subtitle: 'The 4-Dimensional Psychometric Core of HPTI',
    chapters: [
      { num: 9, title: 'The ECCP Architecture: 144 Ontological Permutations', file: '03_The_ECCP_Framework/chapter_09_eccp_architecture.md', summary: 'The complete mathematical and ontological matrix: Energy, Cognition, Competency, and Purpose.' },
      { num: 10, title: 'Varna-Swabhava: Restoring Natural Vocational Aptitude', file: '03_The_ECCP_Framework/chapter_10_varna_swabhava_taxonomy.md', summary: 'Debunking hereditary distortion to recover authentic psychological archetype and natural vocation.' },
      { num: 11, title: 'The Purushartha Vector: Teleology of Modern Careers', file: '03_The_ECCP_Framework/chapter_11_purushartha_teleology.md', summary: 'Aligning career decisions with the four existential aims of Dharma, Artha, Kama, and Moksha.' },
      { num: 12, title: 'Prakriti vs. Vikriti: Innate Nature vs. Modern Burnout Mask', file: '03_The_ECCP_Framework/chapter_12_prakriti_vs_vikriti.md', summary: 'Diagnosing the pathological workplace stress mask and charting the return to constitutional equilibrium.' }
    ]
  },
  {
    volume: 4,
    volume_title: 'Epic Archetypes Catalog',
    subtitle: 'Living Mirrors from the Ramayana & Mahabharata',
    chapters: [
      { num: 13, title: 'Narrative Psychology: Why Itihasa Outperforms Trait Lists', file: '04_Epic_Archetypes_Catalog/chapter_13_narrative_psychology.md', summary: 'How archetypal epic narratives activate deeper moral imagination than abstract Western trait scores.' },
      { num: 14, title: 'The Ramayana Archetypal Spectrum', file: '04_Epic_Archetypes_Catalog/chapter_14_ramayana_archetypes.md', summary: 'Deep psychological profiles of Sri Rama, Hanuman, Lakshmana, Sugriva, Vibhishana, Bharata, and Janaka.' },
      { num: 15, title: 'The Mahabharata Archetypal Spectrum', file: '04_Epic_Archetypes_Catalog/chapter_15_mahabharata_archetypes.md', summary: 'Complex, gritty psychodynamics of Arjuna, Krishna, Vidura, Bhishma, Karna, Yudhishthira, and Balarama.' },
      { num: 16, title: 'The Master 144 Archetypal Lexicon', file: '04_Epic_Archetypes_Catalog/chapter_16_the_144_archetype_matrix.md', summary: 'The exhaustive reference directory of all 144 ECCP code combinations and their vocational manifestations.' }
    ]
  },
  {
    volume: 5,
    volume_title: 'Vocational Realization & NSQF / NCVET',
    subtitle: 'Bridging Swadharma to National Skills Qualification Standards',
    chapters: [
      { num: 17, title: 'The Swadharma Imperative (Gita 18.47 & Occupational Health)', file: '05_Vocational_Realization_NSQF/chapter_17_swadharma_imperative.md', summary: 'Why violating your inherent nature causes chronic occupational exhaustion and corporate cynicism.' },
      { num: 18, title: 'Deconstructing the Indian Vocational Framework (NSQF & NCVET)', file: '05_Vocational_Realization_NSQF/chapter_18_nsqf_ncvet_architecture.md', summary: 'How India’s 10-level competency architecture maps onto psychological maturity and technical mastery.' },
      { num: 19, title: 'Competency-to-Career Maps (B-K-V-S to 2,002 QPs)', file: '05_Vocational_Realization_NSQF/chapter_19_competency_to_career_maps.md', summary: 'Concrete job roles, Sector Skill Councils, and QP codes for each of the four competency quadrants.' },
      { num: 20, title: 'International Crosswalk: Bridging HPTI with O*NET & ESCO', file: '05_Vocational_Realization_NSQF/chapter_20_global_framework_crosswalk.md', summary: 'Equivalence tables mapping HPTI archetypes to US Department of Labor O*NET codes and European ESCO.' }
    ]
  },
  {
    volume: 6,
    volume_title: 'Diagnostic Instrumentation & Technical Architecture',
    subtitle: 'Test Construction, Scoring Algorithms & Sovereign Tech',
    chapters: [
      { num: 21, title: 'Psychometric Instrument Design & Scenario Calibration', file: '06_Diagnostic_Instrumentation/chapter_21_psychometric_design.md', summary: 'Designing situational dilemmas that bypass social desirability bias and reveal instinctual Gunic patterns.' },
      { num: 22, title: 'Algorithmic Scoring & Multi-Vector Normalization', file: '06_Diagnostic_Instrumentation/chapter_22_scoring_algorithms.md', summary: 'Mathematical models for vector distance, Guna balancing, and Vikriti variance calculation.' },
      { num: 23, title: 'Sovereign Local-First Software Architecture', file: '06_Diagnostic_Instrumentation/chapter_23_software_architecture.md', summary: 'Building zero-data-leakage psychometric platforms with private client-side evaluation.' },
      { num: 24, title: 'Embedded Vedic RAG Architecture & Shastric Grounding', file: '06_Diagnostic_Instrumentation/chapter_24_rag_and_vedic_counselor.md', summary: 'Knowledge retrieval pipelines synthesizing classical Sanskrit commentaries for contextual counseling.' }
    ]
  },
  {
    volume: 7,
    volume_title: 'The Sadhana Protocol (Elevation, Leadership & Civilization)',
    subtitle: 'Practical Evolution, Dharmic Organizations & Viksit Bharat',
    chapters: [
      { num: 25, title: 'Guna Elevation Protocols: The Sadhana Engine', file: '07_The_Sadhana_Protocol/chapter_25_guna_elevation_protocols.md', summary: 'Specific pranayama, diet, and dinacharya routines to transmute Tamas into Rajas and Rajas into Sattva.' },
      { num: 26, title: 'Escaping the Paradharma Trap: Corporate Conditioning & Pivots', file: '07_The_Sadhana_Protocol/chapter_26_overcoming_paradharma_trap.md', summary: 'A structured roadmap for transitioning from soul-draining prestige careers to sovereign Swadharma.' },
      { num: 27, title: 'Dharmic Leadership & High-Performance Team Dynamics', file: '07_The_Sadhana_Protocol/chapter_27_dharmic_teams_and_leadership.md', summary: 'Assembling complementary Guna-balanced C-suites and engineering teams for resilient execution.' },
      { num: 28, title: 'Civilizational Renaissance: HPTI as Bharat’s Human Capital Engine', file: '07_The_Sadhana_Protocol/chapter_28_civilizational_renaissance.md', summary: 'Deploying indigenous psychometrics to power the national talent strategy for Viksit Bharat 2047.' }
    ]
  }
];

// Helper to determine exact chapter file for archetype
function getArchetypeCompendiumFile(arch) {
  if (arch.epic === 'Ramayana') return '04_Epic_Archetypes_Catalog/chapter_14_ramayana_archetypes.md';
  if (arch.epic === 'Mahabharata') return '04_Epic_Archetypes_Catalog/chapter_15_mahabharata_archetypes.md';
  return '04_Epic_Archetypes_Catalog/chapter_16_the_144_archetype_matrix.md';
}

// ── GET /api/personalities/compendium/toc ──
router.get('/compendium/toc', (req, res) => {
  res.json({
    success: true,
    title: 'HPTI Master Compendium: Vedic Psychology, Epic Archetypes & National Vocational Realization',
    total_volumes: COMPENDIUM_TOC.length,
    total_chapters: 28,
    volumes: COMPENDIUM_TOC
  });
});

// ── GET /api/personalities/compendium/chapter ──
router.get('/compendium/chapter', (req, res) => {
  const chapterFile = req.query.file || req.query.path;
  if (!chapterFile) {
    return res.status(400).json({ success: false, error: 'Chapter file or path parameter is required.' });
  }

  // Normalize path and remove leading slashes or dots
  const safeRelPath = path.normalize(chapterFile).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
  const fullPath = path.join(COMPENDIUM_BASE_DIR, safeRelPath);

  if (!fullPath.startsWith(COMPENDIUM_BASE_DIR)) {
    return res.status(403).json({ success: false, error: 'Access denied: Invalid chapter path.' });
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ success: false, error: `Chapter file not found: ${safeRelPath}` });
  }

  try {
    const rawContent = fs.readFileSync(fullPath, 'utf8');
    
    // Extract title
    let title = path.basename(safeRelPath, '.md');
    const firstH1Match = rawContent.match(/^#\s+(.+)$/m);
    if (firstH1Match) {
      title = firstH1Match[1].trim();
    }

    res.json({
      success: true,
      file: safeRelPath,
      title: title,
      markdown: rawContent
    });
  } catch (err) {
    console.error('Error reading compendium chapter:', err);
    res.status(500).json({ success: false, error: 'Failed to read compendium chapter' });
  }
});

module.exports = router;
