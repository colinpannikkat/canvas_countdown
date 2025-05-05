import { parseICSDate } from "../utils/parseICSDate";

export function getUpcomingAssignment(ics_data: Record<string, { Date: string | null, Class: string }>): { name: string, date: string } | null {
  const now = new Date();
  let closestDate: Date | null = null;
  let closestAssignment = "";

  for (const assignment in ics_data) {
      const dateStr = ics_data[assignment].Date;
      if (!dateStr) continue;

      // Convert ICS date format to JS Date object
      const eventDate = parseICSDate(dateStr);
      if (!eventDate) continue;
      
      // Only consider assignments that are due in the future
      const timeDiff = eventDate.getTime() - now.getTime();
      if (timeDiff < 0) continue; // Skip if in the past

      // Find the closest upcoming assignment
      if (!closestDate || eventDate < closestDate) {
          closestDate = eventDate;
          closestAssignment = assignment;
      }
  }

  return closestDate ? { 
      name: closestAssignment, 
      date: closestDate.toISOString()
  } : null;
}