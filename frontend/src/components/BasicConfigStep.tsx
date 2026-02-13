/**
 * 基本配置流程节点组件
 */
import React, { useState, useEffect } from 'react';
import { ConfigData } from '../types';
import { configApi } from '../services/api';

interface BasicConfigStepProps {
  config: ConfigData;
  onConfigChange: (config: ConfigData) => void;
  onNext: () => void;
}

const BasicConfigStep: React.FC<BasicConfigStepProps> = ({ config, onConfigChange, onNext }) => {
  const [localConfig, setLocalConfig] = useState<ConfigData>(config);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConfig = async () => {
    try {
      const response = await configApi.loadConfig();
      if (response.data) {
        setLocalConfig(response.data);
        onConfigChange(response.data);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await configApi.saveConfig(localConfig);
      
      if (response.data.success) {
        onConfigChange(localConfig);
        setMessage({ type: 'success', text: '配置保存成功！' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.data.message || '配置保存失败' });
      }
    } catch (error) {
      console.error('保存配置错误:', error);
      setMessage({ type: 'error', text: '配置保存失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetModels = async () => {
    if (!localConfig.api_key) {
      setMessage({ type: 'error', text: '请先输入API Key' });
      return;
    }

    try {
      setLoading(true);
      const response = await configApi.getModels(localConfig);
      
      if (response.data.success) {
        setModels(response.data.models);
        // 如果当前选中的模型不在新的模型列表中，则选择第一个可用模型
        if (response.data.models.length > 0 && !response.data.models.includes(localConfig.model_name)) {
          const updatedConfig = { ...localConfig, model_name: response.data.models[0] };
          setLocalConfig(updatedConfig);
          onConfigChange(updatedConfig);
        }
        setMessage({ type: 'success', text: `获取到 ${response.data.models.length} 个模型` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '获取模型列表失败' });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* 基本配置 */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">⚙️ 基本配置</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="api_key"
              value={localConfig.api_key}
              onChange={(e) => {
                const updatedConfig = { ...localConfig, api_key: e.target.value };
                setLocalConfig(updatedConfig);
                onConfigChange(updatedConfig);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="输入你的OpenAI API密钥"
            />
          </div>

          <div>
            <label htmlFor="base_url" className="block text-sm font-medium text-gray-700">
              Base URL (可选)
            </label>
            <input
              type="text"
              id="base_url"
              value={localConfig.base_url || ''}
              onChange={(e) => {
                const updatedConfig = { ...localConfig, base_url: e.target.value };
                setLocalConfig(updatedConfig);
                onConfigChange(updatedConfig);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="如果使用代理或其他服务，请输入base URL"
            />
          </div>
        </div>
      </div>

      {/* 模型配置 */}
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-3">🤖 模型配置</h3>
        
        <button
          onClick={handleGetModels}
          disabled={loading}
          className="w-full mb-3 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
        >
          {loading ? '获取中...' : '🔄 获取可用模型'}
        </button>

        <div>
          <label htmlFor="model_name" className="block text-sm font-medium text-gray-700">
            模型名称
          </label>
          {models.length > 0 ? (
            <select
              id="model_name"
              value={localConfig.model_name}
              onChange={(e) => {
                const updatedConfig = { ...localConfig, model_name: e.target.value };
                setLocalConfig(updatedConfig);
                onConfigChange(updatedConfig);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="model_name"
              value={localConfig.model_name}
              onChange={(e) => {
                const updatedConfig = { ...localConfig, model_name: e.target.value };
                setLocalConfig(updatedConfig);
                onConfigChange(updatedConfig);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="输入要使用的模型名称"
            />
          )}
        </div>
      </div>

      {/* 保存配置按钮 */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
      >
        {loading ? '处理中...' : '💾 保存配置'}
      </button>

      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default BasicConfigStep;