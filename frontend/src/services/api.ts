import axios from 'axios';
import { Project, Upload, ReconciliationSettings, ReconciliationResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE_URL
});

// Projects
export const projectApi = {
  create: (data: { name: string; description?: string; startDate: string; endDate: string }) =>
    client.post<Project>('/projects', data),
  list: () => client.get<Project[]>('/projects'),
  get: (id: string) => client.get<Project>(`/projects/${id}`),
  update: (id: string, data: Partial<Project>) => client.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => client.delete(`/projects/${id}`)
};

// Uploads
export const uploadApi = {
  upload: (projectId: string, fileType: 'books' | 'gstr2b', file: File, columnMapping?: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('fileType', fileType);
    if (columnMapping) {
      formData.append('columnMapping', JSON.stringify(columnMapping));
    }
    return client.post<Upload>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  get: (id: string) => client.get<Upload>(`/uploads/${id}`),
  preview: (id: string) => client.get(`/uploads/${id}/preview`)
};

// Reconciliations
export const reconciliationApi = {
  run: (projectId: string, booksUploadId: string, gstr2bUploadId: string, settings?: ReconciliationSettings) =>
    client.post<any>('/reconciliations/run', {
      projectId,
      booksUploadId,
      gstr2bUploadId,
      settings
    }),
  get: (id: string) => client.get<ReconciliationResult>(`/reconciliations/${id}`),
  getSummary: (id: string) => client.get(`/reconciliations/${id}/summary`),
  getDuplicates: (id: string) => client.get(`/reconciliations/${id}/duplicates`)
};

// Settings
export const settingsApi = {
  get: () => client.get<ReconciliationSettings>('/settings'),
  update: (settings: ReconciliationSettings) => client.put('/settings', settings)
};

export default client;
