export function startLiveCountdown(targetDate: string, assignmentName: string) {
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