import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UrlCitations from './UrlCitations';
import type { UrlCitation } from './UrlCitations';

describe('UrlCitations Component', () => {
  const mockCitations: UrlCitation[] = [
    {
      url: 'https://example.com',
      title: 'Example Site',
      snippet: 'This is an example website',
    },
    {
      url: 'https://test.com',
      title: 'Test Documentation',
      snippet: 'Documentation and test resources',
    },
  ];

  it('should render sources heading', () => {
    render(<UrlCitations citations={mockCitations} />);
    expect(screen.getByText('Sources')).toBeInTheDocument();
  });

  it('should render all citations', () => {
    render(<UrlCitations citations={mockCitations} />);
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('Test Documentation')).toBeInTheDocument();
  });

  it('should render clickable links', () => {
    render(<UrlCitations citations={mockCitations} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
    expect(links[1]).toHaveAttribute('href', 'https://test.com');
  });

  it('should open links in new tab', () => {
    render(<UrlCitations citations={mockCitations} />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('should display snippets when available', () => {
    render(<UrlCitations citations={mockCitations} />);
    expect(screen.getByText('This is an example website')).toBeInTheDocument();
    expect(screen.getByText('Documentation and test resources')).toBeInTheDocument();
  });

  it('should use URL as title when title is missing', () => {
    const citations: UrlCitation[] = [
      {
        url: 'https://example.com',
      },
    ];
    render(<UrlCitations citations={citations} />);
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('should not render when citations is empty', () => {
    const { container } = render(<UrlCitations citations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when citations is undefined', () => {
    const { container } = render(<UrlCitations />);
    expect(container.firstChild).toBeNull();
  });

  it('should limit to 10 citations', () => {
    const manyCitations = Array.from({ length: 15 }, (_, i) => ({
      url: `https://example${i}.com`,
      title: `Site ${i}`,
    }));
    render(<UrlCitations citations={manyCitations} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(10);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <UrlCitations citations={mockCitations} className="custom-class" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have proper styling classes', () => {
    const { container } = render(<UrlCitations citations={mockCitations} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('mt-4', 'space-y-2', 'border-l-2');
  });

  it('should display link icons', () => {
    const { container } = render(<UrlCitations citations={mockCitations} />);
    // Check for icon SVGs
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should handle citations with only URL', () => {
    const minimalCitations: UrlCitation[] = [
      { url: 'https://example.com' },
    ];
    render(<UrlCitations citations={minimalCitations} />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('should filter out invalid citations', () => {
    const mixedCitations = [
      { url: 'https://valid.com', title: 'Valid' },
      { url: '', title: 'Invalid - no URL' },
      null as any,
      undefined as any,
    ] as UrlCitation[];

    render(<UrlCitations citations={mixedCitations} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
  });

  it('should handle truncated snippets', () => {
    const citations: UrlCitation[] = [
      {
        url: 'https://example.com',
        title: 'Example',
        snippet: 'This is a very long snippet that should be truncated with line clamping to only show two lines of text so users can see the preview',
      },
    ];
    render(<UrlCitations citations={citations} />);
    const snippet = screen.getByText(/This is a very long snippet/);
    expect(snippet).toHaveClass('line-clamp-2');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<UrlCitations citations={mockCitations} />);
    
    const links = screen.getAllByRole('link');
    await user.tab();
    expect(links[0]).toHaveFocus();
  });

  it('should maintain dark mode styling', () => {
    const { container } = render(<UrlCitations citations={mockCitations} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('dark:border-blue-900');
  });
});
