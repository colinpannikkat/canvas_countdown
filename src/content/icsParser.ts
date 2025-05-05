export class ICSParser {
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