import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Cloud,
  Github,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { useRAGStore } from '../store/ragStore';
import { documentAPI } from '../api/apiClient';
import '../styles/DocumentUpload.css';

export default function DocumentUpload({ domainId }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showGoogleDrive, setShowGoogleDrive] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { uploadProgress, setUploadProgress, clearUploadProgress } =
    useRAGStore();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  async function handleFileDrop(acceptedFiles) {
    const newFiles = [];

    for (const file of acceptedFiles) {
      const fileId = `${file.name}-${Date.now()}`;
      newFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0,
        file,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Upload files sequentially
    for (const fileData of newFiles) {
      try {
        setUploadProgress(fileData.id, 0);

        const result = await documentAPI.upload(
          fileData.file,
          domainId,
          (progress) => {
            setUploadProgress(fileData.id, progress);
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === fileData.id ? { ...f, progress } : f
              )
            );
          }
        );

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'success',
                  documentId: result.documentId,
                }
              : f
          )
        );

        clearUploadProgress(fileData.id);
      } catch (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'error',
                  error: error.response?.data?.error || 'Upload failed',
                }
              : f
          )
        );
      }
    }
  }

  const handleGoogleDriveAuth = async () => {
    // Placeholder for Google Drive integration
    // You'll need to implement OAuth flow
    alert(
      'Google Drive integration - implement OAuth2 flow with Google API'
    );
  };

  const handleGitHubAuth = async () => {
    // Placeholder for GitHub integration
    alert('GitHub integration - implement with GitHub API');
  };

  const removeFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    clearUploadProgress(fileId);
  };

  return (
    <div className="document-upload-container">
      {/* Main Upload Area */}
      <div
        {...getRootProps()}
        className={`upload-dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <motion.div
          className="upload-content"
          animate={{ scale: isDragActive ? 1.05 : 1 }}
        >
          <Upload size={40} />
          <h3>Drag & drop files here</h3>
          <p>or click to browse</p>
          <span className="file-types">
            Supports: PDF, TXT, MD, CSV, JSON (Max 50MB)
          </span>
        </motion.div>
      </div>

      {/* Cloud Integration Buttons */}
      <div className="cloud-integrations">
        <motion.button
          className="integration-btn google-drive"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoogleDriveAuth}
        >
          <Cloud size={20} />
          <span>Google Drive</span>
        </motion.button>

        <motion.button
          className="integration-btn github"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGitHubAuth}
        >
          <Github size={20} />
          <span>GitHub</span>
        </motion.button>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            className="upload-progress-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                className={`upload-item status-${file.status}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="file-info">
                  <FileText size={20} />
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <div className="file-status">
                  {file.status === 'uploading' && (
                    <>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="progress-text">{file.progress}%</span>
                    </>
                  )}

                  {file.status === 'success' && (
                    <motion.div
                      className="status-icon success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <CheckCircle size={24} />
                    </motion.div>
                  )}

                  {file.status === 'error' && (
                    <motion.div
                      className="status-icon error"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <AlertCircle size={24} />
                    </motion.div>
                  )}
                </div>

                {file.status !== 'uploading' && (
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(file.id)}
                  >
                    <X size={18} />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Messages */}
      <AnimatePresence>
        {uploadedFiles.some((f) => f.status === 'error') && (
          <motion.div
            className="error-summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle size={18} />
            <span>
              {uploadedFiles.filter((f) => f.status === 'error').length} file(s)
              failed to upload
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
