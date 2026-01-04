import React from 'react';
import { ChevronRight, Settings } from 'lucide-react';

const Sidebar = ({ 
  navigationItems, 
  activeTab, 
  onTabChange, 
  isSidebarCollapsed, 
  onToggleCollapse, 
  isMobileMenuOpen, 
  onMobileMenuToggle,
  brandName = "ResolveSuite",
  showSettings = true 
}) => {
  return (
    <div 
      className={`
        fixed md:static inset-y-0 left-0 z-50
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        md:translate-x-0
        bg-gradient-to-b from-[#254E58] to-[#112D32] 
        transition-all duration-300 ease-in-out
        flex flex-col
      `}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4">
        <h1 className={`text-2xl font-bold text-[#88BDBC] transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          {brandName}
        </h1>
        <button
          onClick={onToggleCollapse}
          className="hidden md:block text-[#88BDBC] hover:text-white transition-colors"
        >
          <ChevronRight className={`h-5 w-5 transform transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 px-3">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              onMobileMenuToggle(false);
            }}
            className={`
              w-full flex items-center px-4 py-3 mb-2 rounded-md transition-all duration-200
              group relative
              ${
                activeTab === item.id
                  ? 'bg-[#88BDBC] text-[#254E58]'
                  : 'text-[#88BDBC] hover:bg-[#88BDBC]/10'
              }
            `}
          >
            <item.icon className={`h-5 w-5 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              {item.name}
            </span>
            {item.count > 0 && (
              <span className="ml-auto bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                {item.count}
              </span>
            )}
            
            {/* Tooltip for collapsed sidebar */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.name}
              </div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;