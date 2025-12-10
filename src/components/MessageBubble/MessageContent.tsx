import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { User } from '../../types/chat';
import './styles.css';

/**
 * Extract final reply, removing thinking/analysis parts
 */
function stripSpecialTags(text: string): string {
    if (!text) return '';

    let result = text;

    // Format: <|channel|>analysis<|message|>...<|end|><|start|>assistant<|channel|>final<|message|>actual reply
    // Try to extract final message
    const finalMatch = result.match(/<\|channel\|>final<\|message\|>([\s\S]*?)(?:<\|end\|>|$)/);
    if (finalMatch) {
        result = finalMatch[1];
    }

    // Remove <think>...</think>
    result = result.replace(/<think>[\s\S]*?<\/think>/g, '');
    // Remove remaining special tags
    result = result.replace(/<\|[^>]+\|>/g, '');
    // Clean up extra blank lines
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
}

interface MessageContentProps {
    content: string;
    users: User[];
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, users }) => {
    const processedContent = useMemo(() => {
        // First filter special tags
        const cleanContent = stripSpecialTags(content);
        return cleanContent.replace(/@([\p{L}\p{N}_\-\.]+)/gu, (match, username) => {
            const user = users.find(u =>
                u.name.toLowerCase() === username.toLowerCase() ||
                u.id === username
            );
            return user ? `[@${username}](mention://${user.id})` : match;
        });
    }, [content, users]);

    const urlTransform = (href: string) => {
        if (href.startsWith('mention://')) return href;
        const safeHref = href.trim().toLowerCase();
        if (safeHref.startsWith('javascript:') || safeHref.startsWith('data:')) {
            return '';
        }
        return href;
    };

    return (
        <div className="bubble-text markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                urlTransform={urlTransform}
                components={{
                    a: ({ node, href, children, ...props }) => {
                        if (href?.startsWith('mention://')) {
                            const userId = href.replace('mention://', '');
                            const user = users.find(u => u.id === userId);
                            return (
                                <span
                                    className="mention-highlight"
                                    title={user ? `@${user.name}` : undefined}
                                >
                                    {children}
                                </span>
                            );
                        }
                        return <a href={href} {...props}>{children}</a>;
                    },
                    p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
                    li: ({ children }) => <li style={{ margin: 0, padding: 0 }}>{children}</li>,
                    ul: ({ children }) => <ul style={{ margin: '0.2em 0', paddingLeft: '1.4em' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ margin: '0.2em 0', paddingLeft: '1.4em' }}>{children}</ol>
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};
