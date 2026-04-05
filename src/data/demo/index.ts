import { RepositoryDataset } from '../../types';

export const demoDataset: RepositoryDataset = {
  modules: [
    {
      id: 'mod-001', name: 'Foundations of Public Health', code: 'PH101', 
      description: 'Introduction to the history, philosophy, and core functions of public health in local and global contexts.', 
      level: 1, credits: 15,
      versions: [
        { 
          id: 'ver-001a', moduleId: 'mod-001', version: '1.0.0', status: 'published', releaseDate: '2024-09-01', content: 'Initial validated release.', 
          dependencies: [],
          outcomes: ['Identify core public health functions', 'Summarize historical health milestones'],
          assessments: [{ type: 'Esssay', weight: 100 }]
        },
        { 
          id: 'ver-001b', moduleId: 'mod-001', version: '1.1.0', status: 'published', releaseDate: '2025-01-15', content: 'Revised content for sustainable health models.', 
          dependencies: [],
          outcomes: ['Identify core public health functions', 'Summarize historical health milestones', 'Evaluate sustainable health delivery'],
          assessments: [{ type: 'Essay', weight: 60 }, { type: 'Case Study', weight: 40 }]
        }
      ]
    },
    {
      id: 'mod-002', name: 'Introduction to Epidemiology', code: 'EPI201', 
      description: 'The study of the distribution and determinants of health-related states or events in specified populations.', 
      level: 2, credits: 15,
      versions: [{ 
        id: 'ver-002a', moduleId: 'mod-002', version: '1.0.0', status: 'published', releaseDate: '2024-08-20', content: 'Foundational epidemiological reasoning.', 
        dependencies: [],
        outcomes: ['Calculate incidence and prevalence', 'Interpret standardized mortality ratios'],
        assessments: [{ type: 'Exam', weight: 100 }]
      }]
    },
    {
      id: 'mod-003', name: 'Biostatistics for Health Research', code: 'BIO202', 
      description: 'Statistical methods for health data analysis and clinical research interpretation.', 
      level: 2, credits: 15,
      versions: [{ 
        id: 'ver-003a', moduleId: 'mod-003', version: '1.0.0', status: 'published', releaseDate: '2024-10-01', content: 'Quantitative foundations.', 
        dependencies: [{ targetId: 'mod-002', type: 'prerequisite', minVersion: '1.0.0' }],
        outcomes: ['Perform p-value analysis', 'Execute regression modelling'],
        assessments: [{ type: 'Data Project', weight: 100 }]
      }]
    },
    {
      id: 'mod-004', name: 'Health Systems and Policy', code: 'HSP301', 
      description: 'Analysis of health service delivery, financing, and policy frameworks across high and low-income settings.', 
      level: 3, credits: 20,
      versions: [{ 
        id: 'ver-004a', moduleId: 'mod-004', version: '1.0.0', status: 'published', releaseDate: '2025-03-01', content: 'Policy and structural analysis.', 
        dependencies: [],
        outcomes: ['Compare financing models', 'Analyze policy implementation barriers'],
        assessments: [{ type: 'Policy Brief', weight: 100 }]
      }]
    },
    {
      id: 'mod-005', name: 'Global Health in Practice', code: 'GHP302', 
      description: 'Practical implementation of health interventions in resource-limited and diverse global contexts.', 
      level: 3, credits: 15,
      versions: [{ 
        id: 'ver-005a', moduleId: 'mod-005', version: '1.0.0', status: 'published', releaseDate: '2024-11-15', content: 'Practical global health delivery.', 
        dependencies: [{ targetId: 'mod-004', type: 'corequisite', minVersion: '1.0.0' }],
        outcomes: ['Assess resource-limited health needs', 'Design localized health interventions'],
        assessments: [{ type: 'Implementation Plan', weight: 100 }]
      }]
    },
    {
      id: 'mod-006', name: 'Research Methods for Public Health', code: 'RM401', 
      description: 'Essential qualitative and quantitative research methodologies for public health investigation.', 
      level: 4, credits: 20,
      versions: [{ 
        id: 'ver-006a', moduleId: 'mod-006', version: '1.0.0', status: 'published', releaseDate: '2025-02-10', content: 'Advanced methodologies.', 
        dependencies: [{ targetId: 'mod-002', type: 'prerequisite', minVersion: '1.0.0' }],
        outcomes: ['Synthesize multi-modal research findings', 'Appraise ethical review standards'],
        assessments: [{ type: 'Research Proposal', weight: 50 }, { type: 'Peer Review Portfolio', weight: 50 }]
      }]
    },
    {
      id: 'mod-007', name: 'Health Promotion and Prevention', code: 'HPP204', 
      description: 'Theoretical models and practical strategies for health education and disease prevention programs.', 
      level: 2, credits: 15,
      versions: [
        { 
          id: 'ver-007a', moduleId: 'mod-007', version: '1.0.0', status: 'published', releaseDate: '2024-07-01', content: 'Behavioural change models.', 
          dependencies: [],
          outcomes: ['Describe preventative strategies'],
          assessments: [{ type: 'Report', weight: 100 }]
        },
        { 
          id: 'ver-007b', moduleId: 'mod-007', version: '1.1.0', status: 'published', releaseDate: '2025-01-05', content: 'Revised for community-led prevention.', 
          dependencies: [],
          outcomes: ['Describe preventative strategies', 'Design community-based messaging'],
          assessments: [{ type: 'Practical Report', weight: 100 }]
        }
      ]
    },
    {
      id: 'mod-008', name: 'Public Health Data Management', code: 'DATA305', 
      description: 'Collection, storage, and ethical processing of public health and demographic datasets.', 
      level: 3, credits: 15,
      versions: [{ 
        id: 'ver-008a', moduleId: 'mod-008', version: '1.0.0', status: 'published', releaseDate: '2024-06-15', content: 'Data integrity and ethics.', 
        dependencies: [],
        outcomes: ['Clean and validate datasets', 'Enforce GDPR/Health data compliance'],
        assessments: [{ type: 'Data Clean-up Portfolio', weight: 100 }]
      }]
    },
    {
      id: 'mod-009', name: 'Programme Monitoring and Evaluation', code: 'ME405', 
      description: 'Advanced methodologies for evaluating the structural effectiveness and impact of health programmes.', 
      level: 4, credits: 15,
      versions: [{ 
        id: 'ver-009a', moduleId: 'mod-009', version: '1.0.0', status: 'published', releaseDate: '2024-12-01', content: 'Evaluation frameworks.', 
        dependencies: [{ targetId: 'mod-004', type: 'prerequisite', minVersion: '1.0.0' }],
        outcomes: ['Develop logic models', 'Conduct impact evaluations'],
        assessments: [{ type: 'Evaluation Report', weight: 100 }]
      }]
    },
    {
      id: 'mod-010', name: 'Digital Health Design', code: 'DH401', 
      description: 'Principles of designing digital interventions, telehealth systems, and health information platforms.', 
      level: 4, credits: 15,
      versions: [{ 
        id: 'ver-010a', moduleId: 'mod-010', version: '1.0.0', status: 'published', releaseDate: '2025-04-01', content: 'User-centered health design.', 
        dependencies: [],
        outcomes: ['Design accessible patient portals', 'Prototype telehealth workflows'],
        assessments: [{ type: 'Design Project', weight: 100 }]
      }]
    },
    {
      id: 'mod-011', name: 'Implementation Science', code: 'IS402', 
      description: 'Methods for promoting the integration of evidence-based health research findings into clinical and public health settings.', 
      level: 4, credits: 15,
      versions: [{ 
        id: 'ver-011a', moduleId: 'mod-011', version: '1.0.0', status: 'published', releaseDate: '2025-05-10', content: 'Translation to practice.', 
        dependencies: [{ targetId: 'mod-009', type: 'prerequisite', minVersion: '1.0.0' }],
        outcomes: ['Identify barriers to research adoption', 'Plan implementation strategies'],
        assessments: [{ type: 'Implementation Strategy', weight: 100 }]
      }]
    },
    {
      id: 'mod-012', name: 'Health Inequalities', code: 'HI306', 
      description: 'Analysis of systemic disparities in health outcomes, social determinants, and access to healthcare.', 
      level: 3, credits: 15,
      versions: [{ 
        id: 'ver-012a', moduleId: 'mod-012', version: '1.0.0', status: 'published', releaseDate: '2024-05-15', content: 'Social determinants of health.', 
        dependencies: [],
        outcomes: ['Analyze socio-economic health markers', 'Develop equity-focused health modules'],
        assessments: [{ type: 'Comparative Analysis', weight: 100 }]
      }]
    }
  ],
  programmes: [
    {
      id: 'prog-001',
      name: 'BSc Public Health',
      code: 'BPH-2025',
      description: 'Comprehensive undergraduate degree in public health principles and practice.',
      modules: [
        { moduleId: 'mod-001', version: '1.1.0' }, // Current version
        { moduleId: 'mod-002', version: '1.0.0' },
        { moduleId: 'mod-003', version: '1.0.0' },
        { moduleId: 'mod-007', version: '1.1.0' },
        { moduleId: 'mod-012', version: '1.0.0' }
      ]
    },
    {
      id: 'prog-002',
      name: 'MSc Global Health Practice',
      code: 'MGHP-2025',
      description: 'Advanced professional study in global health systems and implementation.',
      modules: [
        { moduleId: 'mod-004', version: '1.0.0' }, 
        { moduleId: 'mod-005', version: '1.0.0' },
        { moduleId: 'mod-006', version: '1.0.0' },
        { moduleId: 'mod-009', version: '1.0.0' },
        { moduleId: 'mod-012', version: '1.0.0' }
      ]
    },
    {
      id: 'prog-003',
      name: 'Digital Health and Innovation Pathway',
      code: 'DHIP-2025',
      description: 'Interdisciplinary pathway exploring digital transformation in healthcare delivery.',
      modules: [
        { moduleId: 'mod-001', version: '1.0.0' }, // Outdated reference for "Update Available" demo
        { moduleId: 'mod-008', version: '1.0.0' },
        { moduleId: 'mod-010', version: '1.0.0' },
        { moduleId: 'mod-011', version: '0.9.0' }  // Broken reference for "Validation Warning" demo
      ]
    }
  ],
  lastUpdated: new Date().toISOString()
};
