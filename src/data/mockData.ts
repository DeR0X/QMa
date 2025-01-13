import { User, Training, TrainingBooking, Qualification, QualificationHistory } from '../types';

export const users: User[] = [
  {
    id: '1',
    personalNumber: '123',
    email: 'john.doe@company.com',
    name: 'John Doe',
    role: 'employee',
    department: 'IT Operations',
    position: 'Software Engineer',
    supervisorId: '4',
    isActive: false,
    trainings: ['1', '2'],
    qualifications: ['1'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
    startDate: '2022-01-15',
    skills: ['React', 'TypeScript', 'Node.js'],
    performance: {
      rating: 4.5,
      lastReview: '2024-12-01',
    },
    compensation: {
      salaryGrade: 'E4',
      lastReviewDate: '2023-12-01',
      nextReviewDate: '2024-12-01',
      bonuses: [
        {
          type: 'Performance',
          amount: 2000,
          date: '2023-12-15'
        }
      ]
    },
    careerDevelopment: {
      currentPath: 'Technical Expert Track',
      targetPosition: 'Senior Software Engineer',
      developmentGoals: ['Cloud Architecture', 'Team Leadership'],
      mentors: ['Michael Brown'],
      nextSteps: ['AWS Certification', 'Leadership Training']
    },
    performanceHistory: [
      {
        id: '1',
        date: '2023-12-01',
        reviewer: 'Michael Brown',
        rating: 4.5,
        strengths: ['Technical Skills', 'Problem Solving'],
        improvements: ['Communication'],
        goals: ['Complete AWS Certification'],
        comments: 'Excellent technical performance, showing leadership potential'
      }
    ],
    certifications: [
      {
        id: '1',
        name: 'React Advanced Developer',
        issuer: 'Meta',
        dateObtained: '2023-06-15',
        status: 'active'
      }
    ]
  },
  {
    id: '2',
    personalNumber: '1234',
    email: 'jane.smith@company.com',
    name: 'Jane Smith',
    role: 'hr',
    department: 'HR',
    position: 'HR Specialist',
    supervisorId: '4',
    isActive: true,
    trainings: ['2'],
    qualifications: ['2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
    startDate: '2022-01-15',
    skills: ['HR Management', 'Recruiting', 'Employee Relations'],
    performance: {
      rating: 4.8,
      lastReview: '2024-11-15',
    },
    compensation: {
      salaryGrade: 'E3',
      lastReviewDate: '2023-11-15',
      nextReviewDate: '2024-11-15',
      bonuses: [
        {
          type: 'Year-End',
          amount: 1500,
          date: '2023-12-15'
        }
      ]
    },
    careerDevelopment: {
      currentPath: 'HR Management Track',
      targetPosition: 'HR Manager',
      developmentGoals: ['Leadership Development', 'Strategic HR'],
      mentors: ['Sarah Wilson'],
      nextSteps: ['HR Management Certification']
    },
    performanceHistory: [
      {
        id: '2',
        date: '2023-11-15',
        reviewer: 'Sarah Wilson',
        rating: 4.8,
        strengths: ['Employee Relations', 'Process Improvement'],
        improvements: ['Strategic Planning'],
        goals: ['HR Certification'],
        comments: 'Outstanding performance in employee relations'
      }
    ],
    certifications: [
      {
        id: '2',
        name: 'PHR Certification',
        issuer: 'HRCI',
        dateObtained: '2023-03-10',
        status: 'active'
      }
    ]
  },
  {
    id: '3',
    personalNumber: '12',
    email: 'brian.smith@company.com',
    name: 'Brian Smith',
    role: 'employee',
    department: 'IT Operations',
    position: 'IT Security Specialist',
    isActive: true,
    trainings: ['2'],
    supervisorId: '4',
    qualifications: ['2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
    startDate: '2020-03-15',
    skills: ['Team Leadership', 'Project Management', 'IT Operations'],
    performance: {
      rating: 4.7,
      lastReview: '2024-10-01',
    },
    compensation: {
      salaryGrade: 'M2',
      lastReviewDate: '2023-10-01',
      nextReviewDate: '2024-10-01',
      bonuses: [
        {
          type: 'Leadership',
          amount: 3000,
          date: '2023-12-15'
        }
      ]
    },
    careerDevelopment: {
      currentPath: 'IT Management',
      targetPosition: 'IT Director',
      developmentGoals: ['Strategic Management', 'Budget Planning'],
      mentors: ['Michael Brown'],
      nextSteps: ['Executive Leadership Program']
    },
    performanceHistory: [
      {
        id: '3',
        date: '2023-10-01',
        reviewer: 'Michael Brown',
        rating: 4.7,
        strengths: ['Team Leadership', 'Technical Expertise'],
        improvements: ['Budget Management'],
        goals: ['Develop IT Strategy'],
        comments: 'Strong leadership skills and technical knowledge'
      }
    ],
    certifications: [
      {
        id: '3',
        name: 'PMP Certification',
        issuer: 'PMI',
        dateObtained: '2022-05-20',
        status: 'active'
      }
    ]
  },
  {
    id: '4',
    personalNumber: '1',
    email: 'michael.brown@company.com',
    name: 'Michael Brown',
    role: 'supervisor',
    department: 'IT Operations',
    position: 'System Administrator',
    isActive: true,
    trainings: [],
    supervisorId: '7',
    qualifications: ['1', '2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
    startDate: '2019-06-01',
    skills: ['System Administration', 'Network Security', 'Team Management'],
    performance: {
      rating: 4.9,
      lastReview: '2024-09-15',
    },
    compensation: {
      salaryGrade: 'M3',
      lastReviewDate: '2023-09-15',
      nextReviewDate: '2024-09-15',
      bonuses: [
        {
          type: 'Performance',
          amount: 4000,
          date: '2023-12-15'
        }
      ]
    },
    careerDevelopment: {
      currentPath: 'Technical Management',
      targetPosition: 'CTO',
      developmentGoals: ['Executive Leadership', 'Innovation Management'],
      mentors: ['CTO'],
      nextSteps: ['Executive MBA']
    },
    performanceHistory: [
      {
        id: '4',
        date: '2023-09-15',
        reviewer: 'CTO',
        rating: 4.9,
        strengths: ['Leadership', 'Technical Vision'],
        improvements: ['Work-Life Balance'],
        goals: ['Department Growth'],
        comments: 'Exceptional leadership and technical expertise'
      }
    ],
    certifications: [
      {
        id: '4',
        name: 'CISSP',
        issuer: 'ISC²',
        dateObtained: '2021-08-10',
        status: 'active'
      }
    ]
  },
  {
    id: '6',
    personalNumber: '789',
    email: 'sarah.wilson@company.com',
    name: 'Sarah Wilson',
    role: 'hr',
    department: 'Human Resources',
    position: 'HR Director',
    isActive: true,
    trainings: ['1', '2'],
    qualifications: ['1', '2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
    startDate: '2018-01-01',
    skills: ['HR Strategy', 'Organizational Development', 'Change Management', 'Employee Relations'],
    performance: {
      rating: 4.9,
      lastReview: '2024-08-01',
    },
    careerDevelopment: {
      currentPath: 'Executive HR Leadership',
      targetPosition: 'CHRO',
      developmentGoals: ['Strategic HR', 'Board Relations'],
      mentors: ['CEO'],
      nextSteps: ['Executive Leadership Program']
    },
    certifications: [
      {
        id: '6',
        name: 'SPHR',
        issuer: 'HRCI',
        dateObtained: '2020-03-15',
        status: 'active'
      },
      {
        id: '7',
        name: 'SHRM-SCP',
        issuer: 'SHRM',
        dateObtained: '2019-06-20',
        status: 'active'
      }
    ]
  },
  {
    id: '7',
    personalNumber: '111',
    email: 'james.bond@company.com',
    name: 'James Bond',
    role: 'supervisor',
    department: 'IT Operations',
    position: 'System Administrator',
    isActive: true,
    trainings: [],
    qualifications: ['1', '2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
    startDate: '2019-06-01',
    skills: ['System Administration', 'Network Security', 'Team Management'],
    performance: {
      rating: 4.9,
      lastReview: '2024-09-15',
    },
    compensation: {
      salaryGrade: 'M3',
      lastReviewDate: '2023-09-15',
      nextReviewDate: '2024-09-15',
      bonuses: [
        {
          type: 'Performance',
          amount: 4000,
          date: '2023-12-15'
        }
      ]
    },
    careerDevelopment: {
      currentPath: 'Technical Management',
      targetPosition: 'CTO',
      developmentGoals: ['Executive Leadership', 'Innovation Management'],
      mentors: ['CTO'],
      nextSteps: ['Executive MBA']
    },
    performanceHistory: [
      {
        id: '4',
        date: '2023-09-15',
        reviewer: 'CTO',
        rating: 4.9,
        strengths: ['Leadership', 'Technical Vision'],
        improvements: ['Work-Life Balance'],
        goals: ['Department Growth'],
        comments: 'Exceptional leadership and technical expertise'
      }
    ],
    certifications: [
      {
        id: '4',
        name: 'CISSP',
        issuer: 'ISC²',
        dateObtained: '2021-08-10',
        status: 'active'
      }
    ]
  },
];


export const trainings: Training[] = [
  {
    id: '1',
    title: 'Grundlagen der Informationssicherheit',
    description: 'Grundlegende Schulung zu IT-Sicherheitsprotokollen und Best Practices.',
    duration: '2 Stunden',
    validityPeriod: 12,
    isMandatory: true,
    trainer: 'Sarah Wilson',
    maxParticipants: 20,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    sessions: [
      {
        id: '1',
        date: '2025-03-15T09:00:00',
        location: 'Raum 101',
        availableSpots: 15,
      },
      {
        id: '2',
        date: '2025-03-22T09:00:00',
        location: 'Raum 101',
        availableSpots: 20,
      },
    ],
  },
  {
    id: '2',
    title: 'Kranführerschein - Qualifikation',
    description: 'Ein Kranführerschein ist ein Nachweis, der es einer Person ermöglicht, einen Kran sicher zu bedienen. Die Ausbildung umfasst theoretische Inhalte wie rechtliche Vorschriften, technische Grundlagen und Sicherheitsbestimmungen sowie praktische Übungen im Steuern des Krans und Heben von Lasten. Nach Bestehen einer schriftlichen und praktischen Prüfung erhält der Teilnehmer den Führerschein. Dieser ist in der Regel fünf Jahre gültig und muss danach gegebenenfalls erneuert werden. Der Kranführerschein ist erforderlich, um Kranarbeiten auf Baustellen oder in anderen Bereichen durchzuführen.',
    duration: '4 hours',
    validityPeriod: 60, // months
    isMandatory: false,
    trainer: 'Robert Johnson',
    maxParticipants: 10,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    sessions: [
      {
        id: '3',
        date: '2025-03-20T13:00:00',
        location: 'Room 202',
        availableSpots: 6,
      },
    ],
  },
  {
    id: '3',
    title: 'Agiles Projektmanagement',
    description: 'Schulung in agilen Methoden wie Scrum und Kanban für das Projektmanagement.',
    duration: '3 Tage',
    validityPeriod: 24, // Monate
    isMandatory: false,
    trainer: 'Emily Carter',
    maxParticipants: 15,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    sessions: [
      {
        id: '4',
        date: '2025-04-01T09:00:00',
        location: 'Konferenzraum A',
        availableSpots: 10,
      },
      {
        id: '5',
        date: '2025-04-08T09:00:00',
        location: 'Konferenzraum A',
        availableSpots: 15,
      },
    ],
  },
  {
    id: '4',
    title: 'Grundlagen des Cloud Computing',
    description: 'Einführung in Cloud-Computing-Konzepte, -Dienste und -Bereitstellungsmodelle.',
    duration: '1 Tag',
    validityPeriod: 36, // Monate
    isMandatory: true,
    trainer: 'David Lee',
    maxParticipants: 25,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    sessions: [
      {
        id: '6',
        date: '2025-04-15T09:00:00',
        location: 'Online',
        availableSpots: 25,
      },
    ],
  },
  {
    id: '5',
    title: 'Datenschutz und DSGVO',
    description: 'Schulung zu Datenschutzprinzipien und Einhaltung der DSGVO.',
    duration: '4 Stunden',
    validityPeriod: 12, // Monate
    isMandatory: true,
    trainer: 'Laura White',
    maxParticipants: 20,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    sessions: [
      {
        id: '7',
        date: '2025-04-22T13:00:00',
        location: 'Raum 102',
        availableSpots: 18,
      },
    ],
  },
  {
    id: '6',
    title: 'Sicherheit am Arbeitsplatz',
    description: 'Grundlegende Schulung zu Sicherheitsverfahren und Unfallverhütung am Arbeitsplatz.',
    duration: '2 Stunden',
    validityPeriod: 24, // Monate
    isMandatory: true,
    trainer: 'Hans Müller',
    maxParticipants: 30,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    sessions: [
      {
        id: '8',
        date: '2025-05-05T09:00:00',
        location: 'Halle 8',
        availableSpots: 25,
      },
    ],
  },
  {
    id: '7',
    title: 'Qualitätsmanagement in der Produktion',
    description: 'Schulung zu Qualitätsstandards und -kontrollen in der Fertigung.',
    duration: '1 Tag',
    validityPeriod: 36, // Monate
    isMandatory: false,
    trainer: 'Maria Schmidt',
    maxParticipants: 20,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    sessions: [
      {
        id: '9',
        date: '2025-05-12T09:00:00',
        location: 'Schulungsraum 1',
        availableSpots: 15,
      },
    ],
  },
  {
    id: '8',
    title: 'Maschinenbedienung und Wartung',
    description: 'Schulung zur sicheren Bedienung und grundlegenden Wartung von Produktionsmaschinen.',
    duration: '4 Stunden',
    validityPeriod: 48, // Monate
    isMandatory: true,
    trainer: 'Peter Wagner',
    maxParticipants: 15,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    sessions: [
      {
        id: '10',
        date: '2025-05-19T13:00:00',
        location: 'Werkstatt',
        availableSpots: 10,
      },
    ],
  },
];

export const qualifications: Qualification[] = [
  {
    id: '1',
    name: 'IT Security Certification',
    description: 'Basic IT security certification required for all IT staff',
    requiredTrainings: ['1'],
    validityPeriod: 12, // months
  },
  {
    id: '2',
    name: 'Kranführerschein',
    description: 'Kranführerschein – Berechtigung zum sicheren Führen eines Krans',
    requiredTrainings: ['2'],
    validityPeriod: 60, // months
  },
];

export const qualificationHistory: QualificationHistory[] = [
  {
    id: '1',
    userId: '1',
    qualificationId: '1',
    type: 'granted',
    date: '2023-12-15T10:00:00',
    approvedBy: '3',
  },
  {
    id: '2',
    userId: '2',
    qualificationId: '2',
    type: 'expired',
    date: '2024-01-15T10:00:00',
    reason: 'Qualification period ended',
    approvedBy: '3',
  },
];

export const bookings: TrainingBooking[] = [
  {
    id: '1',
    userId: '1',
    trainingId: '1',
    sessionId: '1',
    status: 'genehmigt',
    completedAt: '2023-12-15T10:00:00',
    approvedBy: '3',
    createdAt: '2023-12-01T09:00:00',
  },
  {
    id: '2',
    userId: '2',
    trainingId: '2',
    sessionId: '3',
    status: 'ausstehend',
    createdAt: '2024-02-01T14:30:00',
  },
];

