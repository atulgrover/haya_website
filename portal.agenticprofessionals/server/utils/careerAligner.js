'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * HPTI / ECCP MULTI-SECTOR CAREER ALIGNMENT ENGINE (OPTION C HYBRID)
 * 100% Certified NCVET Qualification Packs from PostgreSQL nsqf_qps
 * Maps 144 Archetypes × 41 NCVET Sectors via Swabhava Competency Lens
 * ══════════════════════════════════════════════════════════════════
 */

const TOP_FLAGSHIP_SECTORS = [
  { id: 'it_ai', name: 'IT-ITeS & Future Tech', dbSector: 'IT-ITeS', council: 'IT-ITeS SSC (NASSCOM)', icon: '💻' },
  { id: 'aerospace', name: 'Aerospace & Aviation', dbSector: 'Aerospace and Aviation', council: 'Aerospace & Aviation SSC (AASSC)', icon: '🚀' },
  { id: 'healthcare', name: 'Healthcare & Life Sciences', dbSector: 'Healthcare', council: 'Healthcare Sector Skill Council (HSSC)', icon: '🏥' },
  { id: 'bfsi', name: 'BFSI & Financial Markets', dbSector: 'BFSI', council: 'BFSI Sector Skill Council', icon: '📈' },
  { id: 'management', name: 'Management & Governance', dbSector: 'Management', council: 'Management & Entrepreneurship SSC (MEPSC)', icon: '🏛️' },
  { id: 'green_energy', name: 'Green Jobs & Sustainability', dbSector: 'Green Jobs', council: 'Skill Council for Green Jobs (SCGJ)', icon: '🌱' },
  { id: 'logistics', name: 'Logistics & Global Supply Chain', dbSector: 'Logistics', council: 'Logistics Sector Skill Council (LSC)', icon: '🚢' },
  { id: 'automotive', name: 'Automotive & Smart Mobility', dbSector: 'Automotive', council: 'Automotive Skills Development Council (ASDC)', icon: '⚡' },
  { id: 'electronics', name: 'Electronics & Semiconductors', dbSector: 'Electronics', council: 'Electronics Sector Skills Council (ESSCI)', icon: '🔬' },
  { id: 'construction', name: 'Construction & Smart Infrastructure', dbSector: 'Construction', council: 'Construction Skill Development Council (CSDC)', icon: '🏗️' },
  { id: 'media', name: 'Media, Gaming & Entertainment', dbSector: 'Media & Entertainment', council: 'Media & Entertainment Skills Council (MESC)', icon: '🎬' },
  { id: 'agriculture', name: 'Agriculture & Agri-Tech', dbSector: 'Agriculture', council: 'Agriculture Skill Council of India (ASCI)', icon: '🌾' }
];

// Curated Certified Alignments for the 4 Varna Swabhavas using REAL NCVET QPs
const FLAGSHIP_ALIGNMENTS = {
  // ══════════════════════════════════════════════════════════════════
  // BRAHMANA (Deep Science, Law, Ethics, Systems Architecture, Data Science)
  // ══════════════════════════════════════════════════════════════════
  Brahmana: {
    it_ai: {
      swabhava_role: 'AI Solution Developer & Theoretical Modeler',
      nsqf_level: 6.0,
      qp_code: 'SSC/Q8108',
      us_onet_code: '15-1221.00',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      db_sector: 'IT-ITeS',
      aligned_careers: [
        'AI Solution developer (SSC/Q8108 - NSQF L6.0)',
        'Data Scientist (SSC/Q8104 - NSQF L6.0)',
        'AI Data Architecture Analyst (SSC/Q8107 - NSQF L6.0)',
        'Blockchain Architect (SSC/Q8702 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in AI through first-principles theoretical modeling, data science rigor, and ethical cognitive governance.'
    },
    aerospace: {
      swabhava_role: 'Technical Services & Avionics Systems Engineer',
      nsqf_level: 5.0,
      qp_code: 'AAS/Q2101',
      us_onet_code: '17-2011.00',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      db_sector: 'Aerospace and Aviation',
      aligned_careers: [
        'Technical Services Engineer (AAS/Q2101 - NSQF L5.0)',
        'Geo-Spatial Surveying Supervisor (SOI/AAS/Q0101 - NSQF L5.0)',
        'Aircraft Maintenance Technician (AAS/Q2009 - NSQF L4.5)',
        'Airport Terminal Operations Supervisor (AAS/Q0614 - NSQF L5.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Aerospace through meticulous technical servicing, telemetry verification, and sovereign flight safety standards.'
    },
    healthcare: {
      swabhava_role: 'Genetic Counselor & Genomic Diagnostics Specialist',
      nsqf_level: 6.5,
      qp_code: 'HSS/Q8705',
      us_onet_code: '29-9092.00',
      ssc_council: 'Healthcare Sector Skill Council (HSSC)',
      db_sector: 'Healthcare',
      aligned_careers: [
        'Genetic Counselor (HSS/Q8705 - NSQF L6.5)',
        'Regulatory Affairs Executive(Ayurveda Siddha Unani) (HSS/Q3702 - NSQF L5.5)',
        'Quality Control and Assurance Executive(Ayurveda Siddha Unani) (HSS/Q3703 - NSQF L5.5)',
        'Ayurveda Dietician (HSS/Q3902 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Healthcare by decoding biological tattvas and safeguarding genomic medicine against ethical compromise.'
    },
    bfsi: {
      swabhava_role: 'Financial Data Analytics & Valuation Specialist',
      nsqf_level: 4.0,
      qp_code: 'BSC/Q4101',
      us_onet_code: '13-2051.00',
      ssc_council: 'BFSI Sector Skill Council',
      db_sector: 'BFSI',
      aligned_careers: [
        'Junior Data Analyst -Financial Services (BSC/Q4101 - NSQF L4.0)',
        'Certificate in Accounting Technicians (CAT) (ICMA/BSC/Q2401 - NSQF L4.0)',
        'GST Assistant (BSC/Q8102 - NSQF L4.0)',
        'Credit Processing Officer (BSC/Q2304 - NSQF L4.5)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in BFSI through mathematical rigor, auditing capital flows, and uncovering institutional systemic risks.'
    },
    management: {
      swabhava_role: 'Environmental Social Governance (ESG) Specialist',
      nsqf_level: 7.0,
      qp_code: 'MEP/Q1104',
      us_onet_code: '11-1011.03',
      ssc_council: 'Management & Entrepreneurship SSC (MEPSC)',
      db_sector: 'Management',
      aligned_careers: [
        'Environmental Social Governance (ESG) Specialist (MEP/Q1104 - NSQF L7.0)',
        'Advance Course in Business Risk Management (MEP/Q0503 - NSQF L6.5)',
        'Instructional Designer (MEP/Q2901 - NSQF L6.0)',
        'CSR and Sustainability Specialist (MEP/Q1101 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Governance like Vidura: upholding eternal Dharma, institutional ESG integrity, and policy clarity.'
    },
    green_energy: {
      swabhava_role: 'Circular Systems Manager & Ecological Modeler',
      nsqf_level: 6.0,
      qp_code: 'SGJ/Q6501',
      us_onet_code: '17-2199.11',
      ssc_council: 'Skill Council for Green Jobs (SCGJ)',
      db_sector: 'Green Jobs',
      aligned_careers: [
        'Circular Systems Manager (SGJ/Q6501 - NSQF L6.0)',
        'Soil Pollution Monitoring Specialist (SGJ/Q6901 - NSQF L5.5)',
        'Environmental Impact Assessor (SGJ/Q5201 - NSQF L5.0)',
        'Waste Optimisation Professional (SGJ/Q5002 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Sustainability by harmonizing technological cycles with cosmic ecological laws (Rta).'
    },
    logistics: {
      swabhava_role: 'Functional Analyst - Warehouse Management Systems (WMS)',
      nsqf_level: 6.0,
      qp_code: 'LSC/Q0501',
      us_onet_code: '15-2031.00',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      db_sector: 'Logistics',
      aligned_careers: [
        'Functional Analyst - WMS (LSC/Q0501 - NSQF L6.0)',
        'Warehouse Data Analyst (LSC/Q0503 - NSQF L6.0)',
        'Transportation Data Analyst (LSC/Q0504 - NSQF L6.0)',
        'Functional Analyst - TMS (LSC/Q0502 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Logistics by resolving complex topological routing graphs and reducing distribution friction.'
    },
    automotive: {
      swabhava_role: 'Automotive Data Science Head & Algorithms Architect',
      nsqf_level: 7.0,
      qp_code: 'ASC/Q6419',
      us_onet_code: '17-2141.00',
      ssc_council: 'Automotive Skills Development Council (ASDC)',
      db_sector: 'Automotive',
      aligned_careers: [
        'Automotive Data Science Head (ASC/Q6419 - NSQF L7.0)',
        'Automotive Open System (AUTOSAR) Engineer (ASC/Q8309 - NSQF L6.0)',
        'Automotive Design Safety Specialist (ASC/Q8310 - NSQF L6.0)',
        'Automotive Manufacturing Data Science Specialist (ASC/Q6417 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Mobility by synthesizing perception, predictive physics, and failsafe control theory.'
    },
    electronics: {
      swabhava_role: 'Semiconductor IC Design & Verification Professional',
      nsqf_level: 6.0,
      qp_code: 'MSU/ELE/Q0201',
      us_onet_code: '17-2072.00',
      ssc_council: 'Electronics Sector Skills Council (ESSCI)',
      db_sector: 'Electronics',
      aligned_careers: [
        'Semiconductor IC Design & Verification Professional (MSU/ELE/Q0201 - NSQF L6.0)',
        'SEMICONDUCTOR PROCESS TECHNOLOGY ENGINEER-UPSKILLING (ELE/Q1406 - NSQF L6.0)',
        'Embedded Software  Engineer (NIE/ELE/Q0201 - NSQF L6.0)',
        'Embedded Product Design - Technical Lead (ELE/Q1403 - NSQF L5.5)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Silicon by engraving computational logic onto matter at nanometer scales.'
    },
    construction: {
      swabhava_role: 'BIM Coordinator - Structural Architecture & Design',
      nsqf_level: 6.0,
      qp_code: 'CON/Q2103',
      us_onet_code: '17-2051.00',
      ssc_council: 'Construction Skill Development Council (CSDC)',
      db_sector: 'Construction',
      aligned_careers: [
        'BIM Coordinator -Design (CON/Q2103 - NSQF L6.0)',
        'Surveyor (CON/Q0902 - NSQF L5.5)',
        'BIM Technician - Object Creation (CON/Q2109 - NSQF L5.0)',
        'BIM Manager - Construction (CON/Q2108 - NSQF L6.5)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Infrastructure by grounding structural stability in eternal mathematical laws and precision modeling.'
    },
    media: {
      swabhava_role: 'Music Composer & Acoustic Director',
      nsqf_level: 7.0,
      qp_code: 'MES/Q1501',
      us_onet_code: '27-2041.00',
      ssc_council: 'Media & Entertainment Skills Council (MESC)',
      db_sector: 'Media & Entertainment',
      aligned_careers: [
        'Music Composer/Director (MES/Q1501 - NSQF L7.0)',
        'Art Director (Animation And Gaming) (MES/Q0501 - NSQF L6.0)',
        'AR-VR Developer (MES/Q0509 - NSQF L6.0)',
        'Music Producer (MES/Q1502 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Media by curating cultural memory, transmitting transcendent ideals through art and sound.'
    },
    agriculture: {
      swabhava_role: 'Digital Agriculture Extension Promoter & Agro-Informatics Lead',
      nsqf_level: 5.5,
      qp_code: 'AGR/Q1010',
      us_onet_code: '19-1013.00',
      ssc_council: 'Agriculture Skill Council of India (ASCI)',
      db_sector: 'Agriculture',
      aligned_careers: [
        'Digital Agriculture Extension Promoter (AGR/Q1010 - NSQF L5.5)',
        'Precision Farming Technician (AGR/Q1007 - NSQF L5.0)',
        'Horticulturist (Protected Cultivation) (AGR/Q1011 - NSQF L5.0)',
        'Agri Commodity Quality Assayer (AGR/Q7902 - NSQF L5.0)'
      ],
      swadharma_directive: 'Your Brahmana intellect manifests in Agriculture by decoding the subtle biology of soil, seed, and data-driven agro-ecology.'
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // KSHATRIYA (Executive Leadership, Crisis Resolution, Defense, Strategy)
  // ══════════════════════════════════════════════════════════════════
  Kshatriya: {
    it_ai: {
      swabhava_role: 'Cloud Security Analyst & Defensive Operations Commander',
      nsqf_level: 6.5,
      qp_code: 'SSC/Q8309',
      us_onet_code: '11-3021.00',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      db_sector: 'IT-ITeS',
      aligned_careers: [
        'Cloud Security Analyst (SSC/Q8309 - NSQF L6.5)',
        'Network Security Engineer (SSC/Q0917 - NSQF L6.0)',
        'Information Security Analyst (SSC/Q0923 - NSQF L6.0)',
        'Cloud Site Reliability Analyst (SSC/Q8307 - NSQF L6.5)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Cyber Defense by standing as an immovable bastion protecting critical cloud infrastructure.'
    },
    aerospace: {
      swabhava_role: 'Airport Terminal Operations Manager & Flight Coordinator',
      nsqf_level: 6.0,
      qp_code: 'AAS/Q0613',
      us_onet_code: '11-1011.00',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      db_sector: 'Aerospace and Aviation',
      aligned_careers: [
        'Airport Terminal Operations Manager (AAS/Q0613 - NSQF L6.0)',
        'Airline First Officer- Ground Level (AAS/Q0606 - NSQF L5.0)',
        'Airline Flight Load Controller (AAS/Q0604 - NSQF L5.0)',
        'Airport Terminal Operations Supervisor (AAS/Q0614 - NSQF L5.0)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Aerospace by mastering flight command, crisis coordination, and passenger security.'
    },
    healthcare: {
      swabhava_role: 'Healthcare Quality Assurance Manager & Hospital Operations Arbiter',
      nsqf_level: 6.0,
      qp_code: 'HSS/Q6106',
      us_onet_code: '11-9111.00',
      ssc_council: 'Healthcare Sector Skill Council (HSSC)',
      db_sector: 'Healthcare',
      aligned_careers: [
        'Healthcare Quality Assurance Manager (HSS/Q6106 - NSQF L6.0)',
        'Transplant Coordinator (HSS/Q8704 - NSQF L6.0)',
        'Duty Manager (Patient Relation Services) (HSS/Q6104 - NSQF L6.0)',
        'Deputy Duty Manager (Patient Relation Services) (HSS/Q6103 - NSQF L5.5)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Healthcare by seizing control during clinical emergencies and upholding uncompromising care standards.'
    },
    bfsi: {
      swabhava_role: 'Credit Processing Officer & Risk Underwriting Commander',
      nsqf_level: 4.5,
      qp_code: 'BSC/Q2304',
      us_onet_code: '13-2072.00',
      ssc_council: 'BFSI Sector Skill Council',
      db_sector: 'BFSI',
      aligned_careers: [
        'Credit Processing Officer (BSC/Q2304 - NSQF L4.5)',
        'Sales Executive (Banking & Finance) (CII/BSC/Q0301 - NSQF L3.5)',
        'Microfinance Executive (BSC/Q2401 - NSQF L3.5)',
        'Junior Data Analyst -Financial Services (BSC/Q4101 - NSQF L4.0)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Capital Markets by decisively assessing creditworthiness and safeguarding institution liquidity.'
    },
    management: {
      swabhava_role: 'Senior Internal Auditor & Enterprise Governance Arbiter',
      nsqf_level: 6.0,
      qp_code: 'MEP/Q1206',
      us_onet_code: '13-2011.02',
      ssc_council: 'Management & Entrepreneurship SSC (MEPSC)',
      db_sector: 'Management',
      aligned_careers: [
        'Senior Internal Auditor (MEP/Q1206 - NSQF L6.0)',
        'Lead Assessor (VET and Skills) (MEP/Q2702 - NSQF L6.0)',
        'Master Trainer (VET and Skills) (MEP/Q2602 - NSQF L6.0)',
        'Advance Course in Business Risk Management (MEP/Q0503 - NSQF L6.5)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Governance by auditing corporate malfeasance and fearlessly imposing regulatory compliance.'
    },
    green_energy: {
      swabhava_role: 'Waste Optimisation Professional & Grid Operations Supervisor',
      nsqf_level: 6.0,
      qp_code: 'SGJ/Q5002',
      us_onet_code: '17-2199.11',
      ssc_council: 'Skill Council for Green Jobs (SCGJ)',
      db_sector: 'Green Jobs',
      aligned_careers: [
        'Waste Optimisation Professional (SGJ/Q5002 - NSQF L6.0)',
        'Rooftop Solar Grid Junior Engineer (SGJ/Q0106 - NSQF L5.0)',
        'Electrolyzer Manufacturing Plant Supervisor (SGJ/Q4305 - NSQF L5.0)',
        'Circular Systems Manager (SGJ/Q6501 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Green Energy by spearheading rapid clean energy grid deployment and industrial waste remediation.'
    },
    logistics: {
      swabhava_role: 'Green Hydrogen Supply Chain - SHEQ Manager & EXIM Commander',
      nsqf_level: 6.0,
      qp_code: 'LSC/Q3906',
      us_onet_code: '11-3071.00',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      db_sector: 'Logistics',
      aligned_careers: [
        'Green Hydrogen Supply Chain - SHEQ Manager (LSC/Q3906 - NSQF L6.0)',
        'EXIM Manager (LSC/Q2120 - NSQF L6.0)',
        'Land Transportation Manager (LSC/Q1004 - NSQF L6.0)',
        'Green Hydrogen Storage Hub Manager (LSC/Q3905 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Logistics through flawless hazardous cargo oversight, customs command, and safety governance.'
    },
    automotive: {
      swabhava_role: 'Automotive Robotics and Automation Manager',
      nsqf_level: 7.0,
      qp_code: 'ASC/Q8306',
      us_onet_code: '17-2141.00',
      ssc_council: 'Automotive Skills Development Council (ASDC)',
      db_sector: 'Automotive',
      aligned_careers: [
        'Automotive Robotics and Automation Manager (ASC/Q8306 - NSQF L7.0)',
        'Automotive Smart Manufacturing Head (ASC/Q6418 - NSQF L7.0)',
        'Automotive Smart Manufacturing Specialist (ASC/Q8308 - NSQF L7.0)',
        'Automotive Robotics System Integrator/Planner (ASC/Q8304 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Automotive by commanding automated robotics assembly lines and executing zero-defect manufacturing.'
    },
    electronics: {
      swabhava_role: 'Quality Manager - Electronics & Building Automation Director',
      nsqf_level: 6.0,
      qp_code: 'ELE/Q7902',
      us_onet_code: '11-3051.01',
      ssc_council: 'Electronics Sector Skills Council (ESSCI)',
      db_sector: 'Electronics',
      aligned_careers: [
        'Quality Manager - Electronics (ELE/Q7902 - NSQF L6.0)',
        'Mechanical Engineering and Plumbing General Manager (Electronics) (ELE/Q7103 - NSQF L6.0)',
        'Building Management System Project Manager (ELE/Q7102 - NSQF L6.0)',
        'Junior Engineer Drone (R & D) (ELE/Q6703 - NSQF L5.5)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Electronics by enforcing military-grade manufacturing standards and failsafe QA protocols.'
    },
    construction: {
      swabhava_role: 'BIM Manager - Construction Megaproject Commander',
      nsqf_level: 6.5,
      qp_code: 'CON/Q2108',
      us_onet_code: '11-9021.00',
      ssc_council: 'Construction Skill Development Council (CSDC)',
      db_sector: 'Construction',
      aligned_careers: [
        'BIM Manager - Construction (CON/Q2108 - NSQF L6.5)',
        'Contract Manager (Construction) (ICE/CON/Q0801 - NSQF L5.5)',
        'Road Construction Engineer (ASP/CON/Q0201 - NSQF L5.5)',
        'Supervisor Structure (Technical) (CON/Q0111 - NSQF L5.5)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Infrastructure by commanding complex infrastructure sites, meeting deadlines under extreme pressure.'
    },
    media: {
      swabhava_role: 'Executive Producer & Media Studio Director',
      nsqf_level: 7.0,
      qp_code: 'MES/Q2801',
      us_onet_code: '27-2012.00',
      ssc_council: 'Media & Entertainment Skills Council (MESC)',
      db_sector: 'Media & Entertainment',
      aligned_careers: [
        'Executive Producer (MES/Q2801 - NSQF L7.0)',
        'AR VR Producer (MES/Q2509 - NSQF L7.0)',
        'Line Producer (MES/Q2802 - NSQF L6.0)',
        'Director Of Photography (MES/Q0901 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Media by marshaling production budgets, technical talent, and creating epoch-defining cinematic works.'
    },
    agriculture: {
      swabhava_role: 'Controlled Atmosphere Store Technician & Logistics Lead',
      nsqf_level: 5.0,
      qp_code: 'AGR/Q7508',
      us_onet_code: '11-9013.00',
      ssc_council: 'Agriculture Skill Council of India (ASCI)',
      db_sector: 'Agriculture',
      aligned_careers: [
        'Controlled Atmosphere Store Technician (AGR/Q7508 - NSQF L5.0)',
        'Custom Hiring Centre In-charge (Agri machinery) (AGR/Q1112 - NSQF L5.0)',
        'Repair and Maintenance Supervisor (Farm Machinery) (AGR/Q1111 - NSQF L5.0)',
        'Poultry feed, food safety and labeling Supervisor (AGR/Q4305 - NSQF L5.0)'
      ],
      swadharma_directive: 'Your Kshatriya valor manifests in Agriculture through resilient food security storage command and modern mechanization networks.'
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // VAISHYA (Enterprise Scaling, Commerce, Trade, Capital Allocation)
  // ══════════════════════════════════════════════════════════════════
  Vaishya: {
    it_ai: {
      swabhava_role: 'Product Manager - Web & Mobile & Cloud Solutions Architect',
      nsqf_level: 6.0,
      qp_code: 'SSC/Q8401',
      us_onet_code: '11-2021.00',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      db_sector: 'IT-ITeS',
      aligned_careers: [
        'Product Manager - Web & Mobile (SSC/Q8401 - NSQF L6.0)',
        'Application Architect - Web & Mobile (SSC/Q8402 - NSQF L6.0)',
        'Cloud Engineer (SSC/Q8302 - NSQF L6.5)',
        'AR/VR Consultant (SSC/Q8801 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Technology by turning raw engineering and AI into high-velocity commercial platforms.'
    },
    aerospace: {
      swabhava_role: 'Airline Reservation Agent & Commercial Aviation Executive',
      nsqf_level: 4.0,
      qp_code: 'AAS/Q0302',
      us_onet_code: '43-4181.00',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      db_sector: 'Aerospace and Aviation',
      aligned_careers: [
        'Airline Reservation Agent (AAS/Q0302 - NSQF L4.0)',
        'Airline Customer Service Executive (AAS/Q0301 - NSQF L4.0)',
        'Airline Ramp Executive (AAS/Q0602 - NSQF L4.0)',
        'Airport Terminal Operations Supervisor (AAS/Q0614 - NSQF L5.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Aviation by maximizing fleet passenger load factors and negotiating route profitability.'
    },
    healthcare: {
      swabhava_role: 'Medical Value Travel Coordinator & Carepreneurship Lead',
      nsqf_level: 5.5,
      qp_code: 'HSS/Q6301',
      us_onet_code: '11-9111.00',
      ssc_council: 'Healthcare Sector Skill Council (HSSC)',
      db_sector: 'Healthcare',
      aligned_careers: [
        'Medical Value Travel Coordinator (HSS/Q6301 - NSQF L5.5)',
        'Carepreneur - Early Child Development (ECD) Services (HSS/Q8903 - NSQF L5.5)',
        'Cupping Therapist (HSS/Q4102 - NSQF L6.0)',
        'Duty Manager (Patient Relation Services) (HSS/Q6104 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Healthcare through medical tourism, patient services, and commercially viable community wellness models.'
    },
    bfsi: {
      swabhava_role: 'Mutual Fund Distributor & Wealth Portfolio Advisor',
      nsqf_level: 4.0,
      qp_code: 'BSC/Q3802',
      us_onet_code: '13-2052.00',
      ssc_council: 'BFSI Sector Skill Council',
      db_sector: 'BFSI',
      aligned_careers: [
        'Mutual Fund Distributor (BSC/Q3802 - NSQF L4.0)',
        'Insurance Agent (BSC/Q3801 - NSQF L3.5)',
        'Customer Service Associate -Financial Services (BSC/Q8406 - NSQF L4.0)',
        'Junior Data Analyst -Financial Services (BSC/Q4101 - NSQF L4.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in BFSI through capital allocation, compounding wealth, and expanding financial literacy across retail investors.'
    },
    management: {
      swabhava_role: 'CSR and Sustainability Specialist & Venture Builder',
      nsqf_level: 6.0,
      qp_code: 'MEP/Q1101',
      us_onet_code: '11-1021.00',
      ssc_council: 'Management & Entrepreneurship SSC (MEPSC)',
      db_sector: 'Management',
      aligned_careers: [
        'CSR and Sustainability Specialist (MEP/Q1101 - NSQF L6.0)',
        'Entrepreneur (Electives: Women Entrepreneurship/ Gender Sensitivity) (MEP/Q5103 - NSQF L5.0)',
        'Deputy Human Resources Manager (MEP/Q0704 - NSQF L5.0)',
        'Design Thinking Executive (MEP/Q0501 - NSQF L5.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Management by establishing resilient ventures that generate abundance while fulfilling social duties.'
    },
    green_energy: {
      swabhava_role: 'Green Hydrogen Plant Entrepreneur & Solar Venture Lead',
      nsqf_level: 5.0,
      qp_code: 'SGJ/Q0121',
      us_onet_code: '11-9041.00',
      ssc_council: 'Skill Council for Green Jobs (SCGJ)',
      db_sector: 'Green Jobs',
      aligned_careers: [
        'Green Hydrogen Plant Entrepreneur (SGJ/Q0121 - NSQF L5.0)',
        'Solar Enterprise Assistant Manager (SGJ/Q2601 - NSQF L5.0)',
        'Solar Water Pumping Junior Engineer (SGJ/Q0112 - NSQF L5.0)',
        'Circular Systems Manager (SGJ/Q6501 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Clean Energy by financing and commercializing green hydrogen and decentralized solar microgrids.'
    },
    logistics: {
      swabhava_role: 'Cold Chain Specialist & Materials Commercial Manager',
      nsqf_level: 6.0,
      qp_code: 'LSC/Q9202',
      us_onet_code: '11-3071.01',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      db_sector: 'Logistics',
      aligned_careers: [
        'Cold Chain Specialist (Green Engineering) (LSC/Q9202 - NSQF L6.0)',
        'Inventory, Materials Manager (LSC/Q0104 - NSQF L6.0)',
        'Warehouse Manager (LSC/Q0103 - NSQF L6.0)',
        'Green Hydrogen Procurement Manager (LSC/Q3303 - NSQF L5.5)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Logistics by maintaining supply chain velocity, reducing spoilage, and capturing margin in cold chains.'
    },
    automotive: {
      swabhava_role: 'Automotive Dealership Data Science Specialist & IIOT Lead',
      nsqf_level: 6.0,
      qp_code: 'ASC/Q1438',
      us_onet_code: '11-2022.00',
      ssc_council: 'Automotive Skills Development Council (ASDC)',
      db_sector: 'Automotive',
      aligned_careers: [
        'Automotive Dealership Data Science Specialist (ASC/Q1438 - NSQF L6.0)',
        'Automotive IIOT Application Specialist (ASC/Q6415 - NSQF L6.0)',
        'Automotive Unified Diagnostics Engineer (ASC/Q1437 - NSQF L6.0)',
        'Automotive Dealership Data Analyst (ASC/Q1436 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Automotive through dealership network analytics, connected telematics, and after-sales service growth.'
    },
    electronics: {
      swabhava_role: 'Industrial IoT and Edge AI Analyst & Business Development Lead',
      nsqf_level: 5.5,
      qp_code: 'ITG/ELE/Q0101',
      us_onet_code: '15-1211.00',
      ssc_council: 'Electronics Sector Skills Council (ESSCI)',
      db_sector: 'Electronics',
      aligned_careers: [
        'Industrial IoT and Edge AI Analyst (ITG/ELE/Q0101 - NSQF L5.5)',
        'Sr. Executive- Business Development (Electronics) (ELE/Q1101 - NSQF L5.0)',
        'Junior Engineer Drone (R & D) (ELE/Q6703 - NSQF L5.5)',
        'Embedded Full Stack IoT Analyst (ELE/Q1404 - NSQF L5.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Electronics by monetizing edge AI hardware and forging OEM component supply contracts.'
    },
    construction: {
      swabhava_role: 'Project Coordinator (Construction) & Real Estate Advisor',
      nsqf_level: 5.5,
      qp_code: 'MSME/CON/Q0901',
      us_onet_code: '11-9021.00',
      ssc_council: 'Construction Skill Development Council (CSDC)',
      db_sector: 'Construction',
      aligned_careers: [
        'PROJECT COORDINATOR (CONSTRUCTION) (MSME/CON/Q0901 - NSQF L5.5)',
        'Real Estate Advisor (ICE/CON/Q0101 - NSQF L5.0)',
        'Junior Store Keeper -Construction (CON/Q1502 - NSQF L4.5)',
        'BIM Manager - Construction (CON/Q2108 - NSQF L6.5)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Real Estate through procurement efficiency, contract negotiations, and high-yield asset delivery.'
    },
    media: {
      swabhava_role: 'Sales Director (Media Org.) & Commercial Account Director',
      nsqf_level: 6.0,
      qp_code: 'MES/Q0201',
      us_onet_code: '11-2011.00',
      ssc_council: 'Media & Entertainment Skills Council (MESC)',
      db_sector: 'Media & Entertainment',
      aligned_careers: [
        'Sales Director (Media Org.) (MES/Q0201 - NSQF L6.0)',
        'Account Director (MES/Q0207 - NSQF L6.0)',
        'Digital Marketing Manager (MES/Q0706 - NSQF L6.0)',
        'Sales Manager (MES/Q0202 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Media through ad-space monetization, brand syndication, and digital marketing leadership.'
    },
    agriculture: {
      swabhava_role: 'Organic Farm & Business Promoter & Dairy Commercial Lead',
      nsqf_level: 5.0,
      qp_code: 'AGR/Q1210',
      us_onet_code: '11-9013.02',
      ssc_council: 'Agriculture Skill Council of India (ASCI)',
      db_sector: 'Agriculture',
      aligned_careers: [
        'Organic Farm & Business Promoter (AGR/Q1210 - NSQF L5.0)',
        'Milk Procurement & Input Supervisor (AGR/Q4201 - NSQF L5.0)',
        'Dairy Farm Supervisor (AGR/Q4103 - NSQF L5.0)',
        'Agri Commodity Quality Assayer (AGR/Q7902 - NSQF L5.0)'
      ],
      swadharma_directive: 'Your Vaishya acumen manifests in Agriculture by organizing farmer producer cooperatives and establishing direct farm-to-fork value chains.'
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // SHUDRA (Direct Mastery of Tools, Precision Craft, Tangible Execution)
  // ══════════════════════════════════════════════════════════════════
  Shudra: {
    it_ai: {
      swabhava_role: 'AI DevOps Analyst & Full Stack Software Developer',
      nsqf_level: 5.0,
      qp_code: 'SSC/Q8112',
      us_onet_code: '15-1252.00',
      ssc_council: 'IT-ITeS SSC (NASSCOM)',
      db_sector: 'IT-ITeS',
      aligned_careers: [
        'AI DevOps Analyst (SSC/Q8112 - NSQF L5.0)',
        'Blockchain Full Stack Developer (SSC/Q8703 - NSQF L5.0)',
        'Software Product Developer (SSC/Q0512 - NSQF L5.0)',
        'RPA Developer (SSC/Q8604 - NSQF L5.5)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Technology through clean continuous deployment pipelines, bug-free codebases, and dependable systems.'
    },
    aerospace: {
      swabhava_role: 'Airline Flight Load Controller & Ground Support Specialist',
      nsqf_level: 5.0,
      qp_code: 'AAS/Q0604',
      us_onet_code: '53-2022.00',
      ssc_council: 'Aerospace & Aviation SSC (AASSC)',
      db_sector: 'Aerospace and Aviation',
      aligned_careers: [
        'Airline Flight Load Controller (AAS/Q0604 - NSQF L5.0)',
        'Airline Ramp Executive (AAS/Q0602 - NSQF L4.0)',
        'Airline Cargo Assistant (AAS/Q0103 - NSQF L3.0)',
        'Airline Security Assistant (AAS/Q0601 - NSQF L3.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Aviation through tactile ground support, air cargo equilibrium, and precision baggage handling.'
    },
    healthcare: {
      swabhava_role: 'General Duty Aide & Patient Care Specialist',
      nsqf_level: 4.0,
      qp_code: 'HSS/Q5101',
      us_onet_code: '31-1131.00',
      ssc_council: 'Healthcare Sector Skill Council (HSSC)',
      db_sector: 'Healthcare',
      aligned_careers: [
        'General Duty Aide (HSS/Q5101 - NSQF L4.0)',
        'Home Health Aide (HSS/Q5102 - NSQF L4.0)',
        'Duty Manager (Patient Relation Services) (HSS/Q6104 - NSQF L6.0)',
        'Cupping Therapist (HSS/Q4102 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Healthcare through selfless compassionate bedside care, assisting physicians and comforting patients.'
    },
    bfsi: {
      swabhava_role: 'Accounts Assistant & GST Filing Technician',
      nsqf_level: 4.0,
      qp_code: 'BSC/Q8103',
      us_onet_code: '43-3031.00',
      ssc_council: 'BFSI Sector Skill Council',
      db_sector: 'BFSI',
      aligned_careers: [
        'Accounts Assistant (BSC/Q8103 - NSQF L4.0)',
        'GST Assistant (BSC/Q8102 - NSQF L4.0)',
        'Certificate in Accounting Technicians (CAT) (ICMA/BSC/Q2401 - NSQF L4.0)',
        'Customer Service Associate -Financial Services (BSC/Q8406 - NSQF L4.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in BFSI through error-free ledger balancing, invoice reconciliation, and tax documentation precision.'
    },
    management: {
      swabhava_role: 'Design Thinking Executive & Office Operations Specialist',
      nsqf_level: 5.0,
      qp_code: 'MEP/Q0501',
      us_onet_code: '43-6014.00',
      ssc_council: 'Management & Entrepreneurship SSC (MEPSC)',
      db_sector: 'Management',
      aligned_careers: [
        'Design Thinking Executive (MEP/Q0501 - NSQF L5.0)',
        'Communicative English Trainer (ASP/MEP/Q1601 - NSQF L5.0)',
        'Deputy Human Resources Manager (MEP/Q0704 - NSQF L5.0)',
        'Instructional Designer (MEP/Q2901 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Management through seamless office mechanics, agile task execution, and administrative reliability.'
    },
    green_energy: {
      swabhava_role: 'Rooftop Solar Grid Junior Engineer & Suryamitra Installer',
      nsqf_level: 5.0,
      qp_code: 'SGJ/Q0106',
      us_onet_code: '47-2231.00',
      ssc_council: 'Skill Council for Green Jobs (SCGJ)',
      db_sector: 'Green Jobs',
      aligned_careers: [
        'Rooftop Solar Grid Junior Engineer (SGJ/Q0106 - NSQF L5.0)',
        'Solar Water Pumping Junior Engineer (SGJ/Q0112 - NSQF L5.0)',
        'Solar PV Installer (Suryamitra) (SGJ/Q0101 - NSQF L4.0)',
        'Waste Optimisation Professional (SGJ/Q5002 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Green Energy with your hands: installing photovoltaic arrays and wiring solar microgrids.'
    },
    logistics: {
      swabhava_role: 'Packaging Designer & Warehouse Materials Associate',
      nsqf_level: 6.0,
      qp_code: 'LSC/Q0202',
      us_onet_code: '53-7062.00',
      ssc_council: 'Logistics Sector Skill Council (LSC)',
      db_sector: 'Logistics',
      aligned_careers: [
        'Packaging Designer (LSC/Q0202 - NSQF L6.0)',
        'Inventory, Materials Manager (LSC/Q0104 - NSQF L6.0)',
        'Warehouse Manager (LSC/Q0103 - NSQF L6.0)',
        'Land Transportation Manager (LSC/Q1004 - NSQF L6.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Logistics through sturdy protective packaging, materials staging, and reliable warehouse throughput.'
    },
    automotive: {
      swabhava_role: 'Automotive Machining Master Technician & Precision CNC Operator',
      nsqf_level: 6.0,
      qp_code: 'ASC/Q3506',
      us_onet_code: '51-4041.00',
      ssc_council: 'Automotive Skills Development Council (ASDC)',
      db_sector: 'Automotive',
      aligned_careers: [
        'Automotive Machining Master Technician (ASC/Q3506 - NSQF L6.0)',
        'Automotive Welding Machine Master Technician (ASC/Q3105 - NSQF L6.0)',
        'Automotive Automation Specialist (ASC/Q6807 - NSQF L6.0)',
        'Automotive Material Handling Assistant (ASC/Q6101 - NSQF L2.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Automotive through sub-micron machining tolerances and flawless robotic welding.'
    },
    electronics: {
      swabhava_role: 'PCB NPI Fabrication & Verification Specialist',
      nsqf_level: 5.0,
      qp_code: 'CUTM/ELE/Q0101',
      us_onet_code: '51-2022.00',
      ssc_council: 'Electronics Sector Skills Council (ESSCI)',
      db_sector: 'Electronics',
      aligned_careers: [
        'PCB NPI Fabrication and Verification Specialist (CUTM/ELE/Q0101 - NSQF L5.0)',
        'IoT Hardware Analyst (ELE/Q1405 - NSQF L5.0)',
        'Field Technician - UPS And Inverter (ELE/Q7201 - NSQF L4.0)',
        'PROCESS DESIGNER  AUTOMATION (MSME/ELE/Q0701 - NSQF L5.5)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Electronics through precision PCB soldering, circuit debugging, and surface-mount component verification.'
    },
    construction: {
      swabhava_role: 'Supervisor Structure (Technical) & Site Foreman',
      nsqf_level: 5.5,
      qp_code: 'CON/Q0111',
      us_onet_code: '47-1011.00',
      ssc_council: 'Construction Skill Development Council (CSDC)',
      db_sector: 'Construction',
      aligned_careers: [
        'Supervisor Structure (Technical) (CON/Q0111 - NSQF L5.5)',
        'Foreman - Electrician works (Construction) (CON/Q0604 - NSQF L5.0)',
        'Surveyor (CON/Q0902 - NSQF L5.5)',
        'Road Construction Engineer (ASP/CON/Q0201 - NSQF L5.5)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Construction through structural masonry, rebar reinforcement, and on-site physical craftsmanship.'
    },
    media: {
      swabhava_role: 'Live Action Director & Animation Production Specialist',
      nsqf_level: 6.0,
      qp_code: 'MES/Q1301',
      us_onet_code: '27-2012.02',
      ssc_council: 'Media & Entertainment Skills Council (MESC)',
      db_sector: 'Media & Entertainment',
      aligned_careers: [
        'Live Action Director (MES/Q1301 - NSQF L6.0)',
        'Animation Director (MES/Q1302 - NSQF L6.0)',
        'AR-VR Developer (MES/Q0509 - NSQF L6.0)',
        'Voice-Over Artist (MES/Q0101 - NSQF L4.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Media through cinematography execution, lighting, audio engineering, and animation keyframing.'
    },
    agriculture: {
      swabhava_role: 'Agriculture Machinery Demonstrator & Precision Technician',
      nsqf_level: 5.0,
      qp_code: 'AGR/Q1107',
      us_onet_code: '49-3041.00',
      ssc_council: 'Agriculture Skill Council of India (ASCI)',
      db_sector: 'Agriculture',
      aligned_careers: [
        'Agriculture Machinery Demonstrator (AGR/Q1107 - NSQF L5.0)',
        'Aquaculture Technical Supervisor (AGR/Q4903 - NSQF L5.0)',
        'Quality Seed Grower (AGR/Q7101 - NSQF L4.0)',
        'Tractor Operator (AGR/Q1101 - NSQF L4.0)'
      ],
      swadharma_directive: 'Your Shudra craft manifests in Agriculture by operating tractors, managing irrigation systems, and nurturing healthy harvests.'
    }
  }
};

/**
 * Extracts the primary Varna Swabhava (Brahmana, Kshatriya, Vaishya, Shudra)
 * from archetype matrix / code.
 */
function extractCompetency(archetypeCode, archetypeObj) {
  if (archetypeObj && archetypeObj.swabhava) {
    const s = archetypeObj.swabhava.toLowerCase();
    if (s.includes('brahmana') || s.includes('knowledge') || s.includes('scholar')) return 'Brahmana';
    if (s.includes('kshatriya') || s.includes('leader') || s.includes('warrior')) return 'Kshatriya';
    if (s.includes('vaishya') || s.includes('commerce') || s.includes('creator') || s.includes('merchant')) return 'Vaishya';
    if (s.includes('shudra') || s.includes('service') || s.includes('artisan') || s.includes('craftsman')) return 'Shudra';
  }

  if (archetypeCode) {
    const parts = archetypeCode.split('-');
    if (parts.length >= 3) {
      const compChar = parts[2].toUpperCase();
      if (compChar === 'B') return 'Brahmana';
      if (compChar === 'K') return 'Kshatriya';
      if (compChar === 'V') return 'Vaishya';
      if (compChar === 'S') return 'Shudra';
    }
  }

  return 'Kshatriya';
}

/**
 * Returns list of all available sectors for dropdown.
 */
async function getAvailableSectors(db) {
  let dbSectors = [];
  if (db && typeof db.query === 'function') {
    try {
      const res = await db.query('SELECT DISTINCT sector, count(*) as cnt FROM nsqf_qps GROUP BY sector ORDER BY sector ASC');
      dbSectors = res.rows.map(r => ({
        id: r.sector.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        name: r.sector,
        dbSector: r.sector,
        count: parseInt(r.cnt, 10),
        is_flagship: TOP_FLAGSHIP_SECTORS.some(f => f.dbSector.toLowerCase() === r.sector.toLowerCase())
      }));
    } catch (err) {
      console.error('Failed to load DB sectors:', err.message);
    }
  }

  return {
    flagships: TOP_FLAGSHIP_SECTORS,
    all_sectors: dbSectors
  };
}

/**
 * Resolves career alignment for an archetype within a chosen sector.
 * Flexible signature:
 *   getCareersForSector(archetypeCode, sectorKey, db)
 *   getCareersForSector(archetypeCode, archetypeObj, sectorKey, db)
 */
async function getCareersForSector(archetypeCode, arg2 = 'it_ai', arg3 = null, arg4 = null) {
  let sectorKey = 'it_ai';
  let archetypeObj = null;
  let db = null;

  if (typeof arg2 === 'string') {
    sectorKey = arg2;
    db = arg3;
    archetypeObj = arg4;
  } else if (typeof arg2 === 'object' && arg2 !== null) {
    archetypeObj = arg2;
    sectorKey = typeof arg3 === 'string' ? arg3 : 'it_ai';
    db = arg4;
  }

  const competency = extractCompetency(archetypeCode, archetypeObj);
  const compAlignments = FLAGSHIP_ALIGNMENTS[competency] || FLAGSHIP_ALIGNMENTS.Kshatriya;

  const cleanSectorKey = String(sectorKey || 'it_ai').trim().toLowerCase();

  // 1. Find matching flagship by id, dbSector, or name
  let matchedFlagshipKey = null;
  for (const f of TOP_FLAGSHIP_SECTORS) {
    if (f.id === cleanSectorKey || 
        f.dbSector.toLowerCase() === cleanSectorKey ||
        f.name.toLowerCase() === cleanSectorKey ||
        f.dbSector.toLowerCase().includes(cleanSectorKey) ||
        cleanSectorKey.includes(f.id) ||
        cleanSectorKey.includes(f.dbSector.toLowerCase()) ||
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
      db_sector: data.db_sector || flagshipMeta.dbSector || flagshipMeta.name,
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
          db_sector: topRow.sector || sectorKey,
          ssc_council: `${topRow.sector} Sector Skill Council`,
          swabhava_role: `${topRow.qp_name}`,
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

  // 3. Graceful fallback to IT default
  const defaultData = compAlignments.it_ai;
  const defaultMeta = TOP_FLAGSHIP_SECTORS.find(f => f.id === 'it_ai') || {};
  return {
    success: true,
    is_flagship: true,
    sector_id: 'it_ai',
    sector_name: defaultMeta.name,
    db_sector: defaultMeta.dbSector,
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
