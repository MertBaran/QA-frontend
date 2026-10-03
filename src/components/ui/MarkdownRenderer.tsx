import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, useTheme } from '@mui/material';
import { rehypeRefLinks } from '../../utils/rehypeRefLinks';
import { remarkInlineStyles } from '../../utils/remarkInlineStyles';
import { getMdHighlightStyle } from '../../utils/mdHighlightStyle';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** ref:N link'lerinde hover'da çağrılır (N = referans index) */
  onRefHover?: (refIndex: number | null) => void;
  /** ref:N link'lerinde tıklamada çağrılır (N = referans index) */
  onRefClick?: (refIndex: number) => void;
  /** Panel referansına hover'da vurgulanacak index - ref metnini highlight eder */
  highlightedRefIndex?: number | null;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className, onRefHover, onRefClick, highlightedRefIndex }) => {
  const theme = useTheme();
  // #333 override - dark mode'da tema yanlış renk veriyorsa açık renk kullan
  const textColor = theme.palette.mode === 'dark' ? '#F5F5F5' : theme.palette.text.primary;
  const textStyle: React.CSSProperties = { color: textColor };

  if (!content) return null;

  return (
    <Box className={className} sx={{ fontSize: 16, lineHeight: 1.6, fontFamily: theme.typography.fontFamily, maxWidth: '100%', overflowWrap: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkInlineStyles]}
        rehypePlugins={[rehypeRefLinks]}
        components={{
          p: ({ children }) => <p style={{ ...textStyle, marginBottom: 12 }}>{children}</p>,
          li: ({ children }) => <li style={textStyle}>{children}</li>,
          mark: (props) => {
            const dataMdBg = (props as { 'data-md-bg'?: string })['data-md-bg'];
            const dataMdColor = (props as { 'data-md-color'?: string })['data-md-color'];
            return (
              <mark
                className="md-highlight"
                data-md-bg={dataMdBg}
                data-md-color={dataMdColor}
                style={getMdHighlightStyle(dataMdBg, theme, dataMdColor)}
              >
                {props.children}
              </mark>
            );
          },
          span: (props) => {
            const dataRef = (props as { 'data-ref'?: string })['data-ref'];
            const dataMdColor = (props as { 'data-md-color'?: string })['data-md-color'];
            if (dataRef != null) {
              const refIndex = parseInt(dataRef, 10);
              const isHighlighted = highlightedRefIndex === refIndex;
              const refStyle: React.CSSProperties = {
                ...textStyle,
                color: theme.palette.primary.main,
                textDecoration: 'underline',
                cursor: onRefHover || onRefClick ? 'pointer' : 'default',
                borderRadius: 4,
                padding: '0 2px',
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                ...(isHighlighted && {
                  backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.primary.main}30` : `${theme.palette.primary.main}20`,
                  boxShadow: `0 0 0 1px ${theme.palette.primary.main}40`,
                }),
              };
              return (
                <span
                  data-ref={dataRef}
                  role="button"
                  tabIndex={0}
                  style={refStyle}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRefClick?.(refIndex);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRefClick?.(refIndex);
                    }
                  }}
                  onMouseEnter={() => onRefHover?.(refIndex)}
                  onMouseLeave={() => onRefHover?.(null)}
                >
                  {props.children}
                </span>
              );
            }
            if (dataMdColor) {
              return (
                <span
                  data-md-color={dataMdColor}
                  className="md-color"
                  style={{ color: dataMdColor }}
                >
                  {props.children}
                </span>
              );
            }
            return <span {...props} style={textStyle}>{props.children}</span>;
          },
          strong: ({ children }) => <strong style={textStyle}>{children}</strong>,
          em: ({ children }) => <em style={textStyle}>{children}</em>,
          del: ({ children }) => <del style={{ ...textStyle, textDecoration: 'line-through' }}>{children}</del>,
          h1: ({ children }) => <h1 style={textStyle}>{children}</h1>,
          h2: ({ children }) => <h2 style={textStyle}>{children}</h2>,
          h3: ({ children }) => <h3 style={textStyle}>{children}</h3>,
          h4: ({ children }) => <h4 style={textStyle}>{children}</h4>,
          h5: ({ children }) => <h5 style={textStyle}>{children}</h5>,
          h6: ({ children }) => <h6 style={textStyle}>{children}</h6>,
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', ...textStyle }}>{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th style={{ ...textStyle, border: `1px solid ${theme.palette.divider}`, padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ ...textStyle, border: `1px solid ${theme.palette.divider}`, padding: '8px 12px' }}>
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ ...textStyle, color: theme.palette.mode === 'dark' ? 'rgba(245,245,245,0.9)' : theme.palette.text.secondary, marginLeft: 0, paddingLeft: 16, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} style={{ color: theme.palette.primary.main }} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              style={{
                maxWidth: '100%',
                maxHeight: 480,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                borderRadius: 8,
                marginTop: 8,
                marginBottom: 8,
              }}
              loading="lazy"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
