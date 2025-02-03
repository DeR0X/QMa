// Departments and positions for both IT and Manufacturing companies

interface DepartmentStructure {
    name: string;
    positions: string[];
  }
  
  // IT Company Structure
  export const itDepartments: DepartmentStructure[] = [
    {
      name: 'Softwareentwicklung',
      positions: [
        'Software Engineer',
        'Senior Software Engineer',
        'Lead Developer',
        'Full-Stack Developer',
        'Frontend Developer',
        'Backend Developer',
        'DevOps Engineer',
        'Software Architect',
        'Product Owner',
      ],
    },
    {
      name: 'IT Operations',
      positions: [
        'System Administrator',
        'Network Engineer',
        'Cloud Engineer',
        'IT Security Specialist',
        'Database Administrator',
        'IT Support Specialist',
        'Infrastructure Manager',
      ],
    },
    {
      name: 'Qualitätssicherung',
      positions: [
        'QA Engineer',
        'Test Manager',
        'Software Tester',
        'Test Automation Engineer',
        'Quality Manager',
      ],
    },
    {
      name: 'Projektmanagement',
      positions: [
        'Projektmanager',
        'Projektkoordinator',
        'Agile Coach',
        'Program Manager',
        'Portfolio Manager',
      ],
    },
    {
      name: 'Forschung & Entwicklung',
      positions: [
        'Research Engineer',
        'Data Scientist',
        'Machine Learning Engineer',
        'KI-Spezialist',
        'Innovation Manager',
      ],
    },
    {
      name: 'Personal',
      positions: [
        'HR Manager',
        'Personalreferent',
        'Recruiting Specialist',
        'HR Business Partner',
        'Personalentwickler',
      ],
    },
    {
      name: 'Finanzen',
      positions: [
        'Controller',
        'Buchhalter',
        'Finanzanalyst',
        'Gehaltsbuchhalter',
        'Treasurer',
      ],
    },
  ];
  
  // Manufacturing Company Structure (Metal Parts)
  export const manufacturingDepartments: DepartmentStructure[] = [
    {
      name: 'Produktion',
      positions: [
        'Produktionsleiter',
        'Schichtführer',
        'Maschinenbediener',
        'Schweißer',
        'CNC-Programmierer',
        'CNC-Operator',
        'Werkzeugmacher',
        'Qualitätsprüfer',
        'Instandhalter',
      ],
    },
    {
      name: 'Qualitätsmanagement',
      positions: [
        'Qualitätsmanager',
        'QS-Techniker',
        'Prüftechniker',
        'Messtechniker',
        'Dokumentationsspezialist',
        'Audit Manager',
      ],
    },
    {
      name: 'Arbeitsvorbereitung',
      positions: [
        'Arbeitsvorbereiter',
        'Prozessplaner',
        'Fertigungsplaner',
        'Methodenplaner',
        'CAD/CAM-Programmierer',
      ],
    },
    {
      name: 'Instandhaltung & Wartung',
      positions: [
        'Instandhaltungsleiter',
        'Wartungstechniker',
        'Industriemechaniker',
        'Elektrotechniker',
        'Anlagenmechaniker',
      ],
    },
    {
      name: 'Logistik & Lager',
      positions: [
        'Logistikleiter',
        'Lagerverwalter',
        'Versandmitarbeiter',
        'Staplerfahrer',
        'Materialplaner',
        'Supply Chain Manager',
      ],
    },
    {
      name: 'Einkauf',
      positions: [
        'Einkaufsleiter',
        'Strategischer Einkäufer',
        'Operativer Einkäufer',
        'Lieferantenmanager',
        'Materialwirtschafter',
      ],
    },
    {
      name: 'Vertrieb',
      positions: [
        'Vertriebsleiter',
        'Key Account Manager',
        'Technischer Vertrieb',
        'Vertriebsinnendienst',
        'Auftragsabwickler',
      ],
    },
    {
      name: 'Finanzen & Controlling',
      positions: [
        'Controller',
        'Buchhalter',
        'Kostenrechner',
        'Finanzanalyst',
        'Gehaltsbuchhalter',
      ],
    },
  ];