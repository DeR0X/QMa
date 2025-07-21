import { useState } from 'react';
import { Plus, Check, X, Tag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentCategories, useCreateDocumentCategory, type DocumentCategory } from '../../hooks/useDocumentCategories';

interface Props {
  selectedCategoryId?: number;
  onCategorySelect: (categoryId: number) => void;
  className?: string;
}

export default function CategorySelector({ selectedCategoryId, onCategorySelect, className = '' }: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: categories = [], isLoading, error } = useDocumentCategories();
  const createCategoryMutation = useCreateDocumentCategory();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Bitte geben Sie einen Kategorienamen ein');
      return;
    }

    setIsCreating(true);
    try {
      const newCategory = await createCategoryMutation.mutateAsync({
        Category: newCategoryName.trim(),
        Description: newCategoryDescription.trim() || undefined,
      });

      toast.success(`Kategorie "${newCategory.Name}" erfolgreich erstellt`);
      onCategorySelect(newCategory.ID);
      setShowCreateForm(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Fehler beim Erstellen der Kategorie');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Kategorie
        </label>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Kategorie
        </label>
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Fehler beim Laden der Kategorien</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Kategorie
      </label>

      {!showCreateForm ? (
        <div className="space-y-3">
          {/* Category Selection */}
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <button
                key={category.ID}
                onClick={() => onCategorySelect(category.ID)}
                className={`
                  flex items-center justify-between p-3 rounded-lg border text-left transition-all
                  ${selectedCategoryId === category.ID
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.Name}
                    </div>
                    {category.Description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {category.Description}
                      </div>
                    )}
                  </div>
                </div>
                {selectedCategoryId === category.ID && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Create New Category Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Neue Kategorie erstellen</span>
          </button>
        </div>
      ) : (
        /* Create Category Form */
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kategoriename *
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="z.B. Sicherheitsschulungen"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Beschreibung (optional)
            </label>
            <textarea
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Kurze Beschreibung der Kategorie..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm resize-none"
              disabled={isCreating}
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleCreateCategory}
              disabled={isCreating || !newCategoryName.trim()}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Erstellen...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Erstellen
                </>
              )}
            </button>
            <button
              onClick={handleCancelCreate}
              disabled={isCreating}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 