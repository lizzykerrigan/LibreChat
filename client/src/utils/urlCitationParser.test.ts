import {
  extractUrlCitations,
  parseMarkdownSources,
  splitContentAndSources,
  extractAllUrlCitations,
  type UrlCitation,
} from './urlCitationParser';

describe('urlCitationParser', () => {
  describe('extractUrlCitations', () => {
    it('should extract url_citations array format', () => {
      const annotations = [
        {
          url_citations: [
            { url: 'https://example.com', title: 'Example' },
            { url: 'https://test.com', title: 'Test', snippet: 'A test site' },
          ],
        },
      ];

      const result = extractUrlCitations(annotations);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ url: 'https://example.com', title: 'Example' });
      expect(result[1]).toEqual({
        url: 'https://test.com',
        title: 'Test',
        snippet: 'A test site',
      });
    });

    it('should extract single url_citation object', () => {
      const annotations = [
        {
          url_citation: {
            url: 'https://example.com',
            title: 'Example Site',
          },
        },
      ];

      const result = extractUrlCitations(annotations);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://example.com',
        title: 'Example Site',
      });
    });

    it('should extract direct url/title attributes', () => {
      const annotations = [
        {
          url: 'https://example.com',
          title: 'Example',
        },
      ];

      const result = extractUrlCitations(annotations);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ url: 'https://example.com', title: 'Example' });
    });

    it('should deduplicate citations by URL', () => {
      const annotations = [
        {
          url_citations: [{ url: 'https://example.com', title: 'Example 1' }],
        },
        {
          url: 'https://example.com',
          title: 'Example 2',
        },
      ];

      const result = extractUrlCitations(annotations);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Example 1'); // First one wins
    });

    it('should handle empty annotations', () => {
      expect(extractUrlCitations([])).toEqual([]);
      expect(extractUrlCitations(undefined)).toEqual([]);
      expect(extractUrlCitations(null as any)).toEqual([]);
    });

    it('should handle invalid annotations gracefully', () => {
      const annotations = [
        null,
        undefined,
        'string',
        { invalid: 'data' },
        { url_citations: null },
        { url_citations: [] },
      ];

      const result = extractUrlCitations(annotations);
      expect(result).toEqual([]);
    });

    it('should handle mixed format annotations', () => {
      const annotations = [
        {
          url_citations: [
            { url: 'https://example.com', title: 'Example' },
          ],
        },
        {
          url_citation: { url: 'https://test.com', title: 'Test' },
        },
        {
          url: 'https://direct.com',
          title: 'Direct',
        },
      ];

      const result = extractUrlCitations(annotations);
      expect(result).toHaveLength(3);
    });
  });

  describe('parseMarkdownSources', () => {
    it('should parse markdown links', () => {
      const content = '**Sources**\n- [Example](https://example.com)\n- [Test](https://test.com)';
      const result = parseMarkdownSources(content);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ url: 'https://example.com', title: 'Example' });
      expect(result[1]).toEqual({ url: 'https://test.com', title: 'Test' });
    });

    it('should ignore non-http links', () => {
      const content = '- [File](file:///path) - [HTTP](https://example.com) - [FTP](ftp://example.com)';
      const result = parseMarkdownSources(content);

      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://example.com');
    });

    it('should handle empty content', () => {
      expect(parseMarkdownSources('')).toEqual([]);
      expect(parseMarkdownSources(null as any)).toEqual([]);
      expect(parseMarkdownSources(undefined as any)).toEqual([]);
    });

    it('should handle malformed markdown', () => {
      const content = '[Link without url]()\n[Title without link](\n(No title)[https://example.com]';
      expect(() => parseMarkdownSources(content)).not.toThrow();
    });
  });

  describe('splitContentAndSources', () => {
    it('should split content from markdown sources', () => {
      const content = 'This is the answer.\n\n**Sources**\n- [Example](https://example.com)';
      const result = splitContentAndSources(content);

      expect(result.content).toBe('This is the answer.');
      expect(result.sources).toContain('**Sources**');
    });

    it('should return full content if no sources', () => {
      const content = 'This is just the answer without sources.';
      const result = splitContentAndSources(content);

      expect(result.content).toBe(content);
      expect(result.sources).toBe('');
    });

    it('should handle content with no sources marker', () => {
      const content = 'Here is some content with a [link](https://example.com)';
      const result = splitContentAndSources(content);

      expect(result.content).toBe(content);
      expect(result.sources).toBe('');
    });
  });

  describe('extractAllUrlCitations', () => {
    it('should extract from annotations', () => {
      const message = {
        annotations: [
          {
            url_citations: [
              { url: 'https://example.com', title: 'Example' },
            ],
          },
        ],
      };

      const result = extractAllUrlCitations(message);
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://example.com');
    });

    it('should extract from markdown sources in content', () => {
      const message = {
        content: 'Answer\n\n**Sources**\n- [Test](https://test.com)',
      };

      const result = extractAllUrlCitations(message);
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://test.com');
    });

    it('should combine from both sources', () => {
      const message = {
        annotations: [
          {
            url_citations: [
              { url: 'https://example.com', title: 'Example' },
            ],
          },
        ],
        content: 'Answer\n\n**Sources**\n- [Test](https://test.com)',
      };

      const result = extractAllUrlCitations(message);
      expect(result).toHaveLength(2);
    });

    it('should deduplicate across sources', () => {
      const message = {
        annotations: [
          {
            url_citations: [
              { url: 'https://example.com', title: 'Example' },
            ],
          },
        ],
        content: 'Answer\n\n**Sources**\n- [Example](https://example.com)',
      };

      const result = extractAllUrlCitations(message);
      expect(result).toHaveLength(1); // Should dedupe the same URL
    });

    it('should handle message without annotations or content', () => {
      const message = {};
      const result = extractAllUrlCitations(message);
      expect(result).toEqual([]);
    });

    it('should handle null message gracefully', () => {
      expect(extractAllUrlCitations(null as any)).toEqual([]);
      expect(extractAllUrlCitations(undefined as any)).toEqual([]);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle OpenAI web search response format', () => {
      const message = {
        content: 'Paris, the capital of France, is known for its art, history, and culture.\n\n**Sources**\n- [Paris - Wikipedia](https://en.wikipedia.org/wiki/Paris)\n- [Paris Tourism](https://www.parisinfo.com)',
        annotations: [
          {
            url_citations: [
              {
                url: 'https://en.wikipedia.org/wiki/Paris',
                title: 'Paris - Wikipedia',
                snippet: 'Paris is the capital and largest city of France',
              },
            ],
          },
        ],
      };

      const citations = extractAllUrlCitations(message);
      expect(citations.length).toBeGreaterThan(0);
      expect(citations.some(c => c.url.includes('wikipedia'))).toBe(true);
    });

    it('should handle edge case with no valid citations', () => {
      const message = {
        content: 'Here is an answer with no citations.',
        annotations: [],
      };

      const citations = extractAllUrlCitations(message);
      expect(citations).toEqual([]);
    });

    it('should preserve citation metadata', () => {
      const message = {
        annotations: [
          {
            url_citations: [
              {
                url: 'https://example.com',
                title: 'Example Site',
                snippet: 'This is an example snippet about the topic',
              },
            ],
          },
        ],
      };

      const citations = extractAllUrlCitations(message);
      expect(citations[0]).toEqual({
        url: 'https://example.com',
        title: 'Example Site',
        snippet: 'This is an example snippet about the topic',
      });
    });
  });
});
