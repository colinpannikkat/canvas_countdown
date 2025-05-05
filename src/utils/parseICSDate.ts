export function parseICSDate(icsDate: string): Date | null {
    let match = null;

    try {
        // Full timestamp: YYYYMMDDTHHMMSSZ (Z indicates UTC)
        match = icsDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
        if (match) {
            const [, year, month, day, hours, minutes, seconds] = match.map(Number);
            // If Z is present, it's UTC time and needs conversion to local time
            if (icsDate.endsWith('Z')) {
                return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
            } else {
                // If no Z, assume it's already in local time
                return new Date(year, month - 1, day, hours, minutes, seconds);
            }
        }

        // Timestamp without seconds: YYYYMMDDTHHMMZ
        match = icsDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})Z?$/);
        if (match) {
            const [, year, month, day, hours, minutes] = match.map(Number);
            if (icsDate.endsWith('Z')) {
                return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
            } else {
                return new Date(year, month - 1, day, hours, minutes, 0);
            }
        }

        // Date only: YYYYMMDD (Canvas typically sets these to 11:59 PM)
        match = icsDate.match(/^(\d{4})(\d{2})(\d{2})$/);
        if (match) {
            const [, year, month, day] = match.map(Number);
            // Set to 11:59 PM local time for the day
            return new Date(year, month - 1, day, 23, 59, 0);
        }

        console.error("Invalid date format:", icsDate);
        return null;
    } catch (error) {
        console.error("Error parsing date:", error);
        return null;
    }
}