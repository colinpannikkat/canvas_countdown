console.log("Extension script running...");

class ICSParser {
    /**
     * Takes in ics string and outputs it to dictionary format.
     * 
     * {
     *     AssignmentName : 
     *     {
     *         Date: MMDDYYYY,
     *         Class : class,
     *     }
     *     ...
     * }
     */
    parse(text: string | void): Record<string, { Date: string | null, Class: string }> {
        if (text == null) {
            return {};
        }
        const textArray = text.split("BEGIN:VEVENT");
        const event: Record<string, { Date: string | null, Class: string }> = {};
    
        for (const item of textArray) {
            // Only process assignments
            if (!item.includes("UID:event-assignment-")) {
                continue;
            }
    
            if (item.includes('SUMMARY:')) {
                let assignmentName = item.split("SUMMARY:")[1].split('URL;')[0];
                const [className, cleanAssignmentName] = this.getSplitString(assignmentName, "[", " (");
                assignmentName = cleanAssignmentName;
                let date: string | null = null;
    
                if (item.includes('DTSTART;')) { // purely a date with default due date at 11:59pm, #DTSTART;VALUE=DATE;VALUE=DATE:20250322
                    date = this.cleanString(item.split("VALUE=DATE:")[1].split("CLASS:")[0], "\r", "\n");
                } else if (item.includes('DTSTART:')) { // includes date and time, #DTSTART:20250317T183000Z\nDTEND:20250317T183000Z
                    date = this.cleanString(item.split("DTSTART:")[1].split("DTEND:")[0], "\r", "\n");
                }
    
                event[assignmentName] = {
                    Date: date,
                    Class: className
                };
            }
        }
        return event;
    }
    
    cleanString(string: string, ...args: string[]): string {
        for (const str of args) {
            let splitString = string.split(str);
            splitString = splitString.map(x => x.trim());
            string = splitString.join('');
        }
        return string;
    }

    getSplitString(string: string, str1: string, str2: string): [string, string] {
        const idx1 = string.lastIndexOf(str1);
        const idx2 = string.lastIndexOf(str2);

        const splitStr1 = this.cleanString(string.substring(idx1 + str1.length, idx2), "\r", "\n");
        const splitStr2 = this.cleanString(string.substring(0, idx1 - 1), "\r", "\n", "\\");

        return [splitStr1, splitStr2];
    }
}

async function fetchICSString(ics_url: string): Promise<Response> {
    const ics_string: Response = await fetch(ics_url);
    return ics_string;
}

const parser = new ICSParser();

async function fetchAndParseICS(ics_url: string): Promise<Record<string, { Date: string | null, Class: string }>> {
    try {
        const response = await fetchICSString(ics_url);
        const text = await response.text();
        return parser.parse(text);
    } catch (error) {
        console.error('Error fetching or parsing ICS:', error);
        return {};
    }
}

function getUsrID(): string | null {
    const feed_obj: HTMLAnchorElement | null = document.querySelector('[title="User Atom Feed (All Courses)"]');
    const feed_str: string | null = feed_obj ? feed_obj.href : null;
    if (feed_str) {
        return feed_str.split("users/")[1].split(".atom")[0]
    }
    return null
}

function getUpcomingAssignment(ics_data: Record<string, { Date: string | null, Class: string }>): { name: string, date: string } | null {
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

function parseICSDate(icsDate: string): Date | null {
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

function startLiveCountdown(targetDate: string, assignmentName: string) {
    const countdownDiv = document.createElement("div");
    countdownDiv.className = "countdown-container";
    countdownDiv.style.fontSize = "24px";
    countdownDiv.style.fontWeight = "bold";
    countdownDiv.style.padding = "15px";
    countdownDiv.style.margin = "10px 0";
    countdownDiv.style.textAlign = "center";
    countdownDiv.style.backgroundColor = "#f5f5f5";
    countdownDiv.style.borderRadius = "5px";
    countdownDiv.style.border = "1px solid #ddd";

    const assignmentDisplay = document.createElement("div");
    assignmentDisplay.style.fontSize = "18px";
    assignmentDisplay.style.marginBottom = "5px";
    assignmentDisplay.style.color = "#444";
    assignmentDisplay.textContent = `Next Due: ${assignmentName}`;
    countdownDiv.appendChild(assignmentDisplay);

    const timeDisplay = document.createElement("div");
    countdownDiv.appendChild(timeDisplay);

    const dashboardHeader = document.querySelector(".ic-Dashboard-header__layout");
    if (!dashboardHeader) {
        console.log("Dashboard header not found");
        return;
    }
    dashboardHeader.parentNode?.insertBefore(countdownDiv, dashboardHeader.nextSibling);

    function updateCountdown() {
        const eventDate = new Date(targetDate);
        const currentDate = new Date();
        const timeDiff = eventDate.getTime() - currentDate.getTime();

        if (timeDiff <= 0) {
            timeDisplay.textContent = "DUE NOW!";
            timeDisplay.style.color = "red";
            return;
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        timeDisplay.textContent = `Time Left: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown(); // Initial call
    setInterval(updateCountdown, 1000); // Update every second
}

async function main() {
    console.log("Main function running...");

    // Fetch and parse ICS
    const usr_feed_id: string | null = getUsrID();
    if (!usr_feed_id) {
        console.error("Cannot retrieve the ICS calendar feed URL.");
        return;
    }

    const usr_ics_url = `https://canvas.oregonstate.edu/feeds/calendars/${usr_feed_id}.ics`;
    
    fetchAndParseICS(usr_ics_url).then(ics_data => {
        console.log("Parsed ICS data:", ics_data);
        
        const upcomingAssignment = getUpcomingAssignment(ics_data);
        
        if (!upcomingAssignment) {
            console.log("No upcoming assignments found.");
            return;
        }

        console.log(`Next assignment: ${upcomingAssignment.name}`);
        console.log(`Due on: ${upcomingAssignment.date}`);

        // Start live countdown
        startLiveCountdown(upcomingAssignment.date, upcomingAssignment.name);
    });
}

// Run when the page loads
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    // If the DOM is already loaded, run immediately
    main();
}