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

  // Remove wrapper divs that contained images and delete buttons, keep only the image
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*(<img[^>]*>)\s*<button[^>]*>🗑️<\/button>\s*<\/div>/g,
    "$1"
  );

  // Clean up any remaining wrapper divs with only images
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*(<img[^>]*>)\s*<\/div>/g,
    "$1"
  );

  // Remove delete buttons from video previews while keeping the video structure
  cleanedContent = cleanedContent.replace(
    /(<div[^>]*class="video-preview"[^>]*>.*?)<button[^>]*title="Excluir vídeo"[^>]*>🗑️<\/button>(.*?<\/div>)/gs,
    "$1$2"
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

  // Remove delete buttons (trash icon buttons) before saving
  cleanedContent = cleanedContent.replace(
    /<button[^>]*title="Excluir [^"]*"[^>]*>🗑️<\/button>/g,
    ""
  );

  // Remove wrapper divs that contained images and delete buttons, keep only the image
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*(<img[^>]*>)\s*<button[^>]*>🗑️<\/button>\s*<\/div>/g,
    "$1"
  );

  // Clean up any remaining wrapper divs with only images
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*(<img[^>]*>)\s*<\/div>/g,
    "$1"
  );

  // Remove delete buttons from video previews while keeping the video structure
  cleanedContent = cleanedContent.replace(
    /(<div[^>]*class="video-preview"[^>]*>.*?)<button[^>]*title="Excluir vídeo"[^>]*>🗑️<\/button>(.*?<\/div>)/gs,
    "$1$2"
  );

  return cleanedContent;
}
