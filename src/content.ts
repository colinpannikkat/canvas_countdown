console.log("Extension script running...");

class ICSParser {
    /**
     * Takes in ics file and outputs it into dictionary format
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
            return {}
        }
        const textArray = text.split("BEGIN:VEVENT");
        const event: Record<string, { Date: string | null, Class: string }> = {};

        for (const item of textArray) {
            if (item.includes('SUMMARY:')) {
                let assignmentName = item.split("SUMMARY:")[1].split('URL;')[0];
                const [className, cleanAssignmentName] = this.getSplitString(assignmentName, "[", " (");
                assignmentName = cleanAssignmentName;
                let date: string | null = null;

                if (item.includes('DTSTART;')) {
                    date = this.cleanString(item.split("VALUE=DATE:")[1].split("CLASS:")[0], "\r", "\n");
                } else if (item.includes('DTSTART:')) {
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

// Creates a new countdown div and adds it below the dashboard header
function addCountdownElement() {
    console.log("Adding countdown element...");
    
    // Find the dashboard header layout
    const dashboardHeader = document.querySelector(".ic-Dashboard-header__layout");
    
    if (dashboardHeader) {
        console.log("Dashboard header found, adding countdown...");
        
        // Create a new div for the countdown
        const countdownDiv = document.createElement("div");
        countdownDiv.className = "countdown-container";
        countdownDiv.style.fontSize = "32px";
        countdownDiv.style.fontWeight = "bold";
        countdownDiv.style.padding = "20px 0";
        countdownDiv.style.textAlign = "center";
        countdownDiv.textContent = "COUNTDOWN";
        countdownDiv.style.backgroundColor = "white";
        
        // Insert after the dashboard header
        dashboardHeader.parentNode?.insertBefore(countdownDiv, dashboardHeader.nextSibling);
        return true;
    } else {
        console.log("Dashboard header not found");
        return false;
    }
}

function observeDOMChanges() {
    console.log("Setting up DOM observer...");
    
    const observer = new MutationObserver((mutations, obs) => {
        console.log("DOM changes detected:", mutations.length);

        if (addCountdownElement()) {
            obs.disconnect();  
            console.log("Observer disconnected after adding countdown.");
        }
    });

    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        characterData: true,
        attributes: true
    });
}


async function main() {
    console.log("Main function running...");
    
    // Set up the observer for future changes
    observeDOMChanges();
    
    // Fetch and parse ICS
    console.log("Fetching ICS data...");
    const usr_feed_id: string | null = getUsrID();
    let usr_ics_url: string | null = null;
    if (usr_feed_id) {
        usr_ics_url = `https://canvas.oregonstate.edu/feeds/calendars/${usr_feed_id}.ics`;
    }

    if (usr_ics_url) {
        fetchAndParseICS(usr_ics_url).then(ics_data => {
            console.log("Parsed ICS data:", ics_data);
        });
    } else {
        console.error("Cannot retrieve the ICS calendar feed url automatically.");
    }
}

// Run when the page loads
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    // If the DOM is already loaded, run immediately
    main();
}