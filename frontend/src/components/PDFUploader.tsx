import React, { useRef, useState } from 'react';
import { CloudArrowUpIcon, XMarkIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  onTextExtracted: (text: string) => void;
  onClear: () => void;
  title: string;
  currentFile: File | null;
  isLoading: boolean;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({
  onFileSelect,
  onTextExtracted,
  onClear,
  title,
  currentFile,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // 配置PDF.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.js';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
      await extractTextFromPDF(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
      await extractTextFromPDF(file);
    }
  };

  const extractTextFromPDF = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      onTextExtracted(fullText.trim());
    } catch (error) {
      console.error('PDF提取失败:', error);
      alert('PDF提取失败，请检查文件是否损坏');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
          <DocumentTextIcon className="text-blue-600 h-4 w-4" />
          {title}
        </h4>
      </div>

      {currentFile ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="text-green-600 h-5 w-5" />
              <div>
                <p className="font-medium text-gray-800">{currentFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(currentFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={onClear}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="text-blue-500 animate-spin h-6 w-6" />
              <span className="ml-2 text-gray-600">正在提取文本...</span>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p>文件已上传，文本提取完成</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`p-8 text-center transition-all cursor-pointer border-2 border-dashed ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
              <CloudArrowUpIcon className="text-gray-400 hover:text-blue-500 transition-colors h-8 w-8" />
              <h3 className="text-lg font-medium text-gray-700">上传PDF文件</h3>
              <p className="text-sm text-gray-500">
                拖拽PDF文件到此处，或点击选择文件
              </p>
            </div>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;