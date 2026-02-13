/**
 * 文档上传页面
 */
import React, { useState, useRef } from 'react';
import { documentApi } from '../services/api';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { draftStorage } from '../utils/draftStorage';

interface DocumentUploadProps {
  fileContent: string;
  onFileUpload: (content: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  fileContent,
  onFileUpload,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setMessage(null);

      const response = await documentApi.uploadFile(file);
      
      if (response.data.success && response.data.file_content) {
        // 上传新招标文件：清空上一轮 localStorage
        draftStorage.clearAll();
        onFileUpload(response.data.file_content);
        setMessage({ type: 'success', text: response.data.message });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || '文件上传失败' });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile(file);
      handleFileUpload(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📤 上传招标文件</h2>
          <p className="text-gray-600">支持 .doc, .docx, .pdf 格式文件</p>
        </div>

        {/* 文件上传区域 */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${fileContent ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".doc,.docx,.pdf"
            className="hidden"
          />

          {fileContent ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <DocumentIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">文件已上传</h3>
              <p className="text-sm text-gray-500">可以继续下一步进行标书解析</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">拖拽文件到此处或点击上传</h3>
              <p className="text-sm text-gray-500 mb-4">最大支持 10MB 文件</p>
              <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                选择文件
              </div>
            </div>
          )}
        </div>

        {uploading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 text-sm text-blue-600">
              <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              正在上传和处理文件...
            </div>
          </div>
        )}

        {/* 消息提示 */}
        {message && (
          <div className={`mt-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;