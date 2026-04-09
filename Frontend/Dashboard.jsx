import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  LogOut,
  FileText,
  Users,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useRAGStore } from '../store/ragStore';
import { domainAPI, documentAPI } from '../api/apiClient';
import DocumentUpload from '../components/DocumentUpload';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    domains,
    setDomains,
    selectedDomain,
    setSelectedDomain,
    documents,
    setDocuments,
    setMessages,
  } = useRAGStore();

  const [showNewDomainModal, setShowNewDomainModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDesc, setNewDomainDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalQueries: 0,
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      fetchDocuments(selectedDomain);
    }
  }, [selectedDomain]);

  const fetchDomains = async () => {
    try {
      setIsLoading(true);
      const data = await domainAPI.getDomains();
      setDomains(data);
      if (data.length > 0 && !selectedDomain) {
        setSelectedDomain(data[0].id);
      }
    } catch (err) {
      setError('Failed to load domains');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async (domainId) => {
    try {
      const data = await documentAPI.getDocuments(domainId);
      setDocuments(data);
      setStats((prev) => ({
        ...prev,
        totalDocuments: data.length,
      }));
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleCreateDomain = async (e) => {
    e.preventDefault();
    if (!newDomainName.trim()) {
      setError('Domain name is required');
      return;
    }

    try {
      const newDomain = await domainAPI.createDomain(
        newDomainName,
        newDomainDesc
      );
      setDomains([...domains, newDomain]);
      setSelectedDomain(newDomain.id);
      setNewDomainName('');
      setNewDomainDesc('');
      setShowNewDomainModal(false);
      setError('');
    } catch (err) {
      setError('Failed to create domain');
      console.error(err);
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm('Are you sure? This will delete all documents in this domain.')) {
      return;
    }

    try {
      await domainAPI.deleteDomain(domainId);
      setDomains(domains.filter((d) => d.id !== domainId));
      if (selectedDomain === domainId) {
        setSelectedDomain(domains[0]?.id || null);
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to delete domain');
      console.error(err);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      await documentAPI.deleteDocument(documentId);
      setDocuments(documents.filter((d) => d.id !== documentId));
      setStats((prev) => ({
        ...prev,
        totalDocuments: prev.totalDocuments - 1,
      }));
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartChat = () => {
    if (selectedDomain) {
      setMessages([]);
      navigate(`/chat/${selectedDomain}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header className="dashboard-header" variants={itemVariants}>
        <div className="header-left">
          <h1>Dashboard</h1>
          <p className="welcome-message">Welcome back, {user?.name || user?.email}!</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </motion.header>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dashboard-content">
        {/* Sidebar - Domains */}
        <motion.aside className="domains-sidebar" variants={itemVariants}>
          <div className="sidebar-header">
            <h2>Domains</h2>
            <button
              className="new-domain-btn"
              onClick={() => setShowNewDomainModal(true)}
              title="Create new domain"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="domains-list">
            {domains.length === 0 ? (
              <div className="empty-state">
                <FileText size={32} />
                <p>No domains yet</p>
                <button
                  className="create-first-btn"
                  onClick={() => setShowNewDomainModal(true)}
                >
                  Create Domain
                </button>
              </div>
            ) : (
              domains.map((domain) => (
                <motion.div
                  key={domain.id}
                  className={`domain-item ${selectedDomain === domain.id ? 'active' : ''}`}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedDomain(domain.id)}
                >
                  <span className="domain-name">{domain.name}</span>
                  <button
                    className="delete-domain-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDomain(domain.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {selectedDomain ? (
            <>
              {/* Statistics */}
              <motion.div className="stats-grid" variants={itemVariants}>
                <div className="stat-card">
                  <FileText size={28} />
                  <div>
                    <span className="stat-number">{stats.totalDocuments}</span>
                    <span className="stat-label">Documents</span>
                  </div>
                </div>
                <div className="stat-card">
                  <MessageSquare size={28} />
                  <div>
                    <span className="stat-number">{stats.totalQueries}</span>
                    <span className="stat-label">Queries</span>
                  </div>
                </div>
                <div className="stat-card">
                  <TrendingUp size={28} />
                  <div>
                    <span className="stat-number">
                      {documents.length > 0 ? '↑' : '—'}
                    </span>
                    <span className="stat-label">Status</span>
                  </div>
                </div>
              </motion.div>

              {/* Document Upload */}
              <motion.section className="section-card" variants={itemVariants}>
                <h2>Upload Documents</h2>
                <DocumentUpload domainId={selectedDomain} />
              </motion.section>

              {/* Documents List */}
              <motion.section className="section-card" variants={itemVariants}>
                <div className="section-header">
                  <h2>Documents in Domain</h2>
                  <span className="doc-count">({documents.length})</span>
                </div>

                {documents.length === 0 ? (
                  <div className="empty-docs">
                    <FileText size={40} />
                    <p>No documents yet. Upload some to get started!</p>
                  </div>
                ) : (
                  <div className="documents-grid">
                    {documents.map((doc) => (
                      <motion.div
                        key={doc.id}
                        className="document-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                      >
                        <div className="doc-header">
                          <FileText size={24} />
                          <button
                            className="doc-delete-btn"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h3>{doc.title}</h3>
                        <p className="doc-date">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>

              {/* Start Chat Button */}
              <motion.div className="action-buttons" variants={itemVariants}>
                <motion.button
                  className="primary-btn"
                  onClick={handleStartChat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageSquare size={20} />
                  <span>Start Chat</span>
                  <ChevronRight size={20} />
                </motion.button>
              </motion.div>
            </>
          ) : (
            <div className="no-domain-selected">
              <FileText size={48} />
              <h2>Select or Create a Domain</h2>
              <p>Choose a domain from the sidebar to get started</p>
              <button
                className="primary-btn"
                onClick={() => setShowNewDomainModal(true)}
              >
                Create Your First Domain
              </button>
            </div>
          )}
        </main>
      </div>

      {/* New Domain Modal */}
      <AnimatePresence>
        {showNewDomainModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewDomainModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Create New Domain</h2>
              <form onSubmit={handleCreateDomain}>
                <div className="form-group">
                  <label>Domain Name *</label>
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="e.g., Engineering, Marketing"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newDomainDesc}
                    onChange={(e) => setNewDomainDesc(e.target.value)}
                    placeholder="What is this domain for?"
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowNewDomainModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Create Domain
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
