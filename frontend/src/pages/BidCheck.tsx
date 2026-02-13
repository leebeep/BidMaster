import React, { useState, useCallback } from 'react';
import { Upload, Button, Card, Space, InputNumber, Input, Progress, Alert, message } from 'antd';
import type { UploadFile as AntUploadFile, UploadChangeParam } from 'antd/es/upload/interface';
import { UploadOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { duplicateApi } from '../services/api';

const BidCheck: React.FC = () => {
  const [leftFile, setLeftFile] = useState<AntUploadFile | null>(null);
  const [rightFile, setRightFile] = useState<AntUploadFile | null>(null);
  const [bidFiles, setBidFiles] = useState<File[]>([]);
  const [minLength, setMinLength] = useState(10);
  const [splitWords, setSplitWords] = useState('。|:|：|,|，');
  const [leftUploadStatus, setLeftUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [rightUploadStatus, setRightUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [leftUploadError, setLeftUploadError] = useState<string | null>(null);
  const [rightUploadError, setRightUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClearData = () => {
    setLeftFile(null);
    setRightFile(null);
    setBidFiles([]);
    setLeftUploadStatus('idle');
    setRightUploadStatus('idle');
    setLeftUploadError(null);
    setRightUploadError(null);
    setProgress(0);
    setIsProcessing(false);
    setResult(null);
    setError(null);
    message.success('已清空所有数据');
  };

  const handleLeftFileChange = useCallback(({ file, fileList }: UploadChangeParam<AntUploadFile>) => {
    const newFile = fileList[fileList.length - 1];
    setLeftFile(newFile);
    
    if (newFile?.originFileObj) {
      const files = bidFiles.length > 1 ? [newFile.originFileObj as File, bidFiles[1]] : [newFile.originFileObj as File];
      setBidFiles(files);
    }
    
    if (file) {
      if (file.status === 'uploading') {
        setLeftUploadStatus('uploading');
      } else if (file.status === 'done') {
        setLeftUploadStatus('success');
        setLeftUploadError(null);
        message.success('左侧文件上传成功');
      } else if (file.status === 'error') {
        setLeftUploadStatus('error');
        setLeftUploadError('文件上传失败，请重试');
        message.error('左侧文件上传失败');
      }
    } else {
      setLeftUploadStatus('idle');
      setLeftUploadError(null);
    }
  }, [bidFiles]);

  const handleRightFileChange = useCallback(({ file, fileList }: UploadChangeParam<AntUploadFile>) => {
    const newFile = fileList[fileList.length - 1];
    setRightFile(newFile);
    
    if (newFile?.originFileObj) {
      const files = bidFiles.length > 0 ? [bidFiles[0], newFile.originFileObj as File] : [newFile.originFileObj as File];
      setBidFiles(files);
    }
    
    if (file) {
      if (file.status === 'uploading') {
        setRightUploadStatus('uploading');
      } else if (file.status === 'done') {
        setRightUploadStatus('success');
        setRightUploadError(null);
        message.success('右侧文件上传成功');
      } else if (file.status === 'error') {
        setRightUploadStatus('error');
        setRightUploadError('文件上传失败，请重试');
        message.error('右侧文件上传失败');
      }
    } else {
      setRightUploadStatus('idle');
      setRightUploadError(null);
    }
  }, [bidFiles]);

  const handleCheck = async () => {
    if (bidFiles.length === 0) {
      setError('请上传至少一个投标文件');
      return;
    }

    if (bidFiles.length < 2) {
      setError('请上传至少两个投标文件进行对比');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const response = await duplicateApi.startDuplicateCheck(bidFiles, {
        min_length: minLength,
        split_words: splitWords
      });

      const taskId = response.data.task_id;
      
      if (!taskId) {
        setError('获取任务ID失败');
        setIsProcessing(false);
        return;
      }
      
      const pollInterval = setInterval(async () => {
        try {
          const resultResponse = await duplicateApi.getDuplicateResult(taskId);
          const resultData = resultResponse.data;
          
          if (resultData.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            const formattedResult = {
              duplicateRate: resultData.results?.[0]?.duplicate_rate || 0,
              duplicateSegments: resultData.results?.[0]?.duplicate_sections?.map((text: string) => ({
                text: text,
                rate: 100
              })) || []
            };
            setResult(formattedResult);
            setIsProcessing(false);
          } else if (resultData.status === 'failed') {
            clearInterval(pollInterval);
            setError('查重失败，请稍后重试');
            setIsProcessing(false);
          } else if (resultData.status === 'not_found') {
            clearInterval(pollInterval);
            setError('任务不存在或已过期');
            setIsProcessing(false);
          } else {
            setProgress(prev => Math.min(prev + 10, 90));
          }
        } catch (err) {
          clearInterval(pollInterval);
          setError('查询结果失败，请稍后重试');
          setIsProcessing(false);
        }
      }, 1000);
    } catch (err) {
      setError('查重失败，请稍后重试');
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <div>
        {error && <Alert message="错误" description={error} type="error" showIcon className="mb-6" />}
        
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              基于余弦相似度算法，快速识别Word文档重复内容，有效防范标书抄袭风险
            </p>
          </div>
        
        <Space direction="vertical" size="large" className="w-full">
          <div className="mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-4">上传投标文件</h3>
              <div className="grid grid-cols-2 gap-8 justify-items-center">
                <div className="text-center">
                  <Upload
                    beforeUpload={() => false}
                    customRequest={({ file, onSuccess }) => {
                      setTimeout(() => onSuccess?.('ok'), 0);
                    }}
                    fileList={leftFile ? [leftFile] : []}
                    onChange={handleLeftFileChange}
                    multiple={false}
                    accept=".docx"
                    listType="text"
                  >
                    <Button icon={<UploadOutlined />} size="large" className="bg-green-600 hover:bg-green-700 text-white px-8 py-2">
                      {leftFile ? '重新选择' : '选择文件'}
                    </Button>
                  </Upload>
                  
                  {leftUploadStatus === 'uploading' && (
                    <div className="mt-2 text-blue-600">
                      <span className="mr-2">正在上传...</span>
                    </div>
                  )}
                  {leftUploadStatus === 'success' && leftFile && (
                    <div className="mt-2 text-green-600">
                      <CheckCircleOutlined className="mr-2" />
                      <span>已成功上传：{leftFile.name}</span>
                    </div>
                  )}
                  {leftUploadStatus === 'error' && leftUploadError && (
                    <div className="mt-2 text-red-600">
                      <CloseCircleOutlined className="mr-2" />
                      <span>{leftUploadError}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <Upload
                    beforeUpload={() => false}
                    customRequest={({ file, onSuccess }) => {
                      setTimeout(() => onSuccess?.('ok'), 0);
                    }}
                    fileList={rightFile ? [rightFile] : []}
                    onChange={handleRightFileChange}
                    multiple={false}
                    accept=".docx"
                    listType="text"
                  >
                    <Button icon={<UploadOutlined />} size="large" className="bg-green-600 hover:bg-green-700 text-white px-8 py-2">
                      {rightFile ? '重新选择' : '选择文件'}
                    </Button>
                  </Upload>
                  
                  {rightUploadStatus === 'uploading' && (
                    <div className="mt-2 text-blue-600">
                      <span className="mr-2">正在上传...</span>
                    </div>
                  )}
                  {rightUploadStatus === 'success' && rightFile && (
                    <div className="mt-2 text-green-600">
                      <CheckCircleOutlined className="mr-2" />
                      <span>已成功上传：{rightFile.name}</span>
                    </div>
                  )}
                  {rightUploadStatus === 'error' && rightUploadError && (
                    <div className="mt-2 text-red-600">
                      <CloseCircleOutlined className="mr-2" />
                      <span>{rightUploadError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-4">查重参数设置</h3>
              <Space direction="vertical" size="middle" className="w-full">
                <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center space-x-4">
                  <label className="w-32">最小匹配长度：</label>
                  <InputNumber
                    min={1}
                    max={100}
                    value={minLength}
                    onChange={(value) => setMinLength(value || 10)}
                    className="w-32 rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="w-24">分割符：</label>
                  <Input
                    value={splitWords}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSplitWords(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="例如：。|:|：|,|，"
                  />
                </div>
              </div>
              </Space>
            </div>
          </div>

          <div className="text-center mt-8 mb-4">
            <Space size="large">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleCheck}
                loading={isProcessing}
                size="large"
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
              >
                开始查重
              </Button>
              <Button
                type="default"
                icon={<CloseCircleOutlined />}
                onClick={handleClearData}
                size="large"
                className="px-8 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                重置
              </Button>
            </Space>
          </div>

          {isProcessing && (
            <div>
              <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} />
              <p className="text-center mt-4">正在查重，请稍候...</p>
            </div>
          )}

          {result && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h3 className="text-xl font-semibold mb-6">查重结果</h3>
              

              
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg text-center bg-gray-50">
                    <div className="text-3xl font-bold text-blue-600">
                      {result.duplicateSegments ? result.duplicateSegments.length : 0}
                    </div>
                    <div className="text-base text-gray-600 mt-2">重复片段数</div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center bg-gray-50">
                    <div className="text-3xl font-bold text-green-600">
                      {result.duplicateRate ? result.duplicateRate.toFixed(2) : 0}%
                    </div>
                    <div className="text-base text-gray-600 mt-2">总体重复率</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-4">重复片段详情：</h4>
                {result.duplicateSegments && result.duplicateSegments.length > 0 ? (
                  result.duplicateSegments.map((segment: any, index: number) => (
                    <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <strong className="text-xl text-gray-800">重复片段 {index + 1}：</strong>
                        <span className="text-lg text-red-600 font-bold">匹配率：{segment.rate ? segment.rate : 0}%</span>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg whitespace-pre-wrap break-words">
                        {segment.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <p className="text-lg text-gray-600">未检测到重复内容</p>
                  </div>
                )}
              </div>
            </div>
          )}
          </Space>
      </div>
    </div>
  );
};

export default BidCheck;