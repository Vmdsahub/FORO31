/**
 * Utility to clean content from edit-mode attributes when rendering in posts/comments
 */

export function cleanContentForDisplay(content: string): string {
  if (!content) return content;

  // Remove data-edit-mode attributes from video elements and containers
  let cleanedContent = content
    .replace(/data-edit-mode="true"/g, "")
    .replace(/data-edit-mode="false"/g, "")
    .replace(/data-edit-mode='true'/g, "")
    .replace(/data-edit-mode='false'/g, "")
    // Clean up any extra spaces left by attribute removal
    .replace(/\s+/g, " ")
    .replace(/\s+>/g, ">");

  // Remove delete buttons (trash icon buttons) from content when displaying
  cleanedContent = cleanedContent.replace(
    /<button[^>]*title="Excluir [^"]*"[^>]*>🗑️<\/button>/g,
    ""
  );

  // Also remove any wrapper divs that only contained delete buttons
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*<img[^>]*>\s*<\/div>/g,
    (match) => {
      // Extract just the img tag from the wrapper
      const imgMatch = match.match(/<img[^>]*>/);
      return imgMatch ? imgMatch[0] : match;
    }
  );

  return cleanedContent;
}

export function cleanContentForSaving(content: string): string {
  if (!content) return content;

  // Remove all edit-mode specific attributes before saving
  let cleanedContent = content
    .replace(/data-edit-mode="[^"]*"/g, "")
    .replace(/data-edit-mode='[^']*'/g, "")
    .replace(/data-click-handled="[^"]*"/g, "")
    .replace(/data-click-handled='[^']*'/g, "")
    // Clean up any extra spaces
    .replace(/\s+/g, " ")
    .replace(/\s+>/g, ">");

  return cleanedContent;
}
