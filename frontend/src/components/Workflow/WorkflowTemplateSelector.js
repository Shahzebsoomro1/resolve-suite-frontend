// Create a new component: components/Workflow/WorkflowTemplateSelector.js

import React, { useState, useEffect } from 'react';
import { 
  getWorkflowTemplates, 
  getWorkflowTemplatesByCategory
} from '../../services/api';
import { 
  Workflow, 
  FileText, 
  Shield, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  BookOpen,
  LucidePenTool,
  Cpu,
  Server,
  Layout,
  Clock,
  CheckSquare,
  MessageSquare,
  Loader,
  AlertCircle
} from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '../../services/workflowTemplateService';

const WorkflowTemplateSelector = ({ onSelectTemplate, onCancel }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('basic');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getWorkflowTemplatesByCategory(selectedCategory);
      setTemplates(data);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForTemplate = (iconName) => {
    const icons = {
      'workflow': Workflow,
      'file-text': FileText,
      'shield': Shield,
      'alert-triangle': AlertTriangle,
      'calendar': Calendar,
      'dollar-sign': DollarSign,
      'book-open': BookOpen,
      'tool': LucidePenTool,
      'cpu': Cpu,
      'server': Server,
      'layout': Layout,
      'clock': Clock,
      'check-square': CheckSquare,
      'message-square': MessageSquare
    };
    
    const IconComponent = icons[iconName] || Workflow;
    return <IconComponent className="h-6 w-6" />;
  };

  const categoryLabels = {
    [TEMPLATE_CATEGORIES.BASIC]: 'Basic',
    [TEMPLATE_CATEGORIES.ACADEMIC]: 'Academic',
    [TEMPLATE_CATEGORIES.ADMINISTRATIVE]: 'Administrative',
    [TEMPLATE_CATEGORIES.FACILITIES]: 'Facilities',
    [TEMPLATE_CATEGORIES.IT_SUPPORT]: 'IT Support',
    [TEMPLATE_CATEGORIES.CUSTOM]: 'Custom'
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow max-h-[80vh] overflow-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Select a Workflow Template
      </h2>

      {/* Category selector */}
      <div className="flex space-x-1 mb-6 overflow-x-auto pb-2">
        {Object.values(TEMPLATE_CATEGORIES).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
              selectedCategory === category
                ? 'bg-[#254E58] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Templates grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin h-8 w-8 text-[#254E58]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No templates available for this category
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-5 hover:border-[#254E58] hover:shadow-md transition-all cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-[#254E58] bg-opacity-10 text-[#254E58] mr-3">
                  {getIconForTemplate(template.icon)}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">{template.description}</p>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{template.stages.length}</span> stages
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WorkflowTemplateSelector;