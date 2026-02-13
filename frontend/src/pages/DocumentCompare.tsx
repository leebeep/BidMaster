import React, { useState, useMemo } from 'react';
import { DocumentTextIcon, ArrowPathIcon, CodeBracketIcon, PlusIcon, MinusIcon, PencilIcon, EyeIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import PDFUploader from '../components/PDFUploader';

interface WordDiff {
  type: 'add' | 'delete' | 'modify' | 'equal';
  content: string;
}

interface LineDiff {
  type: 'add' | 'delete' | 'modify' | 'equal';
  originalContent?: string;
  newContent?: string;
  wordDiffs?: WordDiff[];
  originalIndex?: number;
  newIndex?: number;
}

const DocumentCompare: React.FC = () => {
  const [leftDoc, setLeftDoc] = useState(`第一个文档内容示例
这是第二行内容
共同的内容保持不变
需要修改的行内容
第五行的原始内容`);
  
  const [rightDoc, setRightDoc] = useState(`第一个文档内容示例
这是修改后的第二行内容
共同的内容保持不变
需要修改的行内容已经改变
第五行的新内容
这是新增的最后一行`);

  const [viewMode, setViewMode] = useState<'split' | 'inline'>('inline');
  const [inputMode, setInputMode] = useState<'text' | 'pdf'>('text');
  const [leftPdfFile, setLeftPdfFile] = useState<File | null>(null);
  const [rightPdfFile, setRightPdfFile] = useState<File | null>(null);
  const [isLoadingLeft, setIsLoadingLeft] = useState(false);
  const [isLoadingRight, setIsLoadingRight] = useState(false);

  // 计算字符串相似度
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // 计算编辑距离
  const getEditDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1];
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i - 1] + 1,
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // 字词级别差异检测
  const getWordDiffs = (oldText: string, newText: string): WordDiff[] => {
    const oldWords = oldText.split(/(\s+|[，。！？；：""''（）【】《》、])/);
    const newWords = newText.split(/(\s+|[，。！？；：""''（）【】《》、])/);
    
    // 简化的字词级LCS算法
    const m = oldWords.length;
    const n = newWords.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldWords[i - 1] === newWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // 回溯构建字词差异
    const buildWordDiff = (i: number, j: number): WordDiff[] => {
      if (i === 0 && j === 0) return [];
      if (i === 0) {
        return [...buildWordDiff(i, j - 1), { type: 'add', content: newWords[j - 1] }];
      }
      if (j === 0) {
        return [...buildWordDiff(i - 1, j), { type: 'delete', content: oldWords[i - 1] }];
      }
      
      if (oldWords[i - 1] === newWords[j - 1]) {
        return [...buildWordDiff(i - 1, j - 1), { type: 'equal', content: oldWords[i - 1] }];
      }
      
      if (dp[i - 1][j] > dp[i][j - 1]) {
        return [...buildWordDiff(i - 1, j), { type: 'delete', content: oldWords[i - 1] }];
      } else {
        return [...buildWordDiff(i, j - 1), { type: 'add', content: newWords[j - 1] }];
      }
    };
    
    return buildWordDiff(m, n);
  };

  const diffResults = useMemo(() => {
    const leftLines = leftDoc.split('\n');
    const rightLines = rightDoc.split('\n');
    const results: LineDiff[] = [];
    
    // 行级别的LCS算法
    const m = leftLines.length;
    const n = rightLines.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (leftLines[i - 1] === rightLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // 回溯构建行差异
    const buildLineDiff = (i: number, j: number): LineDiff[] => {
      if (i === 0 && j === 0) return [];
      if (i === 0) {
        return [...buildLineDiff(i, j - 1), { 
          type: 'add', 
          newContent: rightLines[j - 1],
          newIndex: j - 1
        }];
      }
      if (j === 0) {
        return [...buildLineDiff(i - 1, j), { 
          type: 'delete', 
          originalContent: leftLines[i - 1],
          originalIndex: i - 1
        }];
      }
      
      if (leftLines[i - 1] === rightLines[j - 1]) {
        return [...buildLineDiff(i - 1, j - 1), { 
          type: 'equal', 
          originalContent: leftLines[i - 1],
          newContent: rightLines[j - 1],
          originalIndex: i - 1,
          newIndex: j - 1
        }];
      }
      
      // 检查是否为修改行（相似度较高）
      const similarity = calculateSimilarity(leftLines[i - 1], rightLines[j - 1]);
      if (similarity > 0.3 && dp[i - 1][j - 1] + 1 >= Math.max(dp[i - 1][j], dp[i][j - 1])) {
        const wordDiffs = getWordDiffs(leftLines[i - 1], rightLines[j - 1]);
        return [...buildLineDiff(i - 1, j - 1), {
          type: 'modify',
          originalContent: leftLines[i - 1],
          newContent: rightLines[j - 1],
          wordDiffs,
          originalIndex: i - 1,
          newIndex: j - 1
        }];
      }
      
      if (dp[i - 1][j] > dp[i][j - 1]) {
        return [...buildLineDiff(i - 1, j), { 
          type: 'delete', 
          originalContent: leftLines[i - 1],
          originalIndex: i - 1
        }];
      } else {
        return [...buildLineDiff(i, j - 1), { 
          type: 'add', 
          newContent: rightLines[j - 1],
          newIndex: j - 1
        }];
      }
    };

    return buildLineDiff(m, n);
  }, [leftDoc, rightDoc]);

  const stats = useMemo(() => {
    const added = diffResults.filter(r => r.type === 'add').length;
    const deleted = diffResults.filter(r => r.type === 'delete').length;
    const modified = diffResults.filter(r => r.type === 'modify').length;
    return { added, deleted, modified };
  }, [diffResults]);

  const reset = () => {
    if (inputMode === 'text') {
      setLeftDoc('');
      setRightDoc('');
    } else {
      setLeftDoc('');
      setRightDoc('');
      setLeftPdfFile(null);
      setRightPdfFile(null);
    }
  };

  const handleLeftPdfSelect = (file: File) => {
    setIsLoadingLeft(true);
    setLeftPdfFile(file);
  };

  const handleRightPdfSelect = (file: File) => {
    setIsLoadingRight(true);
    setRightPdfFile(file);
  };

  const handleLeftTextExtracted = (text: string) => {
    setLeftDoc(text);
    setIsLoadingLeft(false);
  };

  const handleRightTextExtracted = (text: string) => {
    setRightDoc(text);
    setIsLoadingRight(false);
  };

  const handleClearLeftPdf = () => {
    setLeftPdfFile(null);
    setLeftDoc('');
    setIsLoadingLeft(false);
  };

  const handleClearRightPdf = () => {
    setRightPdfFile(null);
    setRightDoc('');
    setIsLoadingRight(false);
  };

  // 渲染字词差异
  const renderWordDiffs = (wordDiffs: WordDiff[]) => {
    return (
      <span className="inline">
        {wordDiffs.map((word, index) => {
          switch (word.type) {
            case 'add':
              return (
                <span key={index} className="bg-green-200 text-green-800 px-1 rounded font-semibold">
                  {word.content}
                </span>
              );
            case 'delete':
              return (
                <span key={index} className="bg-red-200 text-red-800 px-1 rounded line-through opacity-75">
                  {word.content}
                </span>
              );
            case 'equal':
              return <span key={index}>{word.content}</span>;
            default:
              return <span key={index}>{word.content}</span>;
          }
        })}
      </span>
    );
  };

  const renderInlineDiff = () => {
    return (
      <div className="space-y-1">
        {diffResults.map((result, index) => {
          const baseClasses = "px-4 py-3 font-mono text-sm leading-relaxed border-l-4 relative group";
          
          switch (result.type) {
            case 'add':
              return (
                <div key={index} className={`${baseClasses} bg-green-50 border-green-400 hover:bg-green-100 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs bg-green-100 px-2 py-1 rounded-full flex-shrink-0">
                      <PlusIcon className="h-3 w-3" /> 新增
                    </span>
                    <span className="text-green-800 flex-1 break-words">{result.newContent || '(空行)'}</span>
                  </div>
                </div>
              );
            case 'delete':
              return (
                <div key={index} className={`${baseClasses} bg-red-50 border-red-400 hover:bg-red-100 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-xs bg-red-100 px-2 py-1 rounded-full flex-shrink-0">
                      <MinusIcon className="h-3 w-3" /> 删除
                    </span>
                    <span className="text-red-800 flex-1 line-through opacity-75 break-words">{result.originalContent || '(空行)'}</span>
                  </div>
                </div>
              );
            case 'modify':
              return (
                <div key={index} className={`${baseClasses} bg-orange-50 border-orange-400 hover:bg-orange-100 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center gap-1 text-orange-600 font-semibold text-xs bg-orange-100 px-2 py-1 rounded-full flex-shrink-0">
                      <PencilIcon className="h-3 w-3" /> 修改
                    </span>
                    <div className="flex-1 break-words">
                      {result.wordDiffs ? renderWordDiffs(result.wordDiffs) : result.newContent}
                    </div>
                  </div>
                </div>
              );
            case 'equal':
              return (
                <div key={index} className={`${baseClasses} bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <span className="w-12 h-6 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                      {(result.originalIndex || 0) + 1}
                    </span>
                    <span className="text-gray-700 flex-1 break-words">{result.originalContent || '(空行)'}</span>
                  </div>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  const renderSplitDiff = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 原始文档视图 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                原始文档
              </h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {leftDoc.split('\n').map((line, index) => {
              const diffItem = diffResults.find(r => r.originalIndex === index);
              const isDeleted = diffItem?.type === 'delete';
              const isModified = diffItem?.type === 'modify';
              const isEqual = diffItem?.type === 'equal';
              
              return (
                <div key={index} className={`px-4 py-3 border-l-4 font-mono text-sm ${
                  isDeleted 
                    ? 'bg-red-50 border-red-400 text-red-800' 
                    : isModified
                    ? 'bg-orange-50 border-orange-400 text-orange-800'
                    : isEqual 
                    ? 'bg-gray-50 border-gray-200 text-gray-700'
                    : 'bg-white border-gray-100 text-gray-600'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{index + 1}</span>
                    <span className={`flex-1 break-words ${isDeleted ? 'line-through opacity-75' : ''}`}>
                      {isModified && diffItem?.wordDiffs ? (
                        <span className="inline">
                          {diffItem.wordDiffs.map((word, wordIndex) => {
                            if (word.type === 'delete' || word.type === 'equal') {
                              return (
                                <span key={wordIndex} className={word.type === 'delete' ? 'bg-red-200 text-red-800 px-1 rounded line-through' : ''}>
                                  {word.content}
                                </span>
                              );
                            }
                            return null;
                          })}
                        </span>
                      ) : (
                        line || '(空行)'
                      )}
                    </span>
                    {isDeleted && (
                      <span className="text-red-600 text-xs bg-red-100 px-2 py-1 rounded-full flex-shrink-0">
                        <MinusIcon className="h-2.5 w-2.5" />
                      </span>
                    )}
                    {isModified && (
                      <span className="text-orange-600 text-xs bg-orange-100 px-2 py-1 rounded-full flex-shrink-0">
                        <PencilIcon className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 目标文档视图 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-green-600" />
                目标文档
              </h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {rightDoc.split('\n').map((line, index) => {
              const diffItem = diffResults.find(r => r.newIndex === index);
              const isAdded = diffItem?.type === 'add';
              const isModified = diffItem?.type === 'modify';
              const isEqual = diffItem?.type === 'equal';
              
              return (
                <div key={index} className={`px-4 py-3 border-l-4 font-mono text-sm ${
                  isAdded 
                    ? 'bg-green-50 border-green-400 text-green-800' 
                    : isModified
                    ? 'bg-orange-50 border-orange-400 text-orange-800'
                    : isEqual 
                    ? 'bg-gray-50 border-gray-200 text-gray-700'
                    : 'bg-white border-gray-100 text-gray-600'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{index + 1}</span>
                    <span className="flex-1 break-words">
                      {isModified && diffItem?.wordDiffs ? (
                        <span className="inline">
                          {diffItem.wordDiffs.map((word, wordIndex) => {
                            if (word.type === 'add' || word.type === 'equal') {
                              return (
                                <span key={wordIndex} className={word.type === 'add' ? 'bg-green-200 text-green-800 px-1 rounded font-semibold' : ''}>
                                  {word.content}
                                </span>
                              );
                            }
                            return null;
                          })}
                        </span>
                      ) : (
                        line || '(空行)'
                      )}
                    </span>
                    {isAdded && (
                      <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded-full flex-shrink-0">
                        <PlusIcon className="h-2.5 w-2.5" />
                      </span>
                    )}
                    {isModified && (
                      <span className="text-orange-600 text-xs bg-orange-100 px-2 py-1 rounded-full flex-shrink-0">
                        <PencilIcon className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-gray-600">采用LCS算法实现字词级差异检测，支持多格式上传，两种模式直观展示文档变化</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-md border border-green-200">
            <div className="flex items-center gap-2 text-green-600">
              <PlusIcon className="h-5 w-5" />
              <span className="font-semibold">新增行数</span>
            </div>
            <div className="text-2xl font-bold text-green-700 mt-1">{stats.added}</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-md border border-red-200">
            <div className="flex items-center gap-2 text-red-600">
              <MinusIcon className="h-5 w-5" />
              <span className="font-semibold">删除行数</span>
            </div>
            <div className="text-2xl font-bold text-red-700 mt-1">{stats.deleted}</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-md border border-orange-200">
            <div className="flex items-center gap-2 text-orange-600">
              <PencilIcon className="h-5 w-5" />
              <span className="font-semibold">修改行数</span>
            </div>
            <div className="text-2xl font-bold text-orange-700 mt-1">{stats.modified}</div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-8 items-center mb-6">
          <div className="flex bg-white rounded-lg shadow-md p-1 border border-gray-200">
            <button
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                inputMode === 'text'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <PencilIcon className="h-4 w-4" />
              文本输入
            </button>
            <button
              onClick={() => setInputMode('pdf')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                inputMode === 'pdf'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              PDF上传
            </button>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-white rounded-lg shadow-md p-1 border border-gray-200">
              <button
                  onClick={() => setViewMode('inline')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'inline'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  内联标识
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'split'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <CodeBracketIcon className="h-4 w-4" />
                  并联对比
                </button>
            </div>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              重置
            </button>
          </div>
        </div>

        {/* Input Area */}
        {inputMode === 'text' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <DocumentTextIcon className="text-blue-600 h-5 w-5" />
                原始文档
                </h4>
              </div>
              <textarea
                value={leftDoc}
                onChange={(e) => setLeftDoc(e.target.value)}
                className="w-full h-64 p-4 font-mono text-sm border-none resize-none focus:ring-0"
                placeholder="请输入原始文档内容..."
              />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <DocumentTextIcon className="text-green-600 h-5 w-5" />
                目标文档
                </h4>
              </div>
              <textarea
                value={rightDoc}
                onChange={(e) => setRightDoc(e.target.value)}
                className="w-full h-64 p-4 font-mono text-sm border-none resize-none focus:ring-0"
                placeholder="请输入目标文档内容..."
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <PDFUploader
              onFileSelect={handleLeftPdfSelect}
              onTextExtracted={handleLeftTextExtracted}
              onClear={handleClearLeftPdf}
              title="原始文档"
              currentFile={leftPdfFile}
              isLoading={isLoadingLeft}
            />
            <PDFUploader
              onFileSelect={handleRightPdfSelect}
              onTextExtracted={handleRightTextExtracted}
              onClear={handleClearRightPdf}
              title="目标文档"
              currentFile={rightPdfFile}
              isLoading={isLoadingRight}
            />
          </div>
        )}



        {/* Diff Results */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <CodeBracketIcon className="h-5 w-5 text-blue-600" />
              差异对比结果
            </h3>
          </div>
          <div className="p-4">
            {viewMode === 'inline' ? renderInlineDiff() : renderSplitDiff()}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">图例说明</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <PlusIcon className="text-green-600 h-4 w-4" />
              <span className="font-medium text-green-800">新增内容</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <MinusIcon className="text-red-600 h-4 w-4" />
              <span className="font-medium text-red-800">删除内容</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <PencilIcon className="text-orange-600 h-4 w-4" />
              <span className="font-medium text-orange-800">修改内容</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <EyeIcon className="text-gray-600 h-4 w-4" />
              <span className="font-medium text-gray-800">未变更内容</span>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-800 mb-2">字词级精确标识说明：</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <span className="bg-green-200 text-green-800 px-1 rounded font-semibold">绿色高亮</span>：新增的字词</p>
              <p>• <span className="bg-red-200 text-red-800 px-1 rounded line-through">红色删除线</span>：删除的字词</p>
              <p>• 修改行会同时显示删除和新增的字词，实现精确定位</p>
              <p>• PDF模式：自动提取PDF文本内容进行对比，支持拖拽上传</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCompare;