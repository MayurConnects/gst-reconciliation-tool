import React, { useState } from 'react';
import { uploadApi } from '../services/api';

function Upload() {
  const [projectId, setProjectId] = useState('');
  const [fileType, setFileType] = useState<'books' | 'gstr2b'>('books');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !projectId) {
      alert('Please select a file and project');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadApi.upload(projectId, fileType, file);
      setUploadedFiles([...uploadedFiles, response.data]);
      setFile(null);
      setFileType('books');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-neutral-900 mb-8">Upload Data Files</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-6 sticky top-8">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Upload File</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Project</label>
                <input
                  type="text"
                  placeholder="Project ID"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">File Type</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as 'books' | 'gstr2b')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="books">Books/Purchase Register</option>
                  <option value="gstr2b">GSTR-2B</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Excel File</label>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-blue-500 transition-all">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <div className="text-3xl mb-2">📁</div>
                    <p className="text-sm font-medium text-neutral-900">{file?.name || 'Click to select file'}</p>
                    <p className="text-xs text-neutral-500">Excel (.xlsx, .xls)</p>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </form>
          </div>
        </div>

        {/* Uploaded Files List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Uploaded Files</h2>
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-neutral-500">No files uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-neutral-900">{file.fileName}</p>
                        <p className="text-sm text-neutral-500">{file.fileType === 'books' ? '📕 Books' : '📗 GSTR-2B'}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">✓ Uploaded</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                      <p>Invoices: {file.invoiceCount}</p>
                      <p>Errors: {file.errorCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upload;
