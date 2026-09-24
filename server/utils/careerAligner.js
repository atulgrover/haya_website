'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * HPTI / ECCP MULTI-SECTOR CAREER ALIGNMENT ENGINE (OPTION C HYBRID)
 * Maps 144 Archetypes × 38 NCVET Sectors via Swabhava Competency Lens
 * Pre-caches Top 12 Flagships + Dynamic PostgreSQL Fallback
 * ══════════════════════════════════════════════════════════════════
 */

const TOP_FLAGSHIP_SECTORS = [
  { id: 'aerospace', name: 'Aerospace, Aviation & Defense', council: 'Aerospace & Aviation SSC (AASSC)', icon: '🚀' },
  { id: 'it_ai', name: 'IT-ITeS & Artificial Intelligence', council: 'IT-ITeS SSC (NASSCOM)', icon: '💻' },
  { id: 'healthcare', name: 'Healthcare & Life Sciences', council: 'Healthcare Sector Skill Council (HSSC)', icon: '🏥' },
  { id: 'bfsi', name: 'BFSI & Capital Markets', council: 'BFSI Sector Skill Council', icon: '📈' },
  { id: 'management', name: 'Management & Governance', council: 'Management & Entrepreneurship SSC (MEPSC)', icon: '🏛️' },
  { id: 'green_energy', name: 'Green Energy & Sustainability', council: 'Skill Council for Green Jobs (SCGJ)', icon: '🌱' },
  { id: 'logistics', name: 'Logistics & Global Supply Chain', council: 'Logistics Sector Skill Council (LSC)', icon: '🚢' },
  { id: 'automotive', name: 'Automotive & Future Mobility', council: 'Automotive Skills Development Council (ASDC)', icon: '⚡' },
  { id: 'electronics', name: 'Electronics & Semiconductors', council: 'Electronics Sector Skills Council (ESSCI)', icon: '🔬' },
  { id: 'infrastructure', name: 'Infrastructure & Construction', council: 'Construction Skill Development Council (CSDC)', icon: '🏗️' },
  { id: 'media', name: 'Media, Gaming & Entertainment', council: 'Media & Entertainment Skills Council (MESC)', icon: '🎬' },
  { id: 'agriculture', name: 'Agriculture & Agri-Tech', council: 'Agriculture Skill Council of India (ASCI)', icon: '🌾' }
];

// Curated Flagship Alignments for the 4 Varna-Competency Swabhavas
const FLAGSHIP_ALIGNMENTS = {
  // ══════════════════════════════════════════════════════════════════
  // BRAHMANA (Deep Science, Law, Ethics, Systems, Theoretical Models)
  // ══════════════════════════════════════════════════════════════════
  Brahmana: {
    aerospace: {
      swabhava_role: 'Chief Aerodynamic Systems & Computational Modeler',
      nsqf_level: 9,
      qp_code: 'AAS/Q1102',
      us_onet_code: '17-2011.00',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      aligned_careers: [
        'Chief Aerodynamic Systems & Propulsion Modeler (AAS/Q1102 - NSQF L9)',
        'Avionics Mission-Critical Software Architect (AAS/Q1103 - NSQF L9)',
        'Orbital Mechanics & Deep Space Trajectory Theorist (AAS/Q1105 - NSQF L8)',
        'Aviation Regulatory & Flight Safety Compliance Director (AAS/Q1106 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Aerospace through abstract mathematics, orbital physics, and sovereign safety verification.'
    },
    it_ai: {
      swabhava_role: 'Principal Artificial Intelligence Research Scientist',
      nsqf_level: 10,
      qp_code: 'SSC/Q8108',
      us_onet_code: '15-1221.00',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      aligned_careers: [
        'Principal Artificial Intelligence Research Scientist (SSC/Q8108 - NSQF L10)',
        'Data Science & Algorithmic Modeling Lead (SSC/Q2102 - NSQF L8)',
        'Algorithmic Ethicist & AI Governance Architect (SSC/Q8112 - NSQF L9)',
        'Quantum Computing Algorithm Design Theorist (SSC/Q8115 - NSQF L9)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in AI through first-principles theoretical modeling, foundational research, and ethical cognitive governance.'
    },
    healthcare: {
      swabhava_role: 'Director of Bioethics & Clinical Genomic Research',
      nsqf_level: 9,
      qp_code: 'LFS/Q2309',
      us_onet_code: '19-1029.00',
      ssc_council: 'Healthcare & Life Sciences SSC (LSSSDC)',
      aligned_careers: [
        'Director of Bioethics & Clinical Research Governance (LFS/Q2309 - NSQF L9)',
        'Senior Epidemiologist & Genomic Data Investigator (HSS/Q5104 - NSQF L8)',
        'Molecular Diagnostics & Drug Discovery Theorist (LFS/Q2310 - NSQF L9)',
        'Medical Device Regulatory Science Architect (LFS/Q2312 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Healthcare by decoding biological tattvas and safeguarding medical ethics against commercial debasement.'
    },
    bfsi: {
      swabhava_role: 'Quantitative Financial Modeler & Risk Theorist',
      nsqf_level: 9,
      qp_code: 'BFS/Q4102',
      us_onet_code: '13-2051.00',
      ssc_council: 'BFSI Sector Skill Council',
      aligned_careers: [
        'Quantitative Financial Modeler & Algorithmic Risk Theorist (BFS/Q4102 - NSQF L9)',
        'Chief Macroeconomic & Sovereign Debt Strategist (BFS/Q4103 - NSQF L9)',
        'Financial Forensics & Systemic Solvency Investigator (BFS/Q4105 - NSQF L8)',
        'Actuarial Science & Climate Risk Modeling Lead (BFS/Q4107 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in BFSI through mathematical rigor, discovering systemic vulnerabilities before markets collapse.'
    },
    management: {
      swabhava_role: 'Chief Constitutional & Regulatory Policy Architect',
      nsqf_level: 10,
      qp_code: 'MEP/Q0214',
      us_onet_code: '23-1011.00',
      ssc_council: 'Management & Entrepreneurship SSC (MEPSC)',
      aligned_careers: [
        'Chief Constitutional & Regulatory Policy Architect (MEP/Q0214 - NSQF L10)',
        'Institutional Integrity Ombudsperson & Arbiter (MEP/Q0215 - NSQF L9)',
        'Curriculum Architect & Cognitive Pedagogy Specialist (MEP/Q3105 - NSQF L8)',
        'Executive Governance Strategy Think-Tank Lead (MEP/Q0218 - NSQF L9)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Governance like Vidura: upholding eternal Dharma, institutional integrity, and constitutional clarity.'
    },
    green_energy: {
      swabhava_role: 'Renewable Grid Decarbonization & Systems Modeler',
      nsqf_level: 8,
      qp_code: 'SGJ/Q0101',
      us_onet_code: '17-2199.11',
      ssc_council: 'Skill Council for Green Jobs (SCGJ)',
      aligned_careers: [
        'Renewable Grid Decarbonization & Systems Modeler (SGJ/Q0101 - NSQF L8)',
        'Carbon Accounting & Global Climate Policy Scientist (SGJ/Q0102 - NSQF L8)',
        'Hydrogen Fuel Cell Energy Density Theorist (SGJ/Q0105 - NSQF L8)',
        'Environmental Impact Assessment & Ecology Fellow (SGJ/Q0107 - NSQF L7)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Sustainability by harmonizing human technological output with cosmic ecological laws (Rta).'
    },
    logistics: {
      swabhava_role: 'Multimodal Freight Optimization Theorist',
      nsqf_level: 8,
      qp_code: 'LOG/Q7101',
      us_onet_code: '15-2031.00',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      aligned_careers: [
        'Multimodal Freight Optimization Theorist (LOG/Q7101 - NSQF L8)',
        'Predictive Route Network & Graph Algorithm Lead (LOG/Q7102 - NSQF L8)',
        'Customs International Trade Compliance Architect (LOG/Q7104 - NSQF L8)',
        'Supply Chain Resilience & Risk Modeling Scientist (LOG/Q7105 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Logistics by resolving complex topological routing graphs and reducing civilizational friction.'
    },
    automotive: {
      swabhava_role: 'Autonomous Driving Algorithm & Sensor Fusion Scientist',
      nsqf_level: 8,
      qp_code: 'ASC/Q6101',
      us_onet_code: '17-2141.00',
      ssc_council: 'Automotive Skills Development Council (ASDC)',
      aligned_careers: [
        'Autonomous Driving Algorithm & Sensor Fusion Scientist (ASC/Q6101 - NSQF L8)',
        'EV Powertrain Thermal Modeling Architect (ASC/Q6103 - NSQF L8)',
        'Automotive Telemetry & Cyber-Physical Systems Lead (ASC/Q6105 - NSQF L8)',
        'Battery Chemistry & Electrochemical Aging Theorist (ASC/Q6107 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Mobility by synthesizing perception, predictive physics, and failsafe control theory.'
    },
    electronics: {
      swabhava_role: 'VLSI Silicon Architecture & Quantum Circuit Theorist',
      nsqf_level: 9,
      qp_code: 'ELE/Q7101',
      us_onet_code: '17-2072.00',
      ssc_council: 'Electronics Sector Skills Council (ESSCI)',
      aligned_careers: [
        'VLSI Silicon Architecture & Quantum Circuit Theorist (ELE/Q7101 - NSQF L9)',
        'Semiconductor Physics & Cleanroom Process Scientist (ELE/Q7102 - NSQF L8)',
        'Embedded Cryptographic ASIC Design Specialist (ELE/Q7104 - NSQF L8)',
        'Microwave Radar & Advanced RF Waveguide Lead (ELE/Q7106 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Silicon by engraving logic onto matter at nanometer scales.'
    },
    infrastructure: {
      swabhava_role: 'Seismic Structural Modeler & Urban Architect',
      nsqf_level: 8,
      qp_code: 'CON/Q1401',
      us_onet_code: '17-2051.00',
      ssc_council: 'Construction Skill Development Council (CSDC)',
      aligned_careers: [
        'Seismic Structural Modeler & Finite Element Theorist (CON/Q1401 - NSQF L8)',
        'Smart City Geospatial Urban Systems Architect (CON/Q1402 - NSQF L8)',
        'Sustainable Green Building Materials Scientist (CON/Q1404 - NSQF L7)',
        'Megaproject Geotechnical & Foundation Risk Lead (CON/Q1406 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Infrastructure by grounding structural stability in eternal principles of Vastu and physics.'
    },
    media: {
      swabhava_role: 'Narrative Ethicist & Classical Mythological Worldbuilder',
      nsqf_level: 8,
      qp_code: 'MES/Q0101',
      us_onet_code: '27-3043.00',
      ssc_council: 'Media & Entertainment Skills Council (MESC)',
      aligned_careers: [
        'Narrative Ethicist & Classical Mythological Worldbuilder (MES/Q0101 - NSQF L8)',
        'Generative AI Aesthetics & Virtual Acoustics Theorist (MES/Q0102 - NSQF L7)',
        'Philosophical Documentary & Investigative Director (MES/Q0104 - NSQF L8)',
        'Cultural Semiotics & Media Ethics Board Arbiter (MES/Q0106 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Media by curating cultural memory, transmitting transcendent ideals through art.'
    },
    agriculture: {
      swabhava_role: 'Agrigenomics Scientist & Soil Microbiome Theorist',
      nsqf_level: 8,
      qp_code: 'AGR/Q7101',
      us_onet_code: '19-1013.00',
      ssc_council: 'Agriculture Skill Council of India (ASCI)',
      aligned_careers: [
        'Agrigenomics Scientist & Soil Microbiome Theorist (AGR/Q7101 - NSQF L8)',
        'Agro-Ecological Sustainability & Hydrology Modeler (AGR/Q7102 - NSQF L8)',
        'Indigenous Seed Preservation & Botanical Geneticist (AGR/Q7104 - NSQF L8)',
        'Agricultural Macro-Policy & Food Security Fellow (AGR/Q7106 - NSQF L8)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Agriculture by decoding the subtle biology of soil, seed, and seasonal cycles.'
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // KSHATRIYA (Executive Leadership, Crisis Resolution, Defense, Strategy)
  // ══════════════════════════════════════════════════════════════════
  Kshatriya: {
    aerospace: {
      swabhava_role: 'Director of Aerospace Defense & Flight Operations',
      nsqf_level: 9,
      qp_code: 'AAS/Q1101',
      us_onet_code: '11-1011.00',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      aligned_careers: [
        'Director of Aerospace Defense & Flight Operations (AAS/Q1101 - NSQF L9)',
        'Strategic Operations Commander (Defense & Aerospace) (AAS/Q1104 - NSQF L9)',
        'High-Stakes Crisis Incident Director (AAS/Q1107 - NSQF L9)',
        'Advanced Weaponry & Missile Guidance Lead Engineer (AAS/Q1108 - NSQF L9)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Aerospace by mastering extreme velocities, decisive command, and sovereign airspace defense.'
    },
    it_ai: {
      swabhava_role: 'Chief Information Security Officer & Cyber Incident Commander',
      nsqf_level: 9,
      qp_code: 'SSC/Q0918',
      us_onet_code: '11-3021.00',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      aligned_careers: [
        'Chief Information Security Officer & Cyber Incident Commander (SSC/Q0918 - NSQF L9)',
        'Cyber Threat Vanguard & Nation-State Attack Arbiter (SSC/Q0919 - NSQF L8)',
        'Mission-Critical SRE Executive Crisis Director (SSC/Q0921 - NSQF L9)',
        'Zero-Trust Defensive Infrastructure Commander (SSC/Q0924 - NSQF L8)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Cyber Defense by standing as an immovable bastion against malicious digital assaults.'
    },
    healthcare: {
      swabhava_role: 'Chief of Emergency Trauma & Critical Care Surgery',
      nsqf_level: 9,
      qp_code: 'HSS/Q8201',
      us_onet_code: '29-1240.00',
      ssc_council: 'Healthcare Sector Skill Council (HSSC)',
      aligned_careers: [
        'Chief of Emergency Trauma & Critical Care Surgery (HSS/Q8201 - NSQF L9)',
        'Hospital Network Disaster Incident Commander (HSS/Q8202 - NSQF L9)',
        'Epidemic Containment & Bio-Defense Taskforce Director (HSS/Q8205 - NSQF L9)',
        'Intensive Care Unit (ICU) Sovereign Lead Intensivist (HSS/Q8207 - NSQF L8)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Medicine by seizing lives from the jaws of death through split-second fearless intervention.'
    },
    bfsi: {
      swabhava_role: 'Chief Risk Officer & Special Situations Turnaround Director',
      nsqf_level: 9,
      qp_code: 'BFS/Q4101',
      us_onet_code: '11-3031.00',
      ssc_council: 'BFSI Sector Skill Council',
      aligned_careers: [
        'Chief Risk Officer & Insolvency Crisis Director (BFS/Q4101 - NSQF L9)',
        'Special Situations Debt Restructuring Commander (BFS/Q4104 - NSQF L9)',
        'Anti-Money Laundering & Enforcement Taskforce Head (BFS/Q4106 - NSQF L8)',
        'High-Stakes Capital Preservation Arbiter (BFS/Q4108 - NSQF L8)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Capital Markets by fearlessly restructuring insolvent enterprises and protecting depositor trust.'
    },
    management: {
      swabhava_role: 'Chief Executive Officer (Strategic Governance & Restructuring)',
      nsqf_level: 10,
      qp_code: 'MEP/Q0101',
      us_onet_code: '11-1021.00',
      ssc_council: 'Management & Entrepreneurship SSC (MEPSC)',
      aligned_careers: [
        'Chief Executive Officer (Strategic Governance & Restructuring) (MEP/Q0101 - NSQF L10)',
        'Managing Director of Enterprise Restructuring & Turnarounds (MEP/Q0102 - NSQF L9)',
        'Corporate Crisis Management & Incident Commander (MEP/Q0105 - NSQF L9)',
        'Boardroom Sovereign Strategy & Execution Arbiter (MEP/Q0108 - NSQF L9)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Corporate Leadership like Arjuna: commanding large forces, bearing heavy duty, and achieving victory.'
    },
    green_energy: {
      swabhava_role: 'High-Voltage Renewable Grid Crisis Commander',
      nsqf_level: 8,
      qp_code: 'SGJ/Q0201',
      us_onet_code: '11-9041.00',
      ssc_council: 'Skill Council for Green Jobs (SCGJ)',
      aligned_careers: [
        'High-Voltage Renewable Grid Crisis Commander (SGJ/Q0201 - NSQF L8)',
        'Hazardous Environmental Containment Director (SGJ/Q0202 - NSQF L8)',
        'National Critical Energy Infrastructure Protection Lead (SGJ/Q0204 - NSQF L8)',
        'Wildfire & Renewable Asset Protection Commander (SGJ/Q0206 - NSQF L7)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Green Jobs by fiercely guarding energy infrastructure and containing hazardous environmental crises.'
    },
    logistics: {
      swabhava_role: 'Deep-Sea Port Crisis Operations Director',
      nsqf_level: 9,
      qp_code: 'LOG/Q7105',
      us_onet_code: '11-3071.00',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      aligned_careers: [
        'Deep-Sea Port Crisis Operations Director (LOG/Q7105 - NSQF L9)',
        'Critical Supply Line Security & Anti-Piracy Vanguard (LOG/Q7106 - NSQF L8)',
        'Aviation Airfreight Emergency Turnaround Lead (LOG/Q7108 - NSQF L8)',
        'National Disaster Logistics Coordination Commander (LOG/Q7110 - NSQF L8)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Logistics by ensuring unbroken supply lifelines through warzones, blockades, and natural disasters.'
    },
    automotive: {
      swabhava_role: 'Extreme Vehicle Dynamics & Safety Command Lead',
      nsqf_level: 7,
      qp_code: 'ASC/Q6102',
      us_onet_code: '17-2141.02',
      ssc_council: 'Automotive Skills Development Council (ASDC)',
      aligned_careers: [
        'Extreme Vehicle Dynamics & Safety Command Lead (ASC/Q6102 - NSQF L7)',
        'Automotive Crash Forensics & Quality Recall Commander (ASC/Q6104 - NSQF L8)',
        'High-Performance Prototype Test Fleet Commander (ASC/Q6106 - NSQF L7)',
        'Autonomous Vehicle Fleet Safety Overlord (ASC/Q6108 - NSQF L8)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Automotive through fearless precision testing and enforcing uncompromised passenger safety.'
    },
    electronics: {
      swabhava_role: 'Semiconductor Fab Yield & Mission-Critical Hardware Director',
      nsqf_level: 8,
      qp_code: 'ELE/Q7105',
      us_onet_code: '17-2071.00',
      ssc_council: 'Electronics Sector Skills Council (ESSCI)',
      aligned_careers: [
        'Semiconductor Fab Yield & Mission-Critical Hardware Director (ELE/Q7105 - NSQF L8)',
        'Defense Radar & Electronic Warfare Systems Commander (ELE/Q7106 - NSQF L8)',
        'Avionics Hardware Hardening & EMP Shielding Lead (ELE/Q7108 - NSQF L8)',
        'Critical Infrastructure SCADA Systems Guardian (ELE/Q7110 - NSQF L7)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Electronics by defending sovereign silicon and shielding vital systems against electronic warfare.'
    },
    infrastructure: {
      swabhava_role: 'High-Risk Megaproject Turnaround Director',
      nsqf_level: 8,
      qp_code: 'CON/Q1405',
      us_onet_code: '11-9021.00',
      ssc_council: 'Construction Skill Development Council (CSDC)',
      aligned_careers: [
        'High-Risk Megaproject Turnaround Director (CON/Q1405 - NSQF L8)',
        'Underground Tunneling & Mountain Defense Works Commander (CON/Q1406 - NSQF L8)',
        'Disaster Reconstruction & Structural Collapse Commander (CON/Q1408 - NSQF L8)',
        'Hydroelectric Dam Safety & Structural Integrity Director (CON/Q1410 - NSQF L8)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Megaprojects by subduing untamed terrain and executing monumental civil works under perilous deadlines.'
    },
    media: {
      swabhava_role: 'Executive Producer & Live Broadcast Crisis Director',
      nsqf_level: 8,
      qp_code: 'MES/Q0201',
      us_onet_code: '27-2012.00',
      ssc_council: 'Media & Entertainment Skills Council (MESC)',
      aligned_careers: [
        'Executive Producer & Live Broadcast Crisis Director (MES/Q0201 - NSQF L8)',
        'War-Zone Investigative Journalism Bureau Chief (MES/Q0202 - NSQF L8)',
        'High-Budget Cinema Production Field Commander (MES/Q0204 - NSQF L7)',
        'National Emergency Public Broadcast Controller (MES/Q0207 - NSQF L8)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Media by commanding massive creative crews and conveying courage under the glare of truth.'
    },
    agriculture: {
      swabhava_role: 'National Food Security & Grain Reserve Crisis Director',
      nsqf_level: 8,
      qp_code: 'AGR/Q7802',
      us_onet_code: '11-9013.00',
      ssc_council: 'Agriculture Skill Council of India (ASCI)',
      aligned_careers: [
        'National Food Security & Grain Reserve Crisis Director (AGR/Q7802 - NSQF L8)',
        'Biosecurity & Invasive Crop Pest Incident Commander (AGR/Q7803 - NSQF L8)',
        'Drought Relief & Watershed Command Operations Lead (AGR/Q7805 - NSQF L8)',
        'Commercial Agricultural Sovereign Reserve Arbiter (AGR/Q7807 - NSQF L7)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Agriculture by safeguarding national granaries against famine, geopolitical embargoes, and blights.'
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // VAISHYA (Enterprise Scaling, Capital Allocation, Trade, Commerce)
  // ══════════════════════════════════════════════════════════════════
  Vaishya: {
    aerospace: {
      swabhava_role: 'Commercial Aircraft Leasing & Fleet Procurement Lead',
      nsqf_level: 8,
      qp_code: 'AAS/Q2101',
      us_onet_code: '11-3061.00',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      aligned_careers: [
        'Commercial Aircraft Leasing & Fleet Procurement Lead (AAS/Q2101 - NSQF L8)',
        'Aviation Maintenance Enterprise Operations Director (AAS/Q2102 - NSQF L8)',
        'Airline Network Yield & Revenue Optimization Partner (AAS/Q2104 - NSQF L8)',
        'Space Economy Venture Capital & Commercialization Partner (AAS/Q2106 - NSQF L8)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Aviation by constructing sustainable commercial airlines and expanding aerospace capital.'
    },
    it_ai: {
      swabhava_role: 'Enterprise SaaS Commercialization Director',
      nsqf_level: 8,
      qp_code: 'SSC/Q0501',
      us_onet_code: '11-2022.00',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      aligned_careers: [
        'Enterprise SaaS Commercialization Director (SSC/Q0501 - NSQF L8)',
        'Global Tech Alliances & Product Portfolio Partner (SSC/Q0502 - NSQF L8)',
        'Cloud Marketplace & Software Revenue Operations Lead (SSC/Q0504 - NSQF L8)',
        'AI Product Incubator & Commercial Venture Head (SSC/Q0506 - NSQF L8)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Tech by turning intangible algorithms into thriving, compounding civilizational utility.'
    },
    healthcare: {
      swabhava_role: 'Healthcare Venture Capital Lead & Hospital Chain Operator',
      nsqf_level: 8,
      qp_code: 'HSS/Q2201',
      us_onet_code: '11-9111.00',
      ssc_council: 'Healthcare Sector Skill Council (HSSC)',
      aligned_careers: [
        'Healthcare Venture Capital Lead & Hospital Chain Operator (HSS/Q2201 - NSQF L8)',
        'Global Pharmaceutical Supply Chain Architect (LFS/Q3101 - NSQF L8)',
        'Medical Device Commercialization & Licensing Director (LFS/Q3103 - NSQF L8)',
        'Health-Tech Product Distribution & Scaling Partner (HSS/Q2204 - NSQF L7)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Healthcare by making life-saving treatments accessible, affordable, and sustainably funded.'
    },
    bfsi: {
      swabhava_role: 'Chief Investment Officer & Sovereign Capital Lead',
      nsqf_level: 10,
      qp_code: 'BFS/Q4101',
      us_onet_code: '11-3031.02',
      ssc_council: 'BFSI Sector Skill Council',
      aligned_careers: [
        'Chief Investment Officer & Sovereign Capital Lead (BFS/Q4101 - NSQF L10)',
        'Venture Capital Portfolio Director (BFS/Q2204 - NSQF L8)',
        'Private Equity Buyout & Enterprise Value Partner (BFS/Q2206 - NSQF L9)',
        'Algorithmic Market Making & Liquidity Director (BFS/Q2208 - NSQF L9)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Finance by stewarding capital as Lakshmi: allocating wealth to fertile, righteous enterprises.'
    },
    management: {
      swabhava_role: 'Managing Director of Strategic Alliances & Ecosystem Scale',
      nsqf_level: 9,
      qp_code: 'MEP/Q0402',
      us_onet_code: '11-1021.00',
      ssc_council: 'Management & Entrepreneurship SSC (MEPSC)',
      aligned_careers: [
        'Managing Director of Strategic Alliances & Ecosystem Scale (MEP/Q0402 - NSQF L9)',
        'Mergers & Acquisitions Execution Partner (MEP/Q0403 - NSQF L8)',
        'Global Franchise & Enterprise Licensing Director (MEP/Q0405 - NSQF L8)',
        'Corporate Venture Studio General Partner (MEP/Q0408 - NSQF L9)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Enterprise by weaving fragmented businesses into powerful, mutually flourishing ecosystems.'
    },
    green_energy: {
      swabhava_role: 'Green Energy Project Finance & Infrastructure Lead',
      nsqf_level: 8,
      qp_code: 'SGJ/Q0301',
      us_onet_code: '13-2051.00',
      ssc_council: 'Skill Council for Green Jobs (SCGJ)',
      aligned_careers: [
        'Green Energy Project Finance & Solar Infrastructure Lead (SGJ/Q0301 - NSQF L8)',
        'Clean-Tech Venture Partner & Energy Trader (SGJ/Q0302 - NSQF L8)',
        'Carbon Offsets Commercialization Director (SGJ/Q0304 - NSQF L8)',
        'Circular Economy Materials Recycling Venture Head (SGJ/Q0306 - NSQF L7)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Sustainability by proving that ecological restoration can generate superior long-term returns.'
    },
    logistics: {
      swabhava_role: 'Global Supply Chain & Multimodal Freight Architect',
      nsqf_level: 9,
      qp_code: 'LOG/Q7108',
      us_onet_code: '11-3071.04',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      aligned_careers: [
        'Global Supply Chain & Multimodal Freight Architect (LOG/Q7108 - NSQF L9)',
        'International Maritime Trade & Vessel Chartering Partner (LOG/Q7109 - NSQF L8)',
        'E-Commerce Omnichannel Fulfillment Network Director (LOG/Q7111 - NSQF L8)',
        'Cold-Chain Commercial Procurement Principal (LOG/Q7113 - NSQF L7)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Logistics by circulating goods like prana across continents with optimal speed and minimum cost.'
    },
    automotive: {
      swabhava_role: 'Global Automotive OEM Sourcing & Dealer Principal',
      nsqf_level: 8,
      qp_code: 'ASC/Q2101',
      us_onet_code: '11-3051.00',
      ssc_council: 'Automotive Skills Development Council (ASDC)',
      aligned_careers: [
        'Global Automotive OEM Sourcing & Dealer Network Principal (ASC/Q2101 - NSQF L8)',
        'EV Fleet Electrification Commercialization Partner (ASC/Q2102 - NSQF L8)',
        'Automotive Aftermarket Distribution Franchisor (ASC/Q2104 - NSQF L7)',
        'Mobility-as-a-Service (MaaS) Commercial Lead (ASC/Q2106 - NSQF L8)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Mobility by organizing the vast vendor supply networks that make mass transit viable.'
    },
    electronics: {
      swabhava_role: 'Global Chip Fab Component Sourcing & Fabless Partner',
      nsqf_level: 8,
      qp_code: 'ELE/Q2101',
      us_onet_code: '11-3061.00',
      ssc_council: 'Electronics Sector Skills Council (ESSCI)',
      aligned_careers: [
        'Global Chip Fab Component Sourcing & Fabless Lead (ELE/Q2101 - NSQF L8)',
        'Electronics Hardware Commercialization Partner (ELE/Q2102 - NSQF L8)',
        'Semiconductor Supply Chain Sourcing Director (ELE/Q2104 - NSQF L8)',
        'Consumer Electronics Product Lifecycle Head (ELE/Q2106 - NSQF L7)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Semiconductors by securing rare minerals, foundry slots, and worldwide retail distribution.'
    },
    infrastructure: {
      swabhava_role: 'Infrastructure PPP Concession & Project Finance Lead',
      nsqf_level: 8,
      qp_code: 'CON/Q2101',
      us_onet_code: '13-2051.00',
      ssc_council: 'Construction Skill Development Council (CSDC)',
      aligned_careers: [
        'Infrastructure PPP Concession & Project Finance Lead (CON/Q2101 - NSQF L8)',
        'Real Estate Development Commercial Syndicator (CON/Q2102 - NSQF L8)',
        'Highway Tollways & Logistics Hub Concessionaire (CON/Q2104 - NSQF L8)',
        'Smart Cities Commercial Infrastructure Asset Partner (CON/Q2106 - NSQF L8)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Construction by structuring multi-billion dollar public-private partnerships that erect modern cities.'
    },
    media: {
      swabhava_role: 'Commercial Media Licensing & Global IP Distribution Lead',
      nsqf_level: 7,
      qp_code: 'MES/Q0205',
      us_onet_code: '11-2011.00',
      ssc_council: 'Media & Entertainment Skills Council (MESC)',
      aligned_careers: [
        'Commercial Media Licensing & Global IP Distribution Lead (MES/Q0205 - NSQF L7)',
        'Film Studio Financing & International Syndication Principal (MES/Q0206 - NSQF L8)',
        'Digital Gaming Monetization & Live-Ops Director (MES/Q0208 - NSQF L7)',
        'Talent Management Agency Founder & Media Partner (MES/Q0210 - NSQF L8)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Media by transforming creative inspiration into enduring, globally monetized cultural franchises.'
    },
    agriculture: {
      swabhava_role: 'Commercial Agri-Business & Commodity Trading Lead',
      nsqf_level: 8,
      qp_code: 'AGR/Q7801',
      us_onet_code: '11-9013.01',
      ssc_council: 'Agriculture Skill Council of India (ASCI)',
      aligned_careers: [
        'Commercial Agri-Business & Commodity Trading Lead (AGR/Q7801 - NSQF L8)',
        'Farm-to-Fork Direct Supply Chain Scaling Founder (AGR/Q7804 - NSQF L8)',
        'Cold-Chain Agricultural Storage & Warehouse Arbitrageur (AGR/Q7806 - NSQF L7)',
        'Agri-Fintech Credit & Crop Insurance Underwriting Head (AGR/Q7808 - NSQF L8)'
      ],
      swadharma_directive: 'Your Vaishya ingenuity manifests in Agriculture by connecting rural cultivators to fair global markets and eliminating predatory middlemen.'
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // SHUDRA (Direct Fabrication, Tool Mastery, Systems Reliability, Craft)
  // ══════════════════════════════════════════════════════════════════
  Shudra: {
    aerospace: {
      swabhava_role: 'Lead Aircraft Structural Fabrication Specialist',
      nsqf_level: 7,
      qp_code: 'AAS/Q3104',
      us_onet_code: '51-2011.00',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      aligned_careers: [
        'Lead Aircraft Structural Fabrication Specialist (AAS/Q3104 - NSQF L7)',
        'Precision Turbine Propulsion Overhaul Master (AAS/Q3105 - NSQF L6)',
        'Aerospace Composite Layup & Vacuum Bagging Artisan (AAS/Q3107 - NSQF L6)',
        'Avionics Wire Harness & Micro-Soldering Specialist (AAS/Q3109 - NSQF L5)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Aerospace through exquisite manual precision, holding airframes together under supersonic friction.'
    },
    it_ai: {
      swabhava_role: 'Principal Site Reliability & Datacenter Infrastructure Master',
      nsqf_level: 8,
      qp_code: 'SSC/Q6702',
      us_onet_code: '15-1244.00',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      aligned_careers: [
        'Principal Site Reliability & Datacenter Infrastructure Master (SSC/Q6702 - NSQF L8)',
        'High-Performance Cloud Cluster Craftsman & Tuner (SSC/Q6703 - NSQF L7)',
        'Hardware Firmware Flashing & Diagnostic Master (SSC/Q6705 - NSQF L6)',
        'Automated Testing Harness & Build Tooling Specialist (SSC/Q6708 - NSQF L6)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Tech like Vishwakarma: building the physical servers, cables, and kernel code that sustain the internet.'
    },
    healthcare: {
      swabhava_role: 'Specialized Operating Theatre & Surgical Technologist',
      nsqf_level: 6,
      qp_code: 'HSS/Q5101',
      us_onet_code: '29-2055.00',
      ssc_council: 'Healthcare Sector Skill Council (HSSC)',
      aligned_careers: [
        'Specialized Operating Theatre & Surgical Technologist (HSS/Q5101 - NSQF L6)',
        'Advanced Radiotherapy & Medical Imaging Systems Specialist (HSS/Q5102 - NSQF L6)',
        'Cardiac Catheterization Laboratory Technologist (HSS/Q5104 - NSQF L6)',
        'Dialysis & Extracorporeal Membrane Oxygenation (ECMO) Lead (HSS/Q5107 - NSQF L5)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Medicine through flawless mechanical stewardship of life-support apparatus inside the sterile field.'
    },
    bfsi: {
      swabhava_role: 'High-Frequency Financial Systems Engineer',
      nsqf_level: 7,
      qp_code: 'BFS/Q6101',
      us_onet_code: '15-1252.00',
      ssc_council: 'BFSI Sector Skill Council',
      aligned_careers: [
        'High-Frequency Financial Systems Engineer (BFS/Q6101 - NSQF L7)',
        'Core Banking Real-Time Settlement System Master (BFS/Q6102 - NSQF L6)',
        'ATM Network Hardware & Biometric Security Specialist (BFS/Q6104 - NSQF L5)',
        'Financial Ledger Database Tuning Craftsman (BFS/Q6106 - NSQF L6)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Banking by maintaining zero-packet-loss ledger hardware and sub-microsecond transaction reliability.'
    },
    management: {
      swabhava_role: 'Operations Excellence & Lean Process Master',
      nsqf_level: 7,
      qp_code: 'MEP/Q1201',
      us_onet_code: '13-1081.00',
      ssc_council: 'Management & Entrepreneurship SSC (MEPSC)',
      aligned_careers: [
        'Operations Excellence & Lean Process Master (MEP/Q1201 - NSQF L7)',
        'Enterprise Resource Planning (ERP) Systems Lead (MEP/Q1202 - NSQF L7)',
        'Corporate Facility Critical Infrastructure Manager (MEP/Q1204 - NSQF L6)',
        'Physical Security & Executive Protection Logistics Lead (MEP/Q1206 - NSQF L6)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Organizations by eliminating physical bottlenecks and keeping the daily machinery humming without a hitch.'
    },
    green_energy: {
      swabhava_role: 'Solar Photovoltaic Grid Automation Specialist',
      nsqf_level: 6,
      qp_code: 'SGJ/Q0401',
      us_onet_code: '47-2231.00',
      ssc_council: 'Skill Council for Green Jobs (SCGJ)',
      aligned_careers: [
        'Solar Photovoltaic Grid Automation Specialist (SGJ/Q0401 - NSQF L6)',
        'Wind Turbine Electromechanical Overhaul Master (SGJ/Q0402 - NSQF L6)',
        'Lithium-Ion Battery Cell Pack Welding Artisan (SGJ/Q0404 - NSQF L5)',
        'Micro-Hydroelectric Turbine Maintenance Specialist (SGJ/Q0407 - NSQF L5)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Clean Energy by climbing towers, rewiring solar banks, and anchoring green power onto the physical grid.'
    },
    logistics: {
      swabhava_role: 'Automated Cold-Chain Robotics Master',
      nsqf_level: 6,
      qp_code: 'LOG/Q5101',
      us_onet_code: '49-9071.00',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      aligned_careers: [
        'Automated Cold-Chain Robotics Master (LOG/Q5101 - NSQF L6)',
        'Containerized Intermodal Terminal Operations Lead (LOG/Q5102 - NSQF L6)',
        'Heavy Rigging & Oversized Cargo Transport Craftsman (LOG/Q5104 - NSQF L5)',
        'Automated Guided Vehicle (AGV) Fleet Technician (LOG/Q5106 - NSQF L5)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Logistics through hands-on mastery of giant gantry cranes, robotic sorters, and intermodal depots.'
    },
    automotive: {
      swabhava_role: 'Advanced Prototype CNC Machining Specialist',
      nsqf_level: 6,
      qp_code: 'ASC/Q3503',
      us_onet_code: '51-4041.00',
      ssc_council: 'Automotive Skills Development Council (ASDC)',
      aligned_careers: [
        'Advanced Prototype CNC Machining Specialist (ASC/Q3503 - NSQF L6)',
        'High-Voltage Battery Cell Assembly Specialist (ASC/Q3504 - NSQF L6)',
        'Automotive Laser Welding & Robotic Body-in-White Master (ASC/Q3506 - NSQF L5)',
        'Engine Dynamometer Tuning & Emissions Calibration Lead (ASC/Q3508 - NSQF L6)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Automotive by milling engine blocks to micron tolerances and balancing electric motor armatures.'
    },
    electronics: {
      swabhava_role: 'Advanced Micro-Robotics & Surface-Mount Precision Lead',
      nsqf_level: 6,
      qp_code: 'ELE/Q7201',
      us_onet_code: '51-9141.00',
      ssc_council: 'Electronics Sector Skills Council (ESSCI)',
      aligned_careers: [
        'Advanced Micro-Robotics & Surface-Mount Precision Lead (ELE/Q7201 - NSQF L6)',
        'Semiconductor Wafer Dicing & Packaging Specialist (ELE/Q7202 - NSQF L6)',
        'High-Density Interconnect PCB Micro-Fabricator (ELE/Q7204 - NSQF L5)',
        'Automated Optical Inspection & Quality Calibration Master (ELE/Q7207 - NSQF L5)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Electronics by soldering surface-mount micro-chips under high-power microscopes with unshakeable hands.'
    },
    infrastructure: {
      swabhava_role: 'Heavy Earthmoving Automation Specialist & Master Mason',
      nsqf_level: 6,
      qp_code: 'CON/Q0101',
      us_onet_code: '47-2061.00',
      ssc_council: 'Construction Skill Development Council (CSDC)',
      aligned_careers: [
        'Heavy Earthmoving Automation Specialist (CON/Q0101 - NSQF L6)',
        'Precision Precast Concrete Fabrication Craftsman (CON/Q0102 - NSQF L6)',
        'Heritage Stone Carving & Temple Architecture Artisan (HCS/Q4401 - NSQF L7)',
        'High-Rise Tower Crane Sovereign Operator (CON/Q0105 - NSQF L5)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Construction by pouring immortal foundations and carving stone that will endure for a thousand years.'
    },
    media: {
      swabhava_role: 'Unreal Engine Virtual Production & VFX Master',
      nsqf_level: 6,
      qp_code: 'MES/Q0301',
      us_onet_code: '27-1014.00',
      ssc_council: 'Media & Entertainment Skills Council (MESC)',
      aligned_careers: [
        'Unreal Engine Virtual Production & VFX Master (MES/Q0301 - NSQF L6)',
        'Classical Acoustic Sound Foley & Instrument Craftsman (MES/Q0302 - NSQF L6)',
        'Digital Colorist & HDR Master Delivery Specialist (MES/Q0304 - NSQF L5)',
        'High-End Cinema Camera Rigging & Drone Operator (MES/Q0307 - NSQF L5)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Media by rendering real-time photorealistic pixels and engineering acoustic purity for the silver screen.'
    },
    agriculture: {
      swabhava_role: 'Autonomous Precision Drip Irrigation & Agri-Robotics Technologist',
      nsqf_level: 6,
      qp_code: 'AGR/Q1101',
      us_onet_code: '45-2091.00',
      ssc_council: 'Agriculture Skill Council of India (ASCI)',
      aligned_careers: [
        'Autonomous Precision Drip Irrigation & Agri-Robotics Lead (AGR/Q1101 - NSQF L6)',
        'Heritage Food Fermentation & Processing Master (FIC/Q0101 - NSQF L6)',
        'Greenhouse Climate Control & Hydroponics Specialist (AGR/Q1103 - NSQF L5)',
        'Combine Harvester & Agricultural Drone Pilot (AGR/Q1105 - NSQF L5)'
      ],
      swadharma_directive: 'Your Shudra mastery manifests in Agriculture by feeding the nation with hands in the living soil and eyes on solar-powered sensors.'
    }
  }
};

/**
 * Extracts normalized Competency (Brahmana, Kshatriya, Vaishya, Shudra) from code or text
 */
function extractCompetency(codeOrText) {
  if (!codeOrText) return 'Brahmana';
  const str = String(codeOrText).toUpperCase();
  if (str.includes('KSHATRIYA') || str.endsWith('-K-D') || str.endsWith('-K-A') || str.endsWith('-K-K') || str.endsWith('-K-M') || str.includes('-K-')) return 'Kshatriya';
  if (str.includes('VAISHYA') || str.endsWith('-V-D') || str.endsWith('-V-A') || str.endsWith('-V-K') || str.endsWith('-V-M') || str.includes('-V-')) return 'Vaishya';
  if (str.includes('SHUDRA') || str.endsWith('-S-D') || str.endsWith('-S-A') || str.endsWith('-S-K') || str.endsWith('-S-M') || str.includes('-S-')) return 'Shudra';
  return 'Brahmana';
}

/**
 * Get available sectors (Top 12 Flagships + all distinct from nsqf_qps)
 */
async function getAvailableSectors(db) {
  const flagships = TOP_FLAGSHIP_SECTORS.map(f => ({
    ...f,
    is_flagship: true
  }));

  let allSectors = [];
  try {
    if (db && typeof db.query === 'function') {
      const res = await db.query(`
        SELECT sector, COUNT(*) as count 
        FROM nsqf_qps 
        WHERE sector IS NOT NULL AND TRIM(sector) != '' 
        GROUP BY sector 
        ORDER BY count DESC
      `);
      allSectors = res.rows.map(r => ({
        id: r.sector.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        name: r.sector,
        council: `${r.sector} Sector Skill Council`,
        count: parseInt(r.count, 10),
        is_flagship: false
      }));
    }
  } catch (err) {
    console.error('Error fetching sectors from DB:', err.message);
  }

  // Merge, ensuring flagships appear first and no duplicates
  const seen = new Set();
  const unified = [];

  for (const f of flagships) {
    unified.push(f);
    seen.add(f.name.toLowerCase());
  }

  for (const s of allSectors) {
    const norm = s.name.toLowerCase();
    // Check if closely matches a flagship
    const matchesFlagship = flagships.some(f => norm.includes(f.id) || f.name.toLowerCase().includes(norm));
    if (!seen.has(norm) && !matchesFlagship) {
      unified.push(s);
      seen.add(norm);
    }
  }

  return unified;
}

/**
 * Get career alignment for an archetype and sector
 */
async function getCareersForSector(eccpCode, sectorKey, db) {
  const competency = extractCompetency(eccpCode);
  const cleanSectorKey = String(sectorKey || 'aerospace').trim().toLowerCase();

  // 1. Check Flagship Curated Alignments
  const compAlignments = FLAGSHIP_ALIGNMENTS[competency] || FLAGSHIP_ALIGNMENTS.Brahmana;
  
  // Find matching flagship by id or substring
  let matchedFlagshipKey = null;
  for (const f of TOP_FLAGSHIP_SECTORS) {
    if (f.id === cleanSectorKey || 
        f.name.toLowerCase().includes(cleanSectorKey) || 
        cleanSectorKey.includes(f.id) ||
        cleanSectorKey.includes(f.name.toLowerCase().split(' ')[0])) {
      matchedFlagshipKey = f.id;
      break;
    }
  }

  if (matchedFlagshipKey && compAlignments[matchedFlagshipKey]) {
    const data = compAlignments[matchedFlagshipKey];
    const flagshipMeta = TOP_FLAGSHIP_SECTORS.find(f => f.id === matchedFlagshipKey) || {};
    return {
      success: true,
      is_flagship: true,
      sector_id: matchedFlagshipKey,
      sector_name: flagshipMeta.name || matchedFlagshipKey,
      ssc_council: data.ssc_council,
      swabhava_role: data.swabhava_role,
      nsqf_level: data.nsqf_level,
      qp_code: data.qp_code,
      us_onet_code: data.us_onet_code,
      aligned_careers: data.aligned_careers,
      swadharma_directive: data.swadharma_directive
    };
  }

  // 2. Dynamic Fallback against PostgreSQL nsqf_qps table
  if (db && typeof db.query === 'function') {
    try {
      const qpRes = await db.query(`
        SELECT qp_code, qp_name, nsqf_level, sector, sub_sector 
        FROM nsqf_qps 
        WHERE sector ILIKE $1 OR sub_sector ILIKE $1
        ORDER BY CAST(NULLIF(regexp_replace(nsqf_level, '[^0-9.]', '', 'g'), '') AS NUMERIC) DESC NULLS LAST 
        LIMIT 6
      `, [`%${sectorKey}%`]);

      if (qpRes.rows && qpRes.rows.length > 0) {
        const topRow = qpRes.rows[0];
        const numLevel = parseFloat(String(topRow.nsqf_level).replace(/[^0-9.]/g, '')) || 7;
        const careers = qpRes.rows.slice(0, 4).map(r => 
          `${r.qp_name} (${r.qp_code} - NSQF L${r.nsqf_level || 7})`
        );

        return {
          success: true,
          is_flagship: false,
          sector_id: sectorKey.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          sector_name: topRow.sector || sectorKey,
          ssc_council: `${topRow.sector} Sector Skill Council`,
          swabhava_role: `${competency} Sovereign Lead (${topRow.sector})`,
          nsqf_level: numLevel,
          qp_code: topRow.qp_code,
          us_onet_code: '11-1021.00',
          aligned_careers: careers,
          swadharma_directive: `Your innate ${competency} swabhava expressed through certified ${topRow.sector} national qualifications.`
        };
      }
    } catch (err) {
      console.error('Dynamic DB sector query failed:', err.message);
    }
  }

  // 3. Graceful fallback to Aerospace default
  const defaultData = compAlignments.aerospace;
  return {
    success: true,
    is_flagship: true,
    sector_id: 'aerospace',
    sector_name: 'Aerospace, Aviation & Defense',
    ssc_council: defaultData.ssc_council,
    swabhava_role: defaultData.swabhava_role,
    nsqf_level: defaultData.nsqf_level,
    qp_code: defaultData.qp_code,
    us_onet_code: defaultData.us_onet_code,
    aligned_careers: defaultData.aligned_careers,
    swadharma_directive: defaultData.swadharma_directive
  };
}

module.exports = {
  TOP_FLAGSHIP_SECTORS,
  FLAGSHIP_ALIGNMENTS,
  extractCompetency,
  getAvailableSectors,
  getCareersForSector
};
