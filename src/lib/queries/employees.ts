import { executeQuery } from '../db';

export interface Employee {
  // Add your employee table fields here
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  // Add other fields as needed
}

// Get all employees
export async function getAllEmployees(): Promise<Employee[]> {
  const query = `
    SELECT *
    FROM tblEmployees
  `;
  return executeQuery<Employee>(query);
}

// Get employee by ID
export async function getEmployeeById(id: number): Promise<Employee | null> {
  const query = `
    SELECT *
    FROM tblEmployees
    WHERE ID = @param0
  `;
  const results = await executeQuery<Employee>(query, [id]);
  return results[0] || null;
}

// Get employees by department
export async function getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
  const query = `
    SELECT *
    FROM tblEmployees
    WHERE DepartmentID = @param0
  `;
  return executeQuery<Employee>(query, [departmentId]);
}

// Get active employees
export async function getActiveEmployees(): Promise<Employee[]> {
  const query = `
    SELECT *
    FROM tblEmployees
    WHERE IsActive = 1
  `;
  return executeQuery<Employee>(query);
}

// Search employees
export async function searchEmployees(searchTerm: string): Promise<Employee[]> {
  const query = `
    SELECT *
    FROM tblEmployees
    WHERE FirstName LIKE @param0
    OR LastName LIKE @param0
    OR Email LIKE @param0
  `;
  return executeQuery<Employee>(query, [`%${searchTerm}%`]);
}