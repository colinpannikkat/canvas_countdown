export function getUserID(): string | null {
  const feed_obj: HTMLAnchorElement | null = document.querySelector('[title="User Atom Feed (All Courses)"]');
  const feed_str: string | null = feed_obj ? feed_obj.href : null;
  if (feed_str) {
      return feed_str.split("users/")[1].split(".atom")[0]
  }
  return null
}