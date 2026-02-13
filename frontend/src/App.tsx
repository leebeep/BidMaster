/**
 * 主应用组件
 */
import React, { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import Sidebar from './components/Sidebar';
import StepBar from './components/StepBar';
import BasicConfigStep from './components/BasicConfigStep';
import DocumentUpload from './pages/DocumentUpload';
import DocumentAnalysis from './pages/DocumentAnalysis';
import OutlineEdit from './pages/OutlineEdit';
import ContentEdit from './pages/ContentEdit';
import BidCheck from './pages/BidCheck';
import DocumentCompare from './pages/DocumentCompare';

function App() {
  const {
    state,
    updateConfig,
    updateStep,
    updateFileContent,
    updateAnalysisResults,
    updateOutline,
    updateSelectedChapter,
    nextStep,
    prevStep,
  } = useAppState();

  const [activeMenu, setActiveMenu] = useState('bid-writing');
  const steps = ['基本配置', '文档上传', '标书解析', '目录编辑', '正文编辑'];

  const renderCurrentPage = () => {
    if (activeMenu === 'bid-check') {
      return <BidCheck />;
    }
    if (activeMenu === 'document-compare') {
      return <DocumentCompare />;
    }

    switch (state.currentStep) {
      case 0:
        return (
          <BasicConfigStep
            config={state.config}
            onConfigChange={updateConfig}
            onNext={() => nextStep()}
          />
        );
      case 1:
        return (
          <DocumentUpload
            fileContent={state.fileContent}
            onFileUpload={updateFileContent}
          />
        );
      case 2:
        return (
          <DocumentAnalysis
            fileContent={state.fileContent}
            projectOverview={state.projectOverview}
            techRequirements={state.techRequirements}
            onAnalysisComplete={updateAnalysisResults}
          />
        );
      case 3:
        return (
          <OutlineEdit
            projectOverview={state.projectOverview}
            techRequirements={state.techRequirements}
            outlineData={state.outlineData}
            onOutlineGenerated={updateOutline}
          />
        );
      case 4:
        return (
          <ContentEdit
            outlineData={state.outlineData}
            selectedChapter={state.selectedChapter}
            onChapterSelect={updateSelectedChapter}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* 左侧导航栏 */}
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(menu) => {
          setActiveMenu(menu);
          console.log('Menu clicked:', menu);
        }}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeMenu !== 'bid-check' && activeMenu !== 'document-compare' && (
          <>
            {/* 步骤导航 */}
            <div className="sticky top-0 z-50 bg-white shadow-sm px-6">
              <StepBar steps={steps} currentStep={state.currentStep} />
            </div>
          </>
        )}

        {/* 页面内容 */}
        <div id="app-main-scroll" className={`flex-1 p-6 overflow-y-auto ${activeMenu === 'bid-check' ? '' : ''}`}>
          {renderCurrentPage()}
        </div>

        {activeMenu !== 'bid-check' && activeMenu !== 'document-compare' && (
          <>
            {/* 底部导航按钮 */}
            <div className="sticky bottom-0 z-50 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateStep(0)}
                    disabled={state.currentStep === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:text-white disabled:cursor-not-allowed"
                  >
                    首页
                  </button>

                  <button
                    onClick={prevStep}
                    disabled={state.currentStep === 0}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    上一步
                  </button>
                </div>

                <button
                  onClick={nextStep}
                  disabled={state.currentStep === steps.length - 1}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
