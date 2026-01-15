import React, { useMemo } from 'react';
import { LinkIcon, ExternalLinkIcon } from 'lucide-react';

export interface UrlCitation {
  url: string;
  title?: string;
  snippet?: string;
}

interface UrlCitationsProps {
  citations?: UrlCitation[];
  className?: string;
}

/**
 * UrlCitations Component
 * Displays a formatted list of URL citations extracted from API annotations
 * Supports OpenAI's url_citations format
 */
export const UrlCitations: React.FC<UrlCitationsProps> = ({
  citations = [],
  className = '',
}) => {
  const validCitations = useMemo(() => {
    return citations
      .filter((c): c is UrlCitation => typeof c === 'object' && !!c.url)
      .slice(0, 10); // Limit to 10 citations for UX
  }, [citations]);

  if (!validCitations || validCitations.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 space-y-2 border-l-2 border-blue-200 pl-3 dark:border-blue-900 ${className}`}>
      <div className="flex items-center gap-2">
        <LinkIcon size={16} className="text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Sources
        </span>
      </div>
      <ul className="space-y-1">
        {validCitations.map((citation, index) => (
          <li key={`${citation.url}-${index}`} className="text-sm">
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              {citation.title || 'Source'}
              <ExternalLinkIcon size={12} className="shrink-0" />
            </a>
            {citation.snippet && (
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {citation.snippet}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UrlCitations;
