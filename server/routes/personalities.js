'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  HAYA PERSONALITIES API ROUTER                                  ║
 * ║  Sanatani Typology • ECCP Framework • Ramayana & Mahabharata    ║
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
// 9 PRAKRITI SITUATIONAL SCENARIOS (Innate Nature Baseline)
// ══════════════════════════════════════════════════════════════════
const PRAKRITI_QUESTIONS = [
  // ── Pillar I: Energy (Triguna Dynamics) ──
  {
    id: 'q1',
    pillar: 'I',
    pillar_title: 'Energy & Prana Dynamics (Triguna)',
    gita_vector: 'Dhriti & Sukha (Gita 18.33-39)',
    title: 'Reaction to Sudden Crisis & Organizational Shock',
    shastric_rationale: 'Tests whether your physiological nervous system defaults to Sattvik equanimity, Rajasik agitation, or Tamasik withdrawal under sudden friction.',
    scenario: 'Your organization experiences an unexpected catastrophe: a production outage, sudden executive resignation, or severe market crash. Your immediate unconditioned reflex is:',
    options: [
      {
        id: 'S',
        label: 'Sattvik Equanimity & Centering',
        desc: 'A swift centering of breath, quiet detached observation of all moving variables, and a calm, deliberate assessment of what duty (Dharma) requires next.',
        code: 'S',
        vector: { sattva: 0.7, rajas: 0.2, tamas: 0.1 }
      },
      {
        id: 'R',
        label: 'Rajasik Kinetic Mobilization',
        desc: 'An immediate surge of adrenaline, rapid-fire communications, urgent counter-measures, and a fierce drive to conquer the crisis through immediate motion.',
        code: 'R',
        vector: { sattva: 0.2, rajas: 0.7, tamas: 0.1 }
      },
      {
        id: 'T',
        label: 'Tamasik Grounding & Containment',
        desc: 'A heavy sense of immobility, deep caution, refusing to make sudden moves, and waiting behind defensive shields until the chaotic storm clears.',
        code: 'T',
        vector: { sattva: 0.1, rajas: 0.2, tamas: 0.7 }
      }
    ]
  },
  {
    id: 'q2',
    pillar: 'I',
    pillar_title: 'Energy & Prana Dynamics (Triguna)',
    gita_vector: 'Sukha & Ahara (Gita 17.8-10)',
    title: 'Restoration of Cognitive & Vital Reserves',
    shastric_rationale: 'Evaluates which qualitative environment replenishes your Pranamaya and Manomaya sheaths after exhausting exertion.',
    scenario: 'After three months of relentless, exhausting labor, what environment genuinely restores your cognitive clarity, vitality, and spirit?',
    options: [
      {
        id: 'S',
        label: 'Harmonious Sanctuary & Purposeful Study (Sattva)',
        desc: 'Quiet, ordered spaces with foundational texts, reflective writing, nature walks, and noble philosophical conversation with trusted mentors.',
        code: 'S',
        vector: { sattva: 0.8, rajas: 0.1, tamas: 0.1 }
      },
      {
        id: 'R',
        label: 'Dynamic Sprints & Kinetic Social Momentum (Rajas)',
        desc: 'High-impact travel, engaging in athletic challenges, brainstorming bold new ventures with peers, and celebrating hard-fought victories.',
        code: 'R',
        vector: { sattva: 0.1, rajas: 0.8, tamas: 0.1 }
      },
      {
        id: 'T',
        label: 'Total Solitude, Darkness & Sensory Shutdown (Tamas)',
        desc: 'Unbroken sleep, deep isolation away from all screens and people, minimal sensory stimulation, and allowing the biological battery to recharge in silence.',
        code: 'T',
        vector: { sattva: 0.3, rajas: 0.1, tamas: 0.6 }
      }
    ]
  },
  {
    id: 'q3',
    pillar: 'I',
    pillar_title: 'Energy & Prana Dynamics (Triguna)',
    gita_vector: 'Karma & Karta (Gita 18.23-28)',
    title: 'Daily Motivational Cadence & Work Flow',
    shastric_rationale: 'Measures whether your daily work energy operates via steady discipline (Abhyasa), intense sprints, or sporadic curiosity.',
    scenario: 'How do you naturally expend your working energy over quarters and years when no external boss is watching you?',
    options: [
      {
        id: 'S',
        label: 'Sustained Flow & Sacred Craftsmanship (Abhyasa)',
        desc: 'A steady, unshakeable daily rhythm where work is treated as a sacred offering (Yajna); zero reliance on manic adrenaline or public applause.',
        code: 'S',
        vector: { sattva: 0.8, rajas: 0.1, tamas: 0.1 }
      },
      {
        id: 'R',
        label: 'High-Velocity Sprints & Mission Targets (Rajas)',
        desc: 'Operating in passionate, high-adrenaline bursts chasing ambitious targets, followed by brief recovery before launching the next campaign.',
        code: 'R',
        vector: { sattva: 0.2, rajas: 0.7, tamas: 0.1 }
      },
      {
        id: 'T',
        label: 'Deliberate Preservation & Rhythmic Routine (Tamas)',
        desc: 'A methodical, protective pace prioritizing procedural stability, safety checks, and zero deviations from established, proven protocols.',
        code: 'T',
        vector: { sattva: 0.2, rajas: 0.2, tamas: 0.6 }
      }
    ]
  },

  // ── Pillar II: Cognition (Antahkarana Locus) ──
  {
    id: 'q4',
    pillar: 'II',
    pillar_title: 'Cognition & Inner Instrument (Antahkarana)',
    gita_vector: 'Buddhi (Gita 18.30-32)',
    title: 'Processing Complex, Ambiguous Strategic Dilemmas',
    shastric_rationale: 'Tests whether your decision engine is governed by Buddhi (first principles), Manas (relational networks), or Ahankara (executive command).',
    scenario: 'You are presented with a massive, unprecedented crisis with zero existing playbook. How does your inner mind instinctively deconstruct it?',
    options: [
      {
        id: 'B',
        label: 'First-Principles Truth & Universal Patterns (Buddhi-Led)',
        desc: 'Stripping away superficial symptoms, examining historical analogues, and deriving the invariant structural law governing the system.',
        code: 'B',
        varna: 'Brahmana',
        cognition: 'Buddhi'
      },
      {
        id: 'K',
        label: 'Command Levers, Downside Protection & Tactics (Ahankara-Buddhi)',
        desc: 'Establishing immediate chain-of-command, isolating points of failure, assessing sovereign risks, and executing bold, decisive interventions.',
        code: 'K',
        varna: 'Kshatriya',
        cognition: 'Ahankara'
      },
      {
        id: 'V',
        label: 'Resource Arbitrage & Ecosystem Networks (Manas-Buddhi)',
        desc: 'Analyzing stakeholder incentives, capital flow, supply logistics, and negotiating mutually beneficial alliances to solve the bottleneck.',
        code: 'V',
        varna: 'Vaishya',
        cognition: 'Manas'
      },
      {
        id: 'S',
        label: 'Hands-On Tooling & Direct Execution (Pragmatic Action)',
        desc: 'Going straight to the shop-floor or codebase; inspecting the physical hardware and debugging the machine directly with your hands.',
        code: 'S',
        varna: 'Shudra',
        cognition: 'Manas'
      }
    ]
  },
  {
    id: 'q5',
    pillar: 'II',
    pillar_title: 'Cognition & Inner Instrument (Antahkarana)',
    gita_vector: 'Jnana & Viveka (Gita 18.20-22)',
    title: 'High-Stakes Ethical Crossroads',
    shastric_rationale: 'Evaluates your internal moral arbiter: universal duty (Dharma), economic sustainability (Artha), or autonomous conscience (Moksha).',
    scenario: 'A lucrative business proposal guarantees immense financial upside, but requires exploiting a legal loophole that causes hidden harm to the community. Your decision arbiter is:',
    options: [
      {
        id: 'D',
        label: 'Nitya-Anitya-Viveka: Universal Duty (Dharma)',
        desc: 'Absolute rejection. Asking: "Is this righteous?", knowing that short-term wealth acquired through Adharma destroys the institution in the end.',
        code: 'D',
        purpose: 'Dharma',
        cognition: 'Buddhi'
      },
      {
        id: 'A',
        label: 'Long-Term Systemic Durability & Stakeholder Balance (Artha)',
        desc: 'Pragmatic calculation: Evaluating reputational risk, regulatory blowback, and seeking a structural compromise that preserves enterprise sustainability.',
        code: 'A',
        purpose: 'Artha',
        cognition: 'Manas'
      },
      {
        id: 'M',
        label: 'Sovereign Conscience & Inner Freedom (Moksha)',
        desc: 'Uncompromising personal refusal. You refuse to let external gold bind your soul or compromise your inner sovereign integrity.',
        code: 'M',
        purpose: 'Moksha',
        cognition: 'Ahankara'
      }
    ]
  },
  {
    id: 'q6',
    pillar: 'II',
    pillar_title: 'Cognition & Inner Instrument (Antahkarana)',
    gita_vector: 'Karta & Dhriti (Gita 18.26-35)',
    title: 'Processing Major Professional Failure & Betrayal',
    shastric_rationale: 'Measures how your Antahkarana recalibrates after acute crisis: intellectual decoupling, karmic introspection, or sovereign grit.',
    scenario: 'A multi-year initiative collapses unexpectedly due to external betrayal or black-swan market disruption. Your internal processing mechanism is:',
    options: [
      {
        id: 'B',
        label: 'Objective Algorithmic Deconstruction (Buddhi-Led)',
        desc: 'Instantly detaching personal ego; treating the collapse as raw experimental data; rewriting the mental model with clinical scientific precision.',
        code: 'B',
        cognition: 'Buddhi'
      },
      {
        id: 'A',
        label: 'Unyielding Sovereign Fortitude (Ahankara-Led)',
        desc: 'Absorbing the blow through sheer inner willpower; refusing to surrender; doubling down on preparation to conquer the next summit.',
        code: 'A',
        cognition: 'Ahankara'
      },
      {
        id: 'S',
        label: 'Karmic Purification & Humility (Sattvik-Buddhi)',
        desc: 'Viewing the setback as a cosmic teacher highlighting pride or blind spots, cultivating deeper spiritual humility and patience.',
        code: 'S',
        cognition: 'Buddhi'
      }
    ]
  },

  // ── Pillar III: Competency & Purpose (Swadharma & Purushartha) ──
  {
    id: 'q7',
    pillar: 'III',
    pillar_title: 'Competency & Purpose (Swadharma & Purushartha)',
    gita_vector: 'Varna-Swabhava (Gita 18.41-44)',
    title: 'Unconstrained Vocational Calling',
    shastric_rationale: 'Isolates your innate Swabhava (natural aptitude) by removing survival pressures and social status rewards.',
    scenario: 'If all financial needs, social prestige, and family expectations were permanently solved tomorrow, what would you spend 12 hours a day doing for the next 20 years?',
    options: [
      {
        id: 'B',
        label: 'Deep Research, Synthesis & Philosophical Treatises (Brahmana)',
        desc: 'Discovering foundational truths, authoring seminal treatises, designing master algorithms, and mentoring the brightest minds.',
        code: 'B',
        varna: 'Brahmana',
        purpose: 'Moksha'
      },
      {
        id: 'K',
        label: 'High-Stakes Sovereign Leadership & Crisis Protection (Kshatriya)',
        desc: 'Commanding critical institutions, protecting the vulnerable, steering nations/enterprises through perilous turnarounds, and defending justice.',
        code: 'K',
        varna: 'Kshatriya',
        purpose: 'Dharma'
      },
      {
        id: 'V',
        label: 'Building Scaling Marketplaces & Global Ecosystems (Vaishya)',
        desc: 'Mobilizing venture capital, architecting global trade networks, funding breakthroughs, and building enduring engines of material abundance.',
        code: 'V',
        varna: 'Vaishya',
        purpose: 'Artha'
      },
      {
        id: 'S',
        label: 'Tangible Mastery, Precision Fabrication & Craft (Shudra)',
        desc: 'Crafting masterworks with your own hands—high-precision machines, master software code, aerospace components, or architectural landmarks.',
        code: 'S',
        varna: 'Shudra',
        purpose: 'Kama'
      }
    ]
  },
  {
    id: 'q8',
    pillar: 'III',
    pillar_title: 'Competency & Purpose (Swadharma & Purushartha)',
    gita_vector: 'Purushartha (Artha vs. Dharma)',
    title: 'Relationship with Capital, Scale & Ambition',
    shastric_rationale: 'Diagnoses whether you view wealth as fuel for protection (Kshatriya), scorecards of enterprise (Vaishya), or a secondary byproduct (Brahmana).',
    scenario: 'What is your authentic, private relationship with capital accumulation, material leverage, and worldly power?',
    options: [
      {
        id: 'D',
        label: 'Fuel for Sovereign Defense & Protection (Dharma)',
        desc: 'Capital is defensive ammunition: it provides the leverage required to defend freedom, protect your team, and fund noble civilizational causes.',
        code: 'D',
        purpose: 'Dharma'
      },
      {
        id: 'A',
        label: 'The Objective Scoreboard of Realized Value (Artha)',
        desc: 'Capital is a precise metric measuring how effectively your system architecture solves human and economic problems in the open market.',
        code: 'A',
        purpose: 'Artha'
      },
      {
        id: 'M',
        label: 'A Functional Utility Subordinate to Truth (Moksha)',
        desc: 'Money is necessary for biological maintenance, but genuine wealth is knowledge, self-mastery, peace of mind, and intellectual sovereignty.',
        code: 'M',
        purpose: 'Moksha'
      }
    ]
  },
  {
    id: 'q9',
    pillar: 'III',
    pillar_title: 'Competency & Purpose (Swadharma & Purushartha)',
    gita_vector: 'Swadharma Summit (Gita 18.47)',
    title: 'Ultimate Existential Justification of Your Life',
    shastric_rationale: 'Evaluates your ultimate Purushartha vector: what legacy makes your life feel entirely justified upon death.',
    scenario: 'Standing at the very end of your life, looking back at all your labor, which statement would make you feel your existence on Earth was fully justified?',
    options: [
      {
        id: 'D',
        label: 'The Incorruptible Shield: "I upheld justice and protected duty." (Dharma)',
        desc: '"I stood firm when others compromised; I defended righteousness, protected those who trusted me, and lived an honorable life."',
        code: 'D',
        purpose: 'Dharma'
      },
      {
        id: 'A',
        label: 'The Civilizational Builder: "I built enduring engines of abundance." (Artha)',
        desc: '"I created lasting institutions, provided livelihoods for thousands, and scaled systems that generated enduring prosperity."',
        code: 'A',
        purpose: 'Artha'
      },
      {
        id: 'M',
        label: 'The Luminous Clarifier: "I decoded truth and realized freedom." (Moksha)',
        desc: '"I mastered my inner mind, transmitted enduring wisdom, and walked through worldly illusions with unshakeable inner peace."',
        code: 'M',
        purpose: 'Moksha'
      },
      {
        id: 'K',
        label: 'The Master Artisan: "I perfected my craft to divine standards." (Kama)',
        desc: '"I brought tangible beauty, precision, and functional grace into the world through the dedicated mastery of my hands and tools."',
        code: 'K',
        purpose: 'Kama'
      }
    ]
  }
];

// ══════════════════════════════════════════════════════════════════
// 6 VIKRITI BURNOUT AUDIT SCENARIOS (Current Stress & Mask Check)
// ══════════════════════════════════════════════════════════════════
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
      { code: 'V_MED', label: 'Restless Multi-Tasking', desc: 'Compulsive tab-switching; feeling anxious if away from Slack/email for more than 20 minutes.', score: 2 },
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

// Helper: Calculate ECCP Vector from Answer Key
function evaluateECCP(answers, vikritiAnswers = {}) {
  const scores = {
    guna: { S: 0, R: 0, T: 0 },
    cognition: { B: 0, M: 0, A: 0 },
    competency: { B: 0, K: 0, V: 0, S: 0 },
    purpose: { D: 0, A: 0, K: 0, M: 0 }
  };

  // Map Q1 - Q3 to Guna
  ['q1', 'q2', 'q3'].forEach(q => {
    const val = answers[q] || 'S';
    scores.guna[val] = (scores.guna[val] || 0) + 1;
  });

  // Map Q4 - Q6 to Cognition and Competency
  if (answers.q4) {
    if (answers.q4 === 'B') { scores.competency.B += 2; scores.cognition.B += 1; }
    else if (answers.q4 === 'K') { scores.competency.K += 2; scores.cognition.A += 1; }
    else if (answers.q4 === 'V') { scores.competency.V += 2; scores.cognition.M += 1; }
    else if (answers.q4 === 'S') { scores.competency.S += 2; scores.cognition.M += 1; }
  }

  if (answers.q5) {
    if (answers.q5 === 'D') { scores.purpose.D += 2; scores.cognition.B += 1; }
    else if (answers.q5 === 'A') { scores.purpose.A += 2; scores.cognition.M += 1; }
    else if (answers.q5 === 'M') { scores.purpose.M += 2; scores.cognition.A += 1; }
  }

  if (answers.q6) {
    if (answers.q6 === 'B') scores.cognition.B += 2;
    else if (answers.q6 === 'S') { scores.cognition.B += 1; scores.guna.S += 1; }
    else if (answers.q6 === 'A') scores.cognition.A += 2;
  }

  // Map Q7 - Q9 to Competency and Purpose
  if (answers.q7) {
    if (answers.q7 === 'B') { scores.competency.B += 2; scores.purpose.M += 1; }
    else if (answers.q7 === 'K') { scores.competency.K += 2; scores.purpose.D += 1; }
    else if (answers.q7 === 'V') { scores.competency.V += 2; scores.purpose.A += 1; }
    else if (answers.q7 === 'S') { scores.competency.S += 2; scores.purpose.K += 1; }
  }

  if (answers.q8) {
    if (answers.q8 === 'D') scores.purpose.D += 2;
    else if (answers.q8 === 'A') scores.purpose.A += 2;
    else if (answers.q8 === 'M') scores.purpose.M += 2;
  }

  if (answers.q9) {
    if (answers.q9 === 'D') scores.purpose.D += 2;
    else if (answers.q9 === 'A') scores.purpose.A += 2;
    else if (answers.q9 === 'M') scores.purpose.M += 2;
    else if (answers.q9 === 'K') scores.purpose.K += 2;
  }

  // Determine top dimension values
  const topGuna = Object.keys(scores.guna).reduce((a, b) => scores.guna[a] >= scores.guna[b] ? a : b);
  const secondGuna = Object.keys(scores.guna).filter(k => k !== topGuna).reduce((a, b) => scores.guna[a] >= scores.guna[b] ? a : b);
  const topCognition = Object.keys(scores.cognition).reduce((a, b) => scores.cognition[a] >= scores.cognition[b] ? a : b);
  const topCompetency = Object.keys(scores.competency).reduce((a, b) => scores.competency[a] >= scores.competency[b] ? a : b);
  const topPurpose = Object.keys(scores.purpose).reduce((a, b) => scores.purpose[a] >= scores.purpose[b] ? a : b);

  const eccp_code = `${topGuna}${secondGuna}-${topCognition}M-${topCompetency}-${topPurpose}`;

  // Find best matching epic archetype
  let bestMatch = EPIC_ARCHETYPES[0];
  let maxScore = -1;

  EPIC_ARCHETYPES.forEach(arch => {
    let matchScore = 0;
    const parts = arch.eccp_code.split('-');
    if (parts[0].includes(topGuna)) matchScore += 2;
    if (parts[1].includes(topCognition)) matchScore += 2;
    if (parts[2].includes(topCompetency)) matchScore += 3;
    if (parts[3].includes(topPurpose)) matchScore += 3;

    if (matchScore > maxScore) {
      maxScore = matchScore;
      bestMatch = arch;
    }
  });

  // Calculate Vikriti Burnout Score if provided
  let vikritiScore = 0;
  let vikritiMax = 24;
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
    eccp_code,
    scores,
    dominant: {
      energy: topGuna === 'S' ? 'Sattvik' : (topGuna === 'R' ? 'Rajasik' : 'Tamasik'),
      cognition: topCognition === 'B' ? 'Buddhi-Led' : (topCognition === 'M' ? 'Manas-Led' : 'Ahankara-Led'),
      competency: topCompetency === 'B' ? 'Brahmana' : (topCompetency === 'K' ? 'Kshatriya' : (topCompetency === 'V' ? 'Vaishya' : 'Shudra')),
      purpose: topPurpose === 'D' ? 'Dharma' : (topPurpose === 'A' ? 'Artha' : (topPurpose === 'M' ? 'Moksha' : 'Kama'))
    },
    matched_archetype: bestMatch,
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
  const { epic, tier } = req.query;
  let filtered = EPIC_ARCHETYPES;

  if (epic && epic !== 'all') {
    filtered = filtered.filter(a => a.epic.toLowerCase() === epic.toLowerCase());
  }
  if (tier && tier !== 'all') {
    filtered = filtered.filter(a => a.tier.toLowerCase() === tier.toLowerCase());
  }

  const enriched = filtered.map(a => ({
    ...a,
    compendium_file: getArchetypeCompendiumFile(a)
  }));

  res.json({ success: true, count: enriched.length, archetypes: enriched });
});

// ── GET /api/personalities/questions ──
router.get('/questions', (req, res) => {
  res.json({
    success: true,
    count: PRAKRITI_QUESTIONS.length,
    questions: PRAKRITI_QUESTIONS,
    vikriti_questions: VIKRITI_QUESTIONS
  });
});

// ── POST /api/personalities/evaluate ──
router.post('/evaluate', (req, res) => {
  const { answers, vikriti_answers } = req.body;
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ success: false, error: 'Answers payload must be an object with question keys.' });
  }
  const result = evaluateECCP(answers, vikriti_answers);
  res.json({ success: true, ...result });
});

// ── POST /api/personalities/chat ──
router.post('/chat', (req, res) => {
  const { query, archetype_id, eccp_code } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required.' });
  }

  const arch = EPIC_ARCHETYPES.find(a => a.id === archetype_id) || EPIC_ARCHETYPES[0];
  const qLower = query.toLowerCase();

  let answer = '';
  if (qLower.includes('why') || qLower.includes('match') || qLower.includes('who') || qLower.includes('meaning')) {
    answer = `Based on your ECCP code (${eccp_code || arch.eccp_code}), your psychological vector mirrors ${arch.name} (${arch.sanskrit_title}). In the ${arch.epic}, ${arch.name} embodies your core drive: "${arch.quote}". Your dominant energy is ${arch.guna_base} and your cognitive style operates via ${arch.antahkarana}. You do not merely seek routine employment; you are fueled by ${arch.purpose}, which makes your natural leverage flourish in high-responsibility environments without burning out.`;
  } else if (qLower.includes('career') || qLower.includes('job') || qLower.includes('ncvet') || qLower.includes('nsqf') || qLower.includes('role')) {
    answer = `Under India's certified NCVET and NSQF national framework, an archetype of ${arch.name} (${arch.competency}) is accredited for ${arch.aligned_ncvet_careers.slice(0, 3).join(', ')} under ${arch.ncvet_details.ssc_council} (NSQF Level ${arch.ncvet_details.nsqf_level}, QP Code: ${arch.ncvet_details.qp_code}). Globally, this crosswalks directly to US O*NET SOC ${arch.ncvet_details.us_onet_code}. In these roles, your Swadharma creates high multiplicative value because your energy operates with natural authority, strategic resilience, and systematic clarity.`;
  } else if (qLower.includes('burnout') || qLower.includes('friction') || qLower.includes('stress') || qLower.includes('vikriti')) {
    answer = `In Vedic psychology, burnout is diagnosed as Vikriti (temporary pathological deviation from your innate Prakriti). With an energy dynamic of ${arch.guna_base}, your primary shadow risk is: "${arch.shadow_warning}". As Lord Krishna instructs in Bhagavad Gita 18.47: "śhreyān swa-dharmo viguṇaḥ para-dharmāt sv-anuṣhṭhitāt" (Better is one's own duty though imperfect, than another's duty well-performed). To heal this imbalance, follow your personalized Sadhana Protocol: ${arch.sadhana_protocol.pranayama}, combined with ${arch.sadhana_protocol.ahara}.`;
  } else if (qLower.includes('sadhana') || qLower.includes('elevation') || qLower.includes('diet') || qLower.includes('pranayama')) {
    answer = `For the ${arch.name} archetype (${arch.eccp_code}), your custom Guna Elevation Protocol is:\n• Pranayama: ${arch.sadhana_protocol.pranayama}\n• Sensory & Nutritional Intake (Ahara): ${arch.sadhana_protocol.ahara}\n• Circadian Rhythms (Dinacharya): ${arch.sadhana_protocol.dinacharya}\nConsistently practicing these resets your nervous system from Rajasik agitation into pure Sattvik clarity.`;
  } else if (qLower.includes('blind') || qLower.includes('shadow') || qLower.includes('weakness') || qLower.includes('pitfall')) {
    answer = `Every heroic archetype carries an Epic Shadow. For ${arch.name}, your primary vulnerability is: "${arch.shadow_warning}". In corporate settings, be vigilant not to let your natural drive degenerate into this shadow pattern. Ground your intellect daily in Viveka (objective discernment) to remain in your supreme Sattvik state.`;
  } else {
    answer = `In the Sanatani tradition, self-knowledge (Atma-Jnana) begins by understanding your inner instrument (Antahkarana). For a profile aligned with ${arch.name} (${arch.eccp_code}), your intimate reason to live is expressed through ${arch.purpose}. In modern professional practice, focus on high-leverage domains: ${arch.aligned_ncvet_careers[0]}, ensuring your operational cadence remains steady, dignified, and anchored in truth. Consult ${arch.compendium_chapter} in the HPTI Compendium for the full shastric analysis.`;
  }

  res.json({
    success: true,
    response: answer,
    archetype: arch.name,
    sanskrit_title: arch.sanskrit_title,
    epic: arch.epic,
    citation: arch.epic_citation,
    devanagari: arch.devanagari,
    shadow_warning: arch.shadow_warning,
    ncvet_details: arch.ncvet_details
  });
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
      { num: 24, title: 'Embedded Sanatani RAG Architecture & Shastric Grounding', file: '06_Diagnostic_Instrumentation/chapter_24_rag_and_vedic_counselor.md', summary: 'Knowledge retrieval pipelines synthesizing classical Sanskrit commentaries for contextual counseling.' }
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
    title: 'HPTI Master Compendium: Sanatani Psychology, Epic Archetypes & National Vocational Realization',
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
