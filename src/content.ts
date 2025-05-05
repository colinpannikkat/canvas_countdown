// Ping for sanity check
console.log("Extension script running...");

import { getUserID } from "./utils/canvasUtils";
import { getUpcomingAssignment } from "./utils/assignmentUtils";
import { startLiveCountdown } from "./content/startLiveCountdown";
import { fetchAndParseICS } from "./content/icsService";

async function main() {
    console.log("Main function running...");

    // Fetch and parse ICS
    const usr_feed_id: string | null = getUserID();
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