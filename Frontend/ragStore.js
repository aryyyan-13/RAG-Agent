import { create } from 'zustand';

export const useRAGStore = create((set) => ({
  domains: [],
  selectedDomain: null,
  documents: [],
  messages: [],
  uploadProgress: {},
  isLoading: false,

  // Domain management
  setDomains: (domains) => set({ domains }),
  setSelectedDomain: (domainId) => set({ selectedDomain: domainId }),

  // Document management
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => {
    set((state) => ({
      documents: [document, ...state.documents],
    }));
  },
  removeDocument: (documentId) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== documentId),
    }));
  },

  // Upload progress tracking
  setUploadProgress: (fileId, progress) => {
    set((state) => ({
      uploadProgress: {
        ...state.uploadProgress,
        [fileId]: progress,
      },
    }));
  },
  clearUploadProgress: (fileId) => {
    set((state) => {
      const { [fileId]: _, ...rest } = state.uploadProgress;
      return { uploadProgress: rest };
    });
  },

  // Chat management
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),

  // Loading state
  setIsLoading: (isLoading) => set({ isLoading }),
}));
