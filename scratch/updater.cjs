const fs = require('fs');
const path = require('path');

const adminDir = 'd:/capstone/Legal_Arch_aiu/resources/js/Pages/Admin/Document/components/';
const staffDir = 'd:/capstone/Legal_Arch_aiu/resources/js/Pages/Staff/Documents/components/';

// Helper to escape replacements
const performReplacements = (content, regexArray) => {
  let c = content;
  regexArray.forEach(({ find, replace }) => {
    c = c.replace(find, replace);
  });
  return c;
};

const edits = [
  {
    pathSuffix: 'MainDoc/DocumentPropertiesModal.tsx',
    process: (content) => {
      const replacements = [
        {
          find: /import \{ Document \} from '\.\.\/\.\.\/types\/types';/,
          replace: `import { Document } from '../../types/types';\nimport {\n  DEFAULT_DASHBOARD_THEME,\n  useDashboardTheme,\n} from '../../../../../hooks/useDashboardTheme';`
        },
        {
          find: /const DocumentPropertiesModal: React\.FC<DocumentPropertiesModalProps> = \(\{\n  isOpen,\n  onClose,\n  document\n\}\) => \{/,
          replace: `const DocumentPropertiesModal: React.FC<DocumentPropertiesModalProps> = ({\n  isOpen,\n  onClose,\n  document\n}) => {\n  const { theme } = useDashboardTheme();\n  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;`
        },
        {
          find: /const PropertyRow: React\.FC.*?=> \(\n    <div className=\"flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all\">\n      <div className=\"text-green-600 mt-0\.5\">\{icon\}<\/div>\n      <div className=\"flex-1\">\n        <div className=\"text-xs text-gray-600 mb-1\">\{label\}<\/div>\n        <div className=\"text-sm text-gray-900 break-words\">\{value \|\| 'N\/A'\}<\/div>\n      <\/div>\n    <\/div>\n  \);/s,
          replace: `const PropertyRow: React.FC<{ icon: React.ReactNode; label: string; value: string | null | undefined }> = ({\n    icon,\n    label,\n    value\n  }) => (\n    <div className={\`flex items-start gap-3 rounded-lg p-3 transition-all \${isDashboardThemeEnabled ? 'hover:bg-base-200/50' : 'hover:bg-gray-50'}\`}>\n      <div className={\`mt-0.5 \${isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}\`}>{icon}</div>\n      <div className=\"flex-1\">\n        <div className={\`mb-1 text-xs \${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}\`}>{label}</div>\n        <div className={\`break-words text-sm font-medium \${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}\`}>{value || 'N/A'}</div>\n      </div>\n    </div>\n  );`
        },
        {
          find: /return \(\n    <div\n      className=\"fixed inset-0 z-\[9999\] flex items-center justify-center bg-black\/50 backdrop-blur-sm\"\n      onClick=\{onClose\}\n    >\n      <div\n        className=\"bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl mx-4 max-h-\[90vh\] overflow-hidden\"\n        onClick=\{\(e\) => e\.stopPropagation\(\)\}\n      >/s,
          replace: `return (\n    <div\n      data-theme={isDashboardThemeEnabled ? theme : undefined}\n      className=\"fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6\"\n      style={{ background: 'transparent' }}\n    >\n      <div \n        className=\"fixed inset-0 bg-black/50 backdrop-blur-sm\" \n        onClick={onClose} \n      />\n      <div\n        className={\`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl \${isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'}\`}\n        onClick={(e) => e.stopPropagation()}\n        style={{ maxHeight: '90vh' }}\n      >`
        },
        {
          find: /{\/\* Header \*\/}\n        <div className=\"flex justify-between items-center p-6 border-b border-gray-200\">\n          <div className=\"flex items-center gap-3\">\n            <div className=\"p-2 bg-green-50 rounded-lg\">\n              <FileText className=\"w-5 h-5 text-green-600\" \/>\n            <\/div>\n            <div>\n              <h3 className=\"text-lg font-semibold text-gray-900\">Document Properties<\/h3>\n              <p className=\"text-sm text-gray-600 mt-0\.5\">View document details and metadata<\/p>\n            <\/div>\n          <\/div>\n          <button\n            onClick=\{onClose\}\n            className=\"text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all\"\n            aria-label=\"Close properties\"\n          >\n            <X className=\"w-5 h-5\" \/>\n          <\/button>\n        <\/div>/s,
          replace: `{/* Header */}\n        <div className={\`flex items-center justify-between border-b p-6 \${isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'}\`}>\n          <div className=\"flex items-center gap-3\">\n            <div className={\`rounded-lg p-2 \${isDashboardThemeEnabled ? 'bg-primary/10' : 'bg-green-50'}\`}>\n              <FileText className={\`h-5 w-5 \${isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}\`} />\n            </div>\n            <div>\n              <h3 className={\`text-lg font-bold \${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}\`}>Document Properties</h3>\n              <p className={\`mt-0.5 text-sm \${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}\`}>View document details and metadata</p>\n            </div>\n          </div>\n          <button\n            onClick={onClose}\n            className={\`rounded-lg p-2 transition-all \${isDashboardThemeEnabled ? 'text-base-content/50 hover:bg-base-200 hover:text-base-content' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}\`}\n            aria-label=\"Close properties\"\n          >\n            <X className=\"w-5 h-5\" />\n          </button>\n        </div>`
        },
        {
          find: /{\/\* Content \*\/}\n        <div className=\"p-6 overflow-y-auto max-h-\[calc\(90vh-180px\)\]\">/s,
          replace: `{/* Content */}\n        <div className=\"flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-300\">`
        },
        {
          find: /{\/\* Footer \*\/}\n        <div className=\"flex justify-end gap-3 p-6 border-t border-gray-200\">\n          <button\n            onClick=\{onClose\}\n            className=\"px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-medium\"\n          >\n            Close\n          <\/button>\n        <\/div>\n      <\/div>\n    <\/div>/s,
          replace: `{/* Footer */}\n        <div className={\`flex justify-end gap-3 border-t p-6 \${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-gray-200 bg-gray-50'}\`}>\n          <button\n            onClick={onClose}\n            className={\`rounded-lg px-6 py-2 font-medium transition-all \${isDashboardThemeEnabled ? 'border border-base-300 text-base-content hover:bg-base-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}\`}\n          >\n            Close\n          </button>\n        </div>\n      </div>\n    </div>`
        }
      ];
      return performReplacements(content, replacements);
    }
  },
  {
    pathSuffix: 'MainDoc/DeleteDocumentDialog.tsx',
    process: (content) => {
      const replacements = [
        {
          find: /import \{ Document \} from '\.\.\/\.\.\/types\/types';/,
          replace: `import { Document } from '../../types/types';\nimport {\n  DEFAULT_DASHBOARD_THEME,\n  useDashboardTheme,\n} from '../../../../../hooks/useDashboardTheme';`
        },
        {
          find: /const DeleteDocumentDialog: React\.FC<DeleteDocumentDialogProps> = \(\{\n  isOpen,\n  onClose,\n  document,\n  onDocumentDeleted\n\}\) => \{/,
          replace: `const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({\n  isOpen,\n  onClose,\n  document,\n  onDocumentDeleted\n}) => {\n  const { theme } = useDashboardTheme();\n  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;`
        },
        {
          find: /return \(\n    <div\n      className=\"fixed inset-0 z-\[9999\] flex items-center justify-center bg-black\/50 backdrop-blur-sm\"\n      onClick=\{handleClose\}\n    >\n      <div\n        className=\"bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md mx-4\"\n        onClick=\{\(e\) => e\.stopPropagation\(\)\}\n      >/s,
          replace: `return (\n    <div\n      data-theme={isDashboardThemeEnabled ? theme : undefined}\n      className=\"fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6\"\n      style={{ background: 'transparent' }}\n    >\n      <div \n        className=\"fixed inset-0 bg-black/50 backdrop-blur-sm\" \n        onClick={handleClose} \n      />\n      <div\n        className={\`relative flex w-full max-w-md flex-col overflow-hidden rounded-xl shadow-2xl \${isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'}\`}\n        onClick={(e) => e.stopPropagation()}\n      >`
        },
        {
          find: /{\/\* Header \*\/}\n        <div className=\"flex justify-between items-center p-6 border-b border-gray-200\">\n          <div className=\"flex items-center gap-3\">\n            <div className=\"p-2 bg-red-50 rounded-lg\">\n              <Trash2 className=\"w-5 h-5 text-red-600\" \/>\n            <\/div>\n            <div>\n              <h3 className=\"text-lg font-semibold text-gray-900\">Delete Document<\/h3>\n              <p className=\"text-sm text-gray-600 mt-0\.5\">This action cannot be undone<\/p>\n            <\/div>\n          <\/div>\n          <button\n            onClick=\{handleClose\}\n            disabled=\{isDeleting\}\n            className=\"text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed\"\n            aria-label=\"Close\"\n          >\n            <X className=\"w-5 h-5\" \/>\n          <\/button>\n        <\/div>/s,
          replace: `{/* Header */}\n        <div className={\`flex items-center justify-between border-b p-6 \${isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'}\`}>\n          <div className=\"flex items-center gap-3\">\n            <div className={\`rounded-lg p-2 \${isDashboardThemeEnabled ? 'bg-error/10' : 'bg-red-50'}\`}>\n              <Trash2 className={\`h-5 w-5 \${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}\`} />\n            </div>\n            <div>\n              <h3 className={\`text-lg font-bold \${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}\`}>Delete Document</h3>\n              <p className={\`mt-0.5 text-sm \${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}\`}>This action cannot be undone</p>\n            </div>\n          </div>\n          <button\n            onClick={handleClose}\n            disabled={isDeleting}\n            className={\`rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 \${isDashboardThemeEnabled ? 'text-base-content/50 hover:bg-base-200 hover:text-base-content' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}\`}\n            aria-label=\"Close\"\n          >\n            <X className=\"h-5 w-5\" />\n          </button>\n        </div>`
        },
        {
          find: /<div className=\"mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3\">\n            <AlertTriangle className=\"w-5 h-5 text-red-600 flex-shrink-0 mt-0\.5\" \/>\n            <div className=\"flex-1\">\n              <h4 className=\"text-sm font-semibold text-red-700 mb-1\">Warning<\/h4>\n              <p className=\"text-sm text-red-600\">\n                Deleting this document will permanently remove the file from storage and all associated data\.\n              <\/p>\n            <\/div>\n          <\/div>/s,
          replace: `<div className={\`mb-4 flex items-start gap-3 rounded-lg border p-4 \${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-600'}\`}>\n            <AlertTriangle className=\"mt-0.5 h-5 w-5 shrink-0\" />\n            <div className=\"flex-1\">\n              <h4 className=\"mb-1 text-sm font-semibold\">Warning</h4>\n              <p className=\"text-sm\">\n                Deleting this document will permanently remove the file from storage and all associated data.\n              </p>\n            </div>\n          </div>`
        },
        {
          find: /<div className=\"mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200\">\n            <div className=\"text-sm text-gray-600 mb-1\">Document to delete:<\/div>\n            <div className=\"font-semibold text-gray-900 break-words\">\{document\.title\}<\/div>\n            \{document\.folder\?\.folder_name && \(\n              <div className=\"text-xs text-gray-600 mt-2\">\n                Folder: \{document\.folder\.folder_name\}\n              <\/div>\n            \)\}\n          <\/div>/s,
          replace: `<div className={\`mb-4 rounded-lg border p-4 \${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/50' : 'border-gray-200 bg-gray-50'}\`}>\n            <div className={\`mb-1 text-sm \${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}\`}>Document to delete:</div>\n            <div className={\`break-words font-semibold \${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}\`}>{document.title}</div>\n            {document.folder?.folder_name && (\n              <div className={\`mt-2 text-xs \${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}\`}>\n                Folder: {document.folder.folder_name}\n              </div>\n            )}\n          </div>`
        },
        {
          find: /<label htmlFor=\"confirmText\" className=\"block text-sm font-medium text-gray-700 mb-2\">\n              Type <span className=\"font-bold text-red-600\">delete<\/span> to confirm\n            <\/label>\n            <input\n              type=\"text\"\n              id=\"confirmText\"\n              value=\{confirmText\}\n              onChange=\{\(e\) => setConfirmText\(e\.target\.value\)\}\n              \/\/ Stop propagation of key events so parent listeners \(like row click\) don't trigger\n              onKeyDown=\{\(e\) => e\.stopPropagation\(\)\}\n              disabled=\{isDeleting\}\n              className=\"w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed\"\n              placeholder=\"Type 'delete' to confirm\"\n              autoComplete=\"off\"\n            \/>/s,
          replace: `<label htmlFor=\"confirmText\" className={\`mb-2 block text-sm font-medium \${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}\`}>\n              Type <span className={\`font-bold \${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}\`}>delete</span> to confirm\n            </label>\n            <input\n              type=\"text\"\n              id=\"confirmText\"\n              value={confirmText}\n              onChange={(e) => setConfirmText(e.target.value)}\n              onKeyDown={(e) => e.stopPropagation()}\n              disabled={isDeleting}\n              className={\`w-full rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 \${isDashboardThemeEnabled ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-error focus:ring-error' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500'}\`}\n              placeholder=\"Type 'delete' to confirm\"\n              autoComplete=\"off\"\n            />`
        },
        {
          find: /\{error && \(\n            <div className=\"mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700\">\n              <AlertTriangle className=\"w-4 h-4 flex-shrink-0\" \/>\n              <span className=\"text-sm\">\{error\}<\/span>\n            <\/div>\n          \)\}/s,
          replace: `{error && (\n            <div className={\`mb-4 flex items-center gap-2 rounded-lg border p-3 \${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-700'}\`}>\n              <AlertTriangle className=\"h-4 w-4 shrink-0\" />\n              <span className=\"text-sm\">{error}</span>\n            </div>\n          )}`
        },
        {
          find: /{\/\* Footer \*\/}\n        <div className=\"flex justify-end gap-3 p-6 border-t border-gray-200\">\n          <button\n            type=\"button\"\n            onClick=\{handleClose\}\n            disabled=\{isDeleting\}\n            className=\"px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed\"\n          >\n            Cancel\n          <\/button>\n          <button\n            type=\"button\"\n            onClick=\{handleDelete\}\n            disabled=\{isDeleting \|\| confirmText\.toLowerCase\(\) !== 'delete'\}\n            className=\"px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2\"\n          >/s,
          replace: `{/* Footer */}\n        <div className={\`flex justify-end gap-3 border-t p-6 \${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-gray-200 bg-gray-50'}\`}>\n          <button\n            type=\"button\"\n            onClick={handleClose}\n            disabled={isDeleting}\n            className={\`rounded-lg px-4 py-2 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 \${isDashboardThemeEnabled ? 'border border-base-300 text-base-content hover:bg-base-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}\`}\n          >\n            Cancel\n          </button>\n          <button\n            type=\"button\"\n            onClick={handleDelete}\n            disabled={isDeleting || confirmText.toLowerCase() !== 'delete'}\n            className={\`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 \${isDashboardThemeEnabled ? 'bg-error hover:bg-error/90' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'}\`}\n          >`
        }
      ];
      return performReplacements(content, replacements);
    }
  },
  {
    pathSuffix: 'MainDoc/EditDocumentModal.tsx',
    process: (content) => {
      const replacements = [
        {
          find: /import \{ Document \} from '\.\.\/\.\.\/types\/types';/,
          replace: `import { Document } from '../../types/types';\nimport {\n  DEFAULT_DASHBOARD_THEME,\n  useDashboardTheme,\n} from '../../../../../hooks/useDashboardTheme';`
        },
        {
          find: /const \[folderList, setFolderList\] = useState<Array<\{ folder_id: number; folder_name: string \}>>\(initialFolders\);/,
          replace: `const [folderList, setFolderList] = useState<Array<{ folder_id: number; folder_name: string }>>(initialFolders);\n  const { theme } = useDashboardTheme();\n  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;`
        },
        {
          find: /return \(\n    <div\n      className=\"fixed inset-0 z-\[9999\] flex items-center justify-center bg-black\/50 backdrop-blur-sm\"\n      onClick=\{onClose\}\n      onKeyDown=\{\(e\) => \{\n        \/\/ Prevent spacebar from closing modal when typing in inputs\n        if \(e\.key === ' ' && \(e\.target as HTMLElement\)\.tagName !== 'BUTTON'\) \{\n          e\.stopPropagation\(\);\n        \}\n      \}\}\n    >\n      <div\n        className=\"bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl mx-4 max-h-\[90vh\] overflow-hidden\"\n        onClick=\{\(e\) => e\.stopPropagation\(\)\}\n        onKeyDown=\{\(e\) => e\.stopPropagation\(\)\}\n      >/s,
          replace: `return (\n    <div\n      data-theme={isDashboardThemeEnabled ? theme : undefined}\n      className=\"fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6\"\n      style={{ background: 'transparent' }}\n      onKeyDown={(e) => {\n        if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') {\n          e.stopPropagation();\n        }\n      }}\n    >\n      <div \n        className=\"fixed inset-0 bg-black/50 backdrop-blur-sm\" \n        onClick={onClose} \n      />\n      <div\n        className={\`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl \${isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'}\`}\n        onClick={(e) => e.stopPropagation()}\n        onKeyDown={(e) => e.stopPropagation()}\n        style={{ maxHeight: '90vh' }}\n      >`
        },
        {
          find: /{\/\* Header \*\/}\n        <div className=\"flex justify-between items-center p-6 border-b border-gray-200\">\n          <div className=\"flex items-center gap-3\">\n            <div className=\"p-2 bg-blue-50 rounded-lg\">\n              <FileText className=\"w-5 h-5 text-blue-600\" \/>\n            <\/div>\n            <div>\n              <h3 className=\"text-lg font-semibold text-gray-900\">Edit Document<\/h3>\n              <p className=\"text-sm text-gray-600 mt-0\.5\">Update document metadata<\/p>\n            <\/div>\n          <\/div>\n          <button\n            onClick=\{onClose\}\n            className=\"text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all\"\n            aria-label=\"Close\"\n          >\n            <X className=\"w-5 h-5\" \/>\n          <\/button>\n        <\/div>/s,
          replace: `{/* Header */}\n        <div className={\`flex items-center justify-between border-b p-6 \${isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'}\`}>\n          <div className=\"flex items-center gap-3\">\n            <div className={\`rounded-lg p-2 \${isDashboardThemeEnabled ? 'bg-primary/10' : 'bg-blue-50'}\`}>\n              <FileText className={\`h-5 w-5 \${isDashboardThemeEnabled ? 'text-primary' : 'text-blue-600'}\`} />\n            </div>\n            <div>\n              <h3 className={\`text-lg font-bold \${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}\`}>Edit Document</h3>\n              <p className={\`mt-0.5 text-sm \${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}\`}>Update document metadata</p>\n            </div>\n          </div>\n          <button\n            onClick={onClose}\n            className={\`rounded-lg p-2 transition-all \${isDashboardThemeEnabled ? 'text-base-content/50 hover:bg-base-200 hover:text-base-content' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}\`}\n            aria-label=\"Close\"\n          >\n            <X className=\"h-5 w-5\" />\n          </button>\n        </div>`
        },
        {
          find: /{\/\* Form \*\/}\n        <form onSubmit=\{handleSubmit\} className=\"p-6 overflow-y-auto max-h-\[calc\(90vh-180px\)\]\">\n          \{error && \(\n            <div className=\"mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700\">\n              <AlertCircle className=\"w-4 h-4 flex-shrink-0\" \/>\n              <span className=\"text-sm\">\{error\}<\/span>\n            <\/div>\n          \)\}/s,
          replace: `{/* Form */}\n        <form onSubmit={handleSubmit} className=\"flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-300\">\n          {error && (\n            <div className={\`mb-4 flex items-center gap-2 rounded-lg border p-3 \${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-700'}\`}>\n              <AlertCircle className=\"h-4 w-4 shrink-0\" />\n              <span className=\"text-sm\">{error}</span>\n            </div>\n          )}`
        },
        {
          find: /<label htmlFor=\"title\" className=\"block text-sm font-medium text-gray-700 mb-2\">/g,
          replace: `<label htmlFor=\"title\" className={\`mb-2 block text-sm font-medium \${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}\`}>`
        },
        {
          find: /<label htmlFor=\"description\" className=\"block text-sm font-medium text-gray-700 mb-2\">/g,
          replace: `<label htmlFor=\"description\" className={\`mb-2 block text-sm font-medium \${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}\`}>`
        },
        {
          find: /<label htmlFor=\"folder_id\" className=\"block text-sm font-medium text-gray-700 mb-2\">/g,
          replace: `<label htmlFor=\"folder_id\" className={\`mb-2 block text-sm font-medium \${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}\`}>`
        },
        {
          find: /<label htmlFor=\"physical_location\" className=\"block text-sm font-medium text-gray-700 mb-2\">/g,
          replace: `<label htmlFor=\"physical_location\" className={\`mb-2 block text-sm font-medium \${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}\`}>`
        },
        {
          find: /<label htmlFor=\"remarks\" className=\"block text-sm font-medium text-gray-700 mb-2\">/g,
          replace: `<label htmlFor=\"remarks\" className={\`mb-2 block text-sm font-medium \${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}\`}>`
        },
        {
          find: /className=\"w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all\"/g,
          replace: `className={\`w-full rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 \${isDashboardThemeEnabled ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:ring-primary' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'}\`}`
        },
        {
          find: /className=\"w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none\"/g,
          replace: `className={\`w-full resize-none rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 \${isDashboardThemeEnabled ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:ring-primary' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'}\`}`
        },
        {
          find: /{\/\* Footer \*\/}\n        <div className=\"flex justify-end gap-3 p-6 border-t border-gray-200\">\n          <button\n            type=\"button\"\n            onClick=\{onClose\}\n            disabled=\{isSubmitting\}\n            className=\"px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed\"\n          >\n            Cancel\n          <\/button>\n          <button\n            type=\"submit\"\n            onClick=\{handleSubmit\}\n            disabled=\{isSubmitting\}\n            className=\"px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2\"\n          >/s,
          replace: `{/* Footer */}\n        <div className={\`flex justify-end gap-3 border-t p-6 \${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-gray-200 bg-gray-50'}\`}>\n          <button\n            type=\"button\"\n            onClick={onClose}\n            disabled={isSubmitting}\n            className={\`rounded-lg px-4 py-2 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 \${isDashboardThemeEnabled ? 'border border-base-300 text-base-content hover:bg-base-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}\`}\n          >\n            Cancel\n          </button>\n          <button\n            type=\"submit\"\n            onClick={handleSubmit}\n            disabled={isSubmitting}\n            className={\`flex items-center gap-2 rounded-lg px-6 py-2 font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 \${isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'}\`}\n          >`
        }
      ];
      return performReplacements(content, replacements);
    }
  },
  {
    pathSuffix: 'DocumentViewer/DocumentViewer.tsx',
    process: (content) => {
      const replacements = [
        {
          find: /import \{ Document \} from '\.\.\/\.\.\/types\/types';/,
          replace: `import { Document } from '../../types/types';\nimport {\n  DEFAULT_DASHBOARD_THEME,\n  useDashboardTheme,\n} from '../../../../../hooks/useDashboardTheme';`
        },
        {
          find: /const DocumentViewer: React\.FC<DocumentViewerProps> = \(\{\n? ?isOpen,\n? ?onClose,\n? ?document\n?\}\) => \{/s,
          replace: `const DocumentViewer: React.FC<DocumentViewerProps> = ({ isOpen, onClose, document }) => {\n  const { theme } = useDashboardTheme();\n  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;`
        },
        {
          find: /const modalContent = \(\n    <div\n      className=\"fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-\[9999\]\"\n      onClick=\{onClose\}\n      style=\{\{ margin: 0, padding: 0 \}\}\n    >\n      <div\n        className=\"rounded-xl shadow-2xl w-full max-w-6xl mx-4 h-5\/6 flex flex-col\"\n        onClick=\{\(e\) => e\.stopPropagation\(\)\}\n        style=\{\{\n          background: 'white',\n          border: '1px solid rgba\(0, 0, 0, 0\.1\)',\n          boxShadow: '0 20px 60px 0 rgba\(100, 116, 139, 0\.3\)'\n        \}\}\n      >/s,
          replace: `const modalContent = (\n    <div\n      data-theme={isDashboardThemeEnabled ? theme : undefined}\n      className=\"fixed inset-0 z-[9999] p-4 sm:p-6 flex items-center justify-center\"\n      style={{ background: 'transparent', margin: 0, padding: 0 }}\n    >\n      <div \n        className=\"fixed inset-0 bg-black/60 backdrop-blur-sm\" \n        onClick={onClose} \n      />\n      <div\n        className={\`relative flex h-5/6 w-full max-w-6xl flex-col overflow-hidden rounded-xl shadow-2xl \${isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-[rgba(0,0,0,0.1)] bg-white shadow-[0_20px_60px_0_rgba(100,116,139,0.3)]'}\`}\n        onClick={(e) => e.stopPropagation()}\n      >`
        },
        {
          find: /{\/\* Header \*\/}\n        <div className=\"flex items-center justify-between p-4 border-b border-gray-200\">\n          <div className=\"flex items-center gap-3\">\n            <div className=\"p-2 bg-blue-100 rounded-lg\">\n              \{getFileType\(document\) === 'pdf' && <FileText className=\"w-6 h-6 text-blue-600\" \/>\}\n              \{getFileType\(document\) === 'image' && <Image className=\"w-6 h-6 text-green-600\" \/>\}\n              \{getFileType\(document\) === 'text' && <FileText className=\"w-6 h-6 text-purple-600\" \/>\}\n              \{getFileType\(document\) === 'unknown' && <FileText className=\"w-6 h-6 text-gray-600\" \/>\}\n            <\/div>\n            <div>\n              <h2 className=\"text-lg font-semibold text-gray-900 truncate max-w-md\">\n                \{document\.title\}\n              <\/h2>\n              <p className=\"text-sm text-gray-500\">\n                \{getFileExtension\(document\.file_path \|\| document\.title\)\.toUpperCase\(\)\} • Created by \{document\.created_by\}\n              <\/p>\n            <\/div>\n          <\/div>\n\n          {\/\* Toolbar \*\/}\n          <div className=\"flex items-center gap-2\">\n            \{\(getFileType\(document\) === 'pdf' \|\| getFileType\(document\) === 'image'\) && \(\n              <>/s,
          replace: `{/* Header */}\n        <div className={\`flex items-center justify-between border-b p-4 \${isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'}\`}>\n          <div className=\"flex items-center gap-3\">\n            <div className={\`rounded-lg p-2 \${isDashboardThemeEnabled ? 'bg-primary/10' : 'bg-blue-100'}\`}>\n              {getFileType(document) === 'pdf' && <FileText className={\`h-6 w-6 \${isDashboardThemeEnabled ? 'text-primary' : 'text-blue-600'}\`} />}\n              {getFileType(document) === 'image' && <Image className={\`h-6 w-6 \${isDashboardThemeEnabled ? 'text-success' : 'text-green-600'}\`} />}\n              {getFileType(document) === 'text' && <FileText className={\`h-6 w-6 \${isDashboardThemeEnabled ? 'text-secondary' : 'text-purple-600'}\`} />}\n              {getFileType(document) === 'unknown' && <FileText className={\`h-6 w-6 \${isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-600'}\`} />}\n            </div>\n            <div>\n              <h2 className={\`max-w-md truncate text-lg font-bold \${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}\`}>\n                {document.title}\n              </h2>\n              <p className={\`text-sm \${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-500'}\`}>\n                {getFileExtension(document.file_path || document.title).toUpperCase()} • Created by {document.created_by}\n              </p>\n            </div>\n          </div>\n\n          {/* Toolbar */}\n          <div className=\"flex items-center gap-2\">\n            {(getFileType(document) === 'pdf' || getFileType(document) === 'image') && (\n              <>`
        },
        {
          find: /className=\"p-2 rounded-lg hover:bg-gray-100 transition-colors\"/g,
          replace: `className={\`rounded-lg p-2 transition-colors \${isDashboardThemeEnabled ? 'hover:bg-base-200 text-base-content/70 hover:text-base-content' : 'hover:bg-gray-100'}\`}`
        },
        {
          find: /<span className=\"text-sm text-gray-600 min-w-12 text-center\">\n                  \{zoom\}%\n                <\/span>/s,
          replace: `<span className={\`min-w-12 text-center text-sm \${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}\`}>\n                  {zoom}%\n                </span>`
        },
        {
          find: /<div className=\"w-px h-6 bg-gray-300 mx-2\"><\/div>/s,
          replace: `<div className={\`mx-2 h-6 w-px \${isDashboardThemeEnabled ? 'bg-base-300' : 'bg-gray-300'}\`}></div>`
        },
        {
          find: /className=\"w-4 h-4 text-gray-600\"/g,
          replace: `className={\`h-4 w-4 \${isDashboardThemeEnabled ? 'text-base-content/70 group-hover:text-base-content' : 'text-gray-600'}\`}`
        },
        {
          find: /{\/\* Footer \*\/}\n        <div className=\"p-4 border-t border-gray-200 bg-gray-50\">\n          <div className=\"flex items-center justify-between text-sm text-gray-600\">\n            <div className=\"flex items-center gap-4\">\n              <span>Status:\n                <span className=\{\`ml-1 px-2 py-1 rounded-full text-xs \$\{document\.status === 'active' \? 'bg-green-100 text-green-800' :\n                  document\.status === 'draft' \? 'bg-yellow-100 text-yellow-800' :\n                    'bg-blue-100 text-blue-800'\n                  \}\`\}>\n                  \{\(document\.status \|\| 'unknown'\)\.charAt\(0\)\.toUpperCase\(\) \+ \(document\.status \|\| 'unknown'\)\.slice\(1\)\}\n                <\/span>\n              <\/span>\n              \{document\.remarks && \(\n                <span>Notes: \{document\.remarks\}<\/span>\n              \)\}\n            <\/div>\n            <div>\n              Created: \{new Date\(document\.created_at\)\.toLocaleDateString\(\)\} •\n              Updated: \{new Date\(document\.updated_at\)\.toLocaleDateString\(\)\}\n            <\/div>\n          <\/div>\n        <\/div>\n      <\/div>\n    <\/div>/s,
          replace: `{/* Footer */}\n        <div className={\`border-t p-4 \${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/50' : 'border-gray-200 bg-gray-50'}\`}>\n          <div className={\`flex items-center justify-between text-sm \${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}\`}>\n            <div className=\"flex items-center gap-4\">\n              <span>Status:\n                <span className={\`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold \${document.status === 'active' ? isDashboardThemeEnabled ? 'bg-success/15 text-success' : 'bg-green-100 text-green-800' :\n                  document.status === 'draft' ? isDashboardThemeEnabled ? 'bg-warning/15 text-warning' : 'bg-yellow-100 text-yellow-800' :\n                    isDashboardThemeEnabled ? 'bg-info/15 text-info' : 'bg-blue-100 text-blue-800'\n                  }\`}>\n                  {(document.status || 'unknown').charAt(0).toUpperCase() + (document.status || 'unknown').slice(1)}\n                </span>\n              </span>\n              {document.remarks && (\n                <span>Notes: {document.remarks}</span>\n              )}\n            </div>\n            <div>\n              Created: {new Date(document.created_at).toLocaleDateString()} • Updated: {new Date(document.updated_at).toLocaleDateString()}\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>`
        }
      ];
      return performReplacements(content, replacements);
    }
  }
];

[adminDir, staffDir].forEach(baseDir => {
  edits.forEach(edit => {
    let filePath = path.join(baseDir, edit.pathSuffix);
    if(fs.existsSync(filePath)) {
       let content = fs.readFileSync(filePath, 'utf-8');
       let newContent = edit.process(content);
       fs.writeFileSync(filePath, newContent);
       console.log('Updated: ' + filePath);
    }
  });
});
