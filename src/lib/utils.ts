import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract numeric part from course code by removing letter prefixes
 * @param courseCode - The full course code (e.g., "INE-060233108", "IT-080103001")
 * @returns The numeric part of the course code (e.g., "060233108", "080103001")
 */
export function extractCourseNumber(courseCode: string): string {
  if (!courseCode) return '';
  
  // Remove any letter prefixes and hyphens, keep only numbers
  const numericPart = courseCode.replace(/^[A-Za-z-]+/, '');
  return numericPart;
}
