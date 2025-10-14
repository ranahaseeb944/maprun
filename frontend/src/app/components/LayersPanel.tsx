"use client";

import React from "react";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  shapes: string[];
}

interface LayersPanelProps {
  layers: Layer[];
  activeLayer: string;
  onLayerSelect: (layerId: string) => void;
  onLayerToggle: (layerId: string) => void;
  onLayerLock: (layerId: string) => void;
  onLayerAdd: () => void;
  onLayerDelete: (layerId: string) => void;
  onLayerRename: (layerId: string, name: string) => void;
}

export default function LayersPanel({
  layers,
  activeLayer,
  onLayerSelect,
  onLayerToggle,
  onLayerLock,
  onLayerAdd,
  onLayerDelete,
  onLayerRename,
}: LayersPanelProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Layers</h3>
          <button
            onClick={onLayerAdd}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              activeLayer === layer.id
                ? "bg-blue-50 border-blue-300"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerToggle(layer.id);
                  }}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    layer.visible
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {layer.visible && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerLock(layer.id);
                  }}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    layer.locked
                      ? "bg-red-500 border-red-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {layer.locked && (
                    <span className="text-white text-xs">🔒</span>
                  )}
                </button>
              </div>

              <div className="flex-1 ml-2">
                <input
                  type="text"
                  value={layer.name}
                  onChange={(e) => onLayerRename(layer.id, e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                />
                <p className="text-xs text-gray-500">
                  {layer.shapes.length} shapes
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerDelete(layer.id);
                }}
                className="text-red-500 hover:text-red-700 text-sm"
                disabled={layers.length === 1}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Click layer to select</p>
          <p>• ��️ Toggle visibility</p>
          <p>• 🔒 Lock/unlock layer</p>
          <p>• Double-click to rename</p>
        </div>
      </div>
    </div>
  );
}
