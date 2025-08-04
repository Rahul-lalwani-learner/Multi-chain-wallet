'use client';

import { Key } from 'lucide-react';

interface ViewSeedPhraseProps {
  isCollapsed: boolean;
  onOpenSeedPhrase: () => void;
}

export default function ViewSeedPhrase({ isCollapsed, onOpenSeedPhrase }: ViewSeedPhraseProps) {
  return (
    <div className="p-4 border-t border-slate-700/50">
      <button
        onClick={onOpenSeedPhrase}
        className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center shadow-lg hover:shadow-xl ${
          isCollapsed ? 'p-2 justify-center' : 'px-4 py-3 justify-center'
        }`}
        title="View Seed Phrase"
      >
        <Key className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
        {!isCollapsed && (
          <div className="text-sm font-medium">View Seed Phrase</div>
        )}
      </button>
    </div>
  );
}