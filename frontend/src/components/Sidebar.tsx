/**
 * 后台管理风格的左侧栏组件
 */
import React from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon, CodeBracketIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  activeMenu: string;
  onMenuClick: (menu: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, onMenuClick }) => {
  const menus = [
    { id: 'bid-writing', name: '标书智写', icon: DocumentTextIcon },
    { id: 'bid-check', name: '标书查重', icon: MagnifyingGlassIcon },
    { id: 'document-compare', name: '文档对比', icon: CodeBracketIcon },
  ];

  return (
    <div className="bg-white shadow-sm border-r border-gray-200 w-56 h-full overflow-y-auto">
      {/* 品牌标识 */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 text-center">投标服务大师</h1>
      </div>

      {/* 菜单列表 */}
      <div className="p-4 space-y-2">
        {menus.map((menu) => {
          const Icon = menu.icon;
          return (
            <button
              key={menu.id}
              onClick={() => {
                if (menu.id === 'external-resources') {
                  window.open('https://www.yuque.com/aleeyou', '_blank');
                } else {
                  onMenuClick(menu.id);
                }
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                activeMenu === menu.id
                  ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-semibold text-lg">{menu.name}</span>
            </button>
          );
        })}
      </div>

      {/* 底部信息 */}
      <div className="absolute bottom-0 w-56 border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">

          <p className="text-sm">©一只独行侠</p>
          <button
            onClick={() => window.open('https://www.yuque.com/aleeyou', '_blank')}
            className="text-sm text-green-600 hover:text-green-800 transition-colors mt-1"
          >
            语雀花园
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;