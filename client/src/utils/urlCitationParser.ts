/**
 * Utility functions for parsing and extracting url_citations from API responses
 */

export interface UrlCitation {
  url: string;
  title?: string;
  snippet?: string;
}

export interface AnnotationWithCitations {
  type?: string;
  url_citations?: UrlCitation[];
  url_citation?: UrlCitation;
  [key: string]: any;
}

/**
 * Extract url_citations from various annotation formats
 * Handles multiple formats that may come from different LLM APIs:
 * - OpenAI's url_citations format
 * - Direct url_citation objects
 * - Nested citation structures
 */
export function extractUrlCitations(
  annotations: any[] | undefined,
): UrlCitation[] {
  if (!annotations || !Array.isArray(annotations)) {
    return [];
  }

  const citations: UrlCitation[] = [];
  const seenUrls = new Set<string>();

  for (const annotation of annotations) {
    if (!annotation || typeof annotation !== 'object') {
      continue;
    }

    // Format 1: url_citations array
    if (Array.isArray(annotation.url_citations)) {
      for (const citation of annotation.url_citations) {
        if (citation && citation.url && !seenUrls.has(citation.url)) {
          citations.push({
            url: citation.url,
            title: citation.title,
            snippet: citation.snippet,
          });
          seenUrls.add(citation.url);
        }
      }
    }

    // Format 2: Single url_citation object
    if (annotation.url_citation && annotation.url_citation.url) {
      const { url, title, snippet } = annotation.url_citation;
      if (!seenUrls.has(url)) {
        citations.push({ url, title, snippet });
        seenUrls.add(url);
      }
    }

    // Format 3: Direct url/title attributes (from older formats)
    if (annotation.url && !seenUrls.has(annotation.url)) {
      citations.push({
        url: annotation.url,
        title: annotation.title,
        snippet: annotation.snippet,
      });
      seenUrls.add(annotation.url);
    }
  }

  return citations;
}

/**
 * Parse markdown sources section to extract citations
 * Looks for markdown links in the format: [title](url)
 */
export function parseMarkdownSources(content: string): UrlCitation[] {
  if (!content) return [];

  const citations: UrlCitation[] = [];
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const [, title, url] = match;
    if (url && url.startsWith('http')) {
      citations.push({
        url,
        title: title || url,
      });
    }
  }

  return citations;
}

/**
 * Split message content from sources section
 * Removes the markdown sources section (starting with **Sources**) from content
 */
export function splitContentAndSources(
  content: string,
): { content: string; sources: string } {
  const sourcesMatch = content.match(/\n\n\*\*Sources\*\*\n[\s\S]*$/);
  if (!sourcesMatch) {
    return { content, sources: '' };
  }

  const sources = sourcesMatch[0].trim();
  const cleanContent = content.substring(0, content.length - sources.length).trim();

  return { content: cleanContent, sources };
}

/**
 * Extract and validate url citations from message
 * Combines multiple approaches to ensure we capture all citation data
 */
export function extractAllUrlCitations(
  message: any,
): UrlCitation[] {
  const citations: UrlCitation[] = [];
  const seenUrls = new Set<string>();

  // Approach 1: Extract from annotations attribute
  if (message.annotations) {
    const annotationCitations = extractUrlCitations(message.annotations);
    for (const citation of annotationCitations) {
      if (!seenUrls.has(citation.url)) {
        citations.push(citation);
        seenUrls.add(citation.url);
      }
    }
  }

  // Approach 2: Parse markdown sources from content
  if (message.content && typeof message.content === 'string') {
    const { sources } = splitContentAndSources(message.content);
    if (sources) {
      const markdownCitations = parseMarkdownSources(sources);
      for (const citation of markdownCitations) {
        if (!seenUrls.has(citation.url)) {
          citations.push(citation);
          seenUrls.add(citation.url);
        }
      }
    }
  }

  return citations;
}
