// components/RecentDownloads.tsx
import React from 'react';
import { RecentFile } from '../types/dashboard';

interface RecentDownloadsProps {
  downloads: RecentFile[];
}

export default function RecentDownloads({ downloads }: RecentDownloadsProps) {
  return (
    <div className="rounded-3xl shadow-lg border border-green-100/50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">RECENT DOWNLOADS</h2>
          <span className="text-sm text-gray-200 font-normal">{downloads.length} downloads</span>
        </div>

        <div data-lenis-prevent className={`space-y-4 ${downloads.length > 2 ? 'max-h-[280px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
          {downloads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-gray-200 font-semibold mb-1">No downloads today</h3>
              <p className="text-sm text-gray-300 font-normal">Downloads from the last 24 hours will appear here</p>
            </div>
          ) : (
            downloads.map((download) => (
              <div key={download.id} className="group hover:bg-green-900/20 p-4 rounded-lg transition-all duration-200 cursor-pointer border border-green-700/30 hover:border-green-500/50 hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-green-300 transition-colors leading-tight">
                      {download.title}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 text-sm">
                      <span className="bg-green-900/50 text-green-200 px-2.5 py-1 rounded-full text-xs font-medium">
                        DOWNLOADED
                      </span>
                      <span className="text-gray-300 font-normal">{download.timestamp}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400 font-light">{download.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-green-700/30">
          <button className="text-green-300 hover:text-green-200 text-sm font-medium">
            View all downloads →
          </button>
        </div>
      </div>
    </div>
  );
}