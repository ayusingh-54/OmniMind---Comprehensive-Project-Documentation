import React, { useMemo } from 'react';
import { X, Shield, Check, Server, Database, Search, Globe, Lock, Cloud } from 'lucide-react';
import { useMessages, useAgents, useUsers } from '../context/ChatContext';

interface PrivacyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrivacyItem {
  label: string;
  value: string;
  status: 'local' | 'private' | 'none' | 'cloud';
  icon: React.ReactNode;
}

// Token estimation: ~4 chars per token for English, ~1.5 for Chinese
const estimateTokens = (text: string): number => {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
};

export const PrivacyPanel: React.FC<PrivacyPanelProps> = ({ isOpen, onClose }) => {
  const messages = useMessages();
  const agents = useAgents();
  const users = useUsers();

  // Compute real statistics
  const stats = useMemo(() => {
    // Get agent user IDs
    const agentUserIds = new Set(
      users.filter(u => u.type === 'agent' || u.isLLM).map(u => u.id)
    );

    // Count messages by type
    const agentMessages = messages.filter(m => agentUserIds.has(m.senderId));
    const humanMessages = messages.filter(m => !agentUserIds.has(m.senderId));

    // Estimate tokens for all messages
    const totalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

    return {
      totalMessages: messages.length,
      agentMessages: agentMessages.length,
      humanMessages: humanMessages.length,
      totalTokens,
    };
  }, [messages, users]);

  // Determine LLM runtime info from active agents
  const llmInfo = useMemo(() => {
    const activeAgents = agents.filter(a => a.status === 'active');
    if (activeAgents.length === 0) {
      return { provider: 'Not configured', isLocal: true };
    }

    // Check if any agent config contains "parallax" (case insensitive)
    const hasParallax = activeAgents.some(a => {
      const configStr = JSON.stringify(a).toLowerCase();
      return configStr.includes('parallax');
    });

    // Get provider info for non-parallax agents
    const providers = [...new Set(activeAgents.map(a => a.model?.provider || a.runtime?.type).filter(Boolean))];

    return {
      provider: hasParallax ? 'Parallax Local Node' : (providers.join(', ') || 'Cloud API'),
      isLocal: hasParallax,
      activeCount: activeAgents.length,
    };
  }, [agents]);

  const privacyItems: PrivacyItem[] = [
    {
      label: 'LLM Inference',
      value: llmInfo.provider,
      status: llmInfo.isLocal ? 'local' : 'cloud',
      icon: llmInfo.isLocal ? <Server size={16} /> : <Cloud size={16} />,
    },
    {
      label: 'Data Storage',
      value: 'lowdb Local JSON',
      status: 'local',
      icon: <Database size={16} />,
    },
    {
      label: 'RAG Vector Store',
      value: 'ChromaDB Local',
      status: 'local',
      icon: <Database size={16} />,
    },
    {
      label: 'Web Search',
      value: 'DuckDuckGo (Privacy-first)',
      status: 'private',
      icon: <Search size={16} />,
    },
    {
      label: 'External API Calls',
      value: llmInfo.isLocal ? 'None' : 'Cloud LLM API',
      status: llmInfo.isLocal ? 'none' : 'cloud',
      icon: <Globe size={16} />,
    },
  ];

  const getStatusColor = (status: PrivacyItem['status']) => {
    switch (status) {
      case 'local':
        return '#10b981'; // green
      case 'private':
        return '#10b981'; // green
      case 'none':
        return '#10b981'; // green (none is good for external APIs)
      case 'cloud':
        return '#f59e0b'; // amber for cloud services
      default:
        return '#6b7280';
    }
  };

  const getStatusBadge = (status: PrivacyItem['status']) => {
    switch (status) {
      case 'local':
        return 'Local';
      case 'private':
        return 'Private';
      case 'none':
        return 'Secure';
      case 'cloud':
        return 'Cloud';
      default:
        return '';
    }
  };

  // Determine overall privacy status
  const overallStatus = useMemo(() => {
    const hasCloud = !llmInfo.isLocal;
    if (hasCloud) {
      return { label: 'Partial Cloud', isSecure: false };
    }
    return { label: 'All Running Locally', isSecure: true };
  }, [llmInfo.isLocal]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`privacy-panel-backdrop${isOpen ? ' open' : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`privacy-panel${isOpen ? ' open' : ''}`}>
        {/* Header */}
        <div className="privacy-panel-header">
          <div className="privacy-panel-title">
            <Shield size={20} />
            <span>Privacy Audit</span>
          </div>
          <button className="privacy-panel-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="privacy-panel-content">
          {/* Status Banner */}
          <div className={`privacy-status-banner${overallStatus.isSecure ? '' : ' warning'}`}>
          <div className="privacy-status-icon">
            <Shield size={24} />
          </div>
          <div className="privacy-status-info">
            <span className="privacy-status-label">Current Status</span>
            <span className="privacy-status-value">{overallStatus.label}</span>
          </div>
          <div className={`privacy-status-badge${overallStatus.isSecure ? '' : ' warning'}`}>
            <Check size={14} />
            <span>{overallStatus.isSecure ? 'Secure' : 'Caution'}</span>
          </div>
        </div>

        {/* Privacy Items */}
        <div className="privacy-section">
          <div className="privacy-section-title">Data Flow</div>
          <div className="privacy-items">
            {privacyItems.map((item, index) => (
              <div key={index} className="privacy-item">
                <div className="privacy-item-left">
                  <div className="privacy-item-icon" style={{ color: getStatusColor(item.status) }}>
                    {item.icon}
                  </div>
                  <div className="privacy-item-info">
                    <span className="privacy-item-label">{item.label}</span>
                    <span className="privacy-item-value">{item.value}</span>
                  </div>
                </div>
                <div
                  className="privacy-item-badge"
                  style={{ backgroundColor: `${getStatusColor(item.status)}15`, color: getStatusColor(item.status) }}
                >
                  <Check size={12} />
                  <span>{getStatusBadge(item.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Stats */}
        <div className="privacy-section">
          <div className="privacy-section-title">
            <Database size={16} />
            <span>Message Statistics</span>
          </div>
          <div className="privacy-cost-card">
            <div className="privacy-cost-row">
              <span className="privacy-cost-label">Total Messages</span>
              <span className="privacy-cost-value">{stats.totalMessages}</span>
            </div>
            <div className="privacy-cost-row">
              <span className="privacy-cost-label">User Messages</span>
              <span className="privacy-cost-value">{stats.humanMessages}</span>
            </div>
            <div className="privacy-cost-row">
              <span className="privacy-cost-label">Agent Replies</span>
              <span className="privacy-cost-value">{stats.agentMessages}</span>
            </div>
            <div className="privacy-cost-row">
              <span className="privacy-cost-label">Estimated Tokens</span>
              <span className="privacy-cost-value">{stats.totalTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>
        </div>

        {/* Footer Notice */}
        <div className={`privacy-footer${overallStatus.isSecure ? '' : ' warning'}`}>
          <Lock size={14} />
          <span>{overallStatus.isSecure ? 'Your data never leaves your local network' : 'Some data may be sent to cloud APIs'}</span>
        </div>
      </div>

      <style>{`
        .privacy-panel-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
          z-index: 49;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .privacy-panel-backdrop.open {
          opacity: 1;
          visibility: visible;
        }

        .privacy-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 360px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border-left: 1px solid var(--border-light);
          z-index: 50;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .privacy-panel.open {
          transform: translateX(0);
        }

        .privacy-panel-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
          background: rgba(255, 255, 255, 0.8);
        }

        .privacy-panel-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .privacy-panel-title svg {
          color: #10b981;
        }

        .privacy-panel-close {
          padding: 6px;
          border-radius: 8px;
          color: var(--text-tertiary);
          transition: all 0.2s ease;
        }

        .privacy-panel-close:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .privacy-panel-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
          padding-bottom: 16px;
        }

        .privacy-status-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
        }

        .privacy-status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(16, 185, 129, 0.15);
          border-radius: 12px;
          color: #10b981;
        }

        .privacy-status-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .privacy-status-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .privacy-status-value {
          font-size: 1rem;
          font-weight: 600;
          color: #10b981;
        }

        .privacy-status-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #10b981;
          color: white;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Warning state styles */
        .privacy-status-banner.warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
          border-color: rgba(245, 158, 11, 0.2);
        }

        .privacy-status-banner.warning .privacy-status-icon {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        .privacy-status-banner.warning .privacy-status-value {
          color: #f59e0b;
        }

        .privacy-status-badge.warning {
          background: #f59e0b;
        }

        .privacy-footer.warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%);
          color: #f59e0b;
        }

        .privacy-section {
          padding: 0 16px;
          margin-bottom: 20px;
        }

        .privacy-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .privacy-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .privacy-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .privacy-item:hover {
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
        }

        .privacy-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .privacy-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
        }

        .privacy-item-info {
          display: flex;
          flex-direction: column;
        }

        .privacy-item-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .privacy-item-value {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .privacy-item-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .privacy-cost-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 16px;
        }

        .privacy-cost-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-light);
        }

        .privacy-cost-row:last-of-type {
          border-bottom: none;
        }

        .privacy-cost-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .privacy-cost-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
        }


        .privacy-footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%);
          border-top: 1px solid var(--border-light);
          color: #10b981;
          font-size: 0.8rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .privacy-panel {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};
