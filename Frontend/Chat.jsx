import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ArrowLeft,
  FileText,
  Loader,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Download,
} from 'lucide-react';
import { useRAGStore } from '../store/ragStore';
import { chatAPI } from '../api/apiClient';
import '../styles/Chat.css';

export default function Chat() {
  const { domainId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const { messages, addMessage, setMessages } = useRAGStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSources, setShowSources] = useState({});
  const [copied, setCopied] = useState(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setError('');

    // Add user message
    addMessage({
      id: Date.now(),
      type: 'user',
      content: userQuery,
      timestamp: new Date(),
    });

    setIsLoading(true);

    try {
      const response = await chatAPI.query(userQuery, domainId);

      // Add assistant message
      addMessage({
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response,
        sources: response.sources || [],
        confidence: response.confidenceScore || 0,
        retrievedDocuments: response.retrievedDocuments || 0,
        timestamp: new Date(),
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to process query. Please try again.'
      );
      addMessage({
        id: Date.now() + 1,
        type: 'error',
        content:
          err.response?.data?.error ||
          'Failed to process your query. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, msgId) => {
    navigator.clipboard.writeText(text);
    setCopied(msgId);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadConversation = () => {
    const text = messages
      .map(
        (msg) =>
          `[${msg.type.toUpperCase()}] ${new Date(msg.timestamp).toLocaleTimeString()}\n${msg.content}\n`
      )
      .join('\n---\n\n');

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    );
    element.setAttribute('download', `chat-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <header className="chat-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1>RAG Assistant Chat</h1>
        <button className="download-btn" onClick={downloadConversation}>
          <Download size={20} />
          <span>Export</span>
        </button>
      </header>

      {/* Messages Container */}
      <div className="messages-container">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              className="empty-chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="empty-icon">
                <FileText size={48} />
              </div>
              <h2>Start a Conversation</h2>
              <p>Ask questions about your documents</p>
            </motion.div>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                className={`message message-${msg.type}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="message-content">
                  <p className="message-text">{msg.content}</p>

                  {/* Action Buttons for Assistant Messages */}
                  {msg.type === 'assistant' && (
                    <div className="message-actions">
                      <button
                        className="action-btn"
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        title="Copy message"
                      >
                        <Copy size={16} />
                        {copied === msg.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button className="action-btn" title="Helpful">
                        <ThumbsUp size={16} />
                      </button>
                      <button className="action-btn" title="Not helpful">
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  )}

                  {/* Sources for Assistant Messages */}
                  {msg.type === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <motion.div
                      className="sources-section"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <button
                        className="sources-toggle"
                        onClick={() =>
                          setShowSources((prev) => ({
                            ...prev,
                            [msg.id]: !prev[msg.id],
                          }))
                        }
                      >
                        <FileText size={16} />
                        <span>
                          {msg.sources.length} source
                          {msg.sources.length !== 1 ? 's' : ''} cited
                        </span>
                      </button>

                      {showSources[msg.id] && (
                        <motion.div
                          className="sources-list"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                        >
                          {msg.sources.map((source, idx) => (
                            <div key={idx} className="source-item">
                              <div className="source-header">
                                <span className="source-title">
                                  {source.title}
                                </span>
                                <span className="source-similarity">
                                  {(source.similarity * 100).toFixed(0)}% match
                                </span>
                              </div>
                              {source.domain && (
                                <span className="source-domain">
                                  Domain: {source.domain}
                                </span>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Confidence Score */}
                  {msg.type === 'assistant' && msg.confidence !== undefined && (
                    <div className="confidence-meter">
                      <span>Confidence:</span>
                      <div className="meter-bar">
                        <motion.div
                          className="meter-fill"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.round(msg.confidence * 100)}%`,
                          }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        />
                      </div>
                      <span className="meter-text">
                        {Math.round(msg.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                <span className="message-time">
                  {msg.timestamp?.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </motion.div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              className="message message-loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Processing your query...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {error && (
          <motion.div
            className="chat-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </motion.div>
        )}

        <form onSubmit={handleSendQuery} className="chat-input-form">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendQuery(e);
              }
            }}
            placeholder="Ask a question about your documents... (Shift+Enter for new line)"
            rows="3"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="send-btn"
          >
            {isLoading ? (
              <Loader className="spinner" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>

        <p className="input-hint">
          💡 Tip: Ask specific questions to get better answers with relevant sources
        </p>
      </div>
    </div>
  );
}
