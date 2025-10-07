// Service for managing department and curriculum data
import { Department, Curriculum } from '@/types/course';

// Department data extracted from Courses.tsx
export const getDepartments = (): Department[] => {
  return [
    {
      id: 'IT',
      code: 'IT',
      name: 'Information Technology',
      nameThai: 'เทคโนโลยีสารสนเทศ',
      curricula: [
        {
          id: 'IT-62',
          year: 2019,
          buddhistYear: 2562,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศ พ.ศ. 2562',
          duration: 4,
          totalCredits: 127,
          semesters: []
        },
        {
          id: 'IT-62-COOP',
          year: 2019,
          buddhistYear: 2562,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศ (สหกิจ) พ.ศ. 2562',
          duration: 4,
          totalCredits: 127,
          semesters: []
        },
        {
          id: 'IT-67',
          year: 2024,
          buddhistYear: 2567,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศ พ.ศ. 2567',
          duration: 4,
          totalCredits: 120,
          semesters: []
        },
        {
          id: 'IT-67-COOP',
          year: 2024,
          buddhistYear: 2567,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศ (สหกิจ) พ.ศ. 2567',
          duration: 4,
          totalCredits: 120,
          semesters: []
        }
      ]
    },
    {
      id: 'INE',
      code: 'INE',
      name: 'Information and Network Engineering',
      nameThai: 'วิศวกรรมสารสนเทศและเครือข่าย',
      curricula: [
        {
          id: 'INE-62',
          year: 2019,
          buddhistYear: 2562,
          name: 'หลักสูตรวิศวกรรมสารสนเทศและเครือข่าย พ.ศ. 2562',
          duration: 4,
          totalCredits: 135,
          semesters: []
        },
        {
          id: 'INE-62-COOP',
          year: 2019,
          buddhistYear: 2562,
          name: 'หลักสูตรวิศวกรรมสารสนเทศและเครือข่าย (สหกิจ) พ.ศ. 2562',
          duration: 4,
          totalCredits: 135,
          semesters: []
        },
        {
          id: 'INE-67',
          year: 2024,
          buddhistYear: 2567,
          name: 'หลักสูตรวิศวกรรมสารสนเทศและเครือข่าย พ.ศ. 2567',
          duration: 4,
          totalCredits: 125,
          semesters: []
        },
        {
          id: 'INE-67-COOP',
          year: 2024,
          buddhistYear: 2567,
          name: 'หลักสูตรวิศวกรรมสารสนเทศและเครือข่าย (สหกิจ) พ.ศ. 2567',
          duration: 4,
          totalCredits: 125,
          semesters: []
        }
      ]
    },
    {
      id: 'INET',
      code: 'INET',
      name: 'Information and Network Engineering',
      nameThai: 'เทคโนโลยีสารสนเทศและเครือข่าย',
      curricula: [
        {
          id: 'INET-62',
          year: 2019,
          buddhistYear: 2562,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศและเครือข่าย พ.ศ. 2562',
          duration: 3,
          totalCredits: 103,
          semesters: []
        },
        {
          id: 'INET-67',
          year: 2024,
          buddhistYear: 2567,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศและเครือข่าย พ.ศ. 2567',
          duration: 3,
          totalCredits: 102,
          semesters: []
        }
      ]
    },
    {
      id: 'ITI',
      code: 'ITI',
      name: 'Information Technology',
      nameThai: 'เทคโนโลยีสารสนเทศ (ต่อเนื่อง)',
      curricula: [
        {
          id: 'ITI-61',
          year: 2018,
          buddhistYear: 2561,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศ (ต่อเนื่อง) พ.ศ. 2561',
          duration: 2,
          totalCredits: 81,
          semesters: []
        },
        {
          id: 'ITI-66',
          year: 2023,
          buddhistYear: 2566,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศ (ต่อเนื่อง) พ.ศ. 2566',
          duration: 2,
          totalCredits: 78,
          semesters: []
        }
      ]
    },
    {
      id: 'ITT',
      code: 'ITT',
      name: 'Information Technology',
      nameThai: 'เทคโนโลยีสารสนเทศ (เทียบโอน)',
      curricula: [
        {
          id: 'ITT-67',
          year: 2024,
          buddhistYear: 2567,
          name: 'หลักสูตรเทคโนโลยีสารสนเทศ (เทียบโอน) พ.ศ. 2567',
          duration: 2,
          totalCredits: 84,
          semesters: []
        }
      ]
    }
  ];
};

// Get department by ID
export const getDepartmentById = (id: string): Department | undefined => {
  return getDepartments().find(dept => dept.id === id);
};

// Get curriculum by department and curriculum ID
export const getCurriculumById = (departmentId: string, curriculumId: string): Curriculum | undefined => {
  const department = getDepartmentById(departmentId);
  return department?.curricula.find(curr => curr.id === curriculumId);
};

// Get available curricula for a department
export const getAvailableCurricula = (departmentId: string) => {
  switch (departmentId) {
    case 'IT': return [
      { value: 'IT 62', label: 'IT 62' },
      { value: 'IT 62 สหกิจ', label: 'IT 62 สหกิจ' },
      { value: 'IT 67', label: 'IT 67' },
      { value: 'IT 67 สหกิจ', label: 'IT 67 สหกิจ' }
    ];
    case 'INE': return [
      { value: 'INE 62', label: 'INE 62' },
      { value: 'INE 62 สหกิจ', label: 'INE 62 สหกิจ' },
      { value: 'INE 67', label: 'INE 67' },
      { value: 'INE 67 สหกิจ', label: 'INE 67 สหกิจ' }
    ];
    case 'INET': return [
      { value: 'INET 62', label: 'INET 62' },
      { value: 'INET 67', label: 'INET 67' }
    ];
    case 'ITI': return [
      { value: 'ITI 61', label: 'ITI 61' },
      { value: 'ITI 66', label: 'ITI 66' }
    ];
    case 'ITT': return [
      { value: 'ITT 67', label: 'ITT 67' }
    ];
    default: return [
      { value: 'IT 62', label: 'IT 62' },
      { value: 'IT 62 สหกิจ', label: 'IT 62 สหกิจ' },
      { value: 'IT 67', label: 'IT 67' },
      { value: 'IT 67 สหกิจ', label: 'IT 67 สหกิจ' },
      { value: 'INE 62', label: 'INE 62' },
      { value: 'INE 62 สหกิจ', label: 'INE 62 สหกิจ' },
      { value: 'INE 67', label: 'INE 67' },
      { value: 'INE 67 สหกิจ', label: 'INE 67 สหกิจ' },
      { value: 'INET 62', label: 'INET 62' },
      { value: 'INET 67', label: 'INET 67' },
      { value: 'ITI 61', label: 'ITI 61' },
      { value: 'ITI 66', label: 'ITI 66' },
      { value: 'ITT 67', label: 'ITT 67' }
    ];
  }
};

// Get available semesters based on curriculum
export const getAvailableSemesters = (selectedCurriculum: string) => {
  const baseSemesters = [
    { value: 'all', label: 'ทุกเทอม' },
    { value: '1-1', label: 'ปี 1 – เทอม 1' },
    { value: '1-2', label: 'ปี 1 – เทอม 2' },
    { value: '2-1', label: 'ปี 2 – เทอม 1' },
    { value: '2-2', label: 'ปี 2 – เทอม 2' },
    { value: '3-1', label: 'ปี 3 – เทอม 1' },
    { value: '3-2', label: 'ปี 3 – เทอม 2' },
    { value: '4-1', label: 'ปี 4 – เทอม 1' },
    { value: '4-2', label: 'ปี 4 – เทอม 2' }
  ];

  if (selectedCurriculum !== 'all') {
    const curriculumParts = selectedCurriculum.split(' ');
    const programCode = curriculumParts[0];
    const isCoop = curriculumParts.length > 2 && curriculumParts[2] === 'สหกิจ';
    
    // Add semester 3 based on program (except for สหกิจ curricula)
    if ((programCode === 'IT' || programCode === 'INE') && !isCoop) {
      // Year 3 semester 3 for IT and INE (non-coop)
      const index = baseSemesters.findIndex(s => s.value === '3-2');
      baseSemesters.splice(index + 1, 0, { value: '3-3', label: 'ปี 3 – เทอม 3 (ฝึกงาน)' });
    } else if (programCode === 'INET') {
      // INET: 3 years, 7 semesters (Year 2 has semester 3 internship)
      const index = baseSemesters.findIndex(s => s.value === '2-2');
      baseSemesters.splice(index + 1, 0, { value: '2-3', label: 'ปี 2 – เทอม 3 (ฝึกงาน)' });
      
      // Remove year 4 semesters for INET (3-year program, 7 semesters)
      return baseSemesters.filter(s => 
        s.value === 'all' || 
        !s.value.startsWith('4-')
      );
    } else if (programCode === 'ITI') {
      // ITI: 2 years, 5 semesters (Year 1 has semester 3 internship)
      const index = baseSemesters.findIndex(s => s.value === '1-2');
      baseSemesters.splice(index + 1, 0, { value: '1-3', label: 'ปี 1 – เทอม 3 (ฝึกงาน)' });
      
      // Remove year 3 and 4 semesters for ITI (2-year program, 5 semesters)
      return baseSemesters.filter(s => 
        s.value === 'all' || 
        s.value.startsWith('1-') || 
        s.value.startsWith('2-')
      );
    } else if (programCode === 'ITT') {
      // ITT: 2 years, 4 semesters (no internship)
      return baseSemesters.filter(s => 
        s.value === 'all' || 
        s.value.startsWith('1-') || 
        s.value.startsWith('2-')
      );
    }
  }

  return baseSemesters;
};

// Extract student's department from student ID or email
export const extractDepartmentFromStudentInfo = (studentId?: string, email?: string): string => {
  // Try to extract from student ID first
  if (studentId) {
    // Assuming student ID format like s6506022620052 where 65 is year, 06 is department code
    const match = studentId.match(/^s?\d{2}(\d{2})/);
    if (match) {
      const deptCode = match[1];
      switch (deptCode) {
        case '06': return 'IT';
        case '07': return 'INE';
        case '08': return 'INET';
        case '09': return 'ITI';
        case '10': return 'ITT';
        default: return 'IT'; // Default fallback
      }
    }
  }

  // Try to extract from email
  if (email) {
    // Look for department indicators in email
    const emailLower = email.toLowerCase();
    if (emailLower.includes('ine')) return 'INE';
    if (emailLower.includes('inet')) return 'INET';
    if (emailLower.includes('iti')) return 'ITI';
    if (emailLower.includes('itt')) return 'ITT';
  }

  // Default to IT
  return 'IT';
};