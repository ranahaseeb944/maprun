"use client";

import React from "react";

export type Tool =
  | "select"
  | "rectangle"
  | "sharp-rectangle"
  | "circle"
  | "oval"
  | "line"
  | "text"
  | "curve"
  | "bezier"
  | "eraser"
  | "pan";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  zoom: number;
}

export default function Toolbar({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSave,
  onLoad,
  onClear,
  zoom,
}: ToolbarProps) {
  const tools: { id: Tool; name: string; icon: string }[] = [
    { id: "select", name: "Select", icon: "↖️" },
    { id: "rectangle", name: "Rounded Rect", icon: "⬜" },
    { id: "sharp-rectangle", name: "Sharp Rect", icon: "▬" },
    { id: "circle", name: "Circle", icon: "⭕" },
    { id: "oval", name: "Oval", icon: "🥚" },
    { id: "line", name: "Line", icon: "📏" },
    { id: "curve", name: "Curve", icon: "〰️" },
    { id: "bezier", name: "Bezier", icon: "🌊" },
    { id: "text", name: "Text", icon: "📝" },
    { id: "eraser", name: "Eraser", icon: "🗑️" },
    { id: "pan", name: "Pan", icon: "✋" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Drawing Tools */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 mr-4">Tools:</span>
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTool === tool.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title={tool.name}
            >
              <span className="mr-1">{tool.icon}</span>
              {tool.name}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Zoom:</span>
          <button
            onClick={onZoomOut}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            −
          </button>
          <span className="px-3 py-1 bg-gray-50 rounded text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            +
          </button>
          <button
            onClick={onResetZoom}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            Reset
          </button>
        </div>

        {/* File Operations */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
          >
            💾 Save
          </button>
          <button
            onClick={onLoad}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
          >
            📁 Load
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500">
        {activeTool === "select" &&
          "Click to select, drag to move, use corner handles to resize"}
        {activeTool === "rectangle" &&
          "Click and drag to draw rounded rectangles"}
        {activeTool === "sharp-rectangle" &&
          "Click and drag to draw sharp rectangles"}
        {activeTool === "circle" && "Click and drag to draw circles"}
        {activeTool === "oval" && "Click and drag to draw ovals"}
        {activeTool === "line" && "Click and drag to draw lines"}
        {activeTool === "curve" &&
          "Click to add points, double-click to finish curve"}
        {activeTool === "bezier" &&
          "Click to add points with control handles, double-click to finish"}
        {activeTool === "text" && "Click to add text labels"}
        {activeTool === "pan" && "Click and drag to pan the canvas"}
        {activeTool === "eraser" && "Click on shapes to delete them"}
      </div>
    </div>
  );
}
