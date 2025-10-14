"use client";

import React from "react";

export interface ShapeProperties {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  text?: string;
  fontSize?: number;
  // Curve properties
  points?: number[];
  controlPoints?: number[];
  tension?: number;
  closed?: boolean;
  [key: string]: any;
}

interface PropertiesPanelProps {
  selectedShape: ShapeProperties | null;
  onPropertyChange: (property: string, value: any) => void;
  onDeleteShape: () => void;
}

export default function PropertiesPanel({
  selectedShape,
  onPropertyChange,
  onDeleteShape,
}: PropertiesPanelProps) {
  if (!selectedShape) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">📋</p>
          <p>Select a shape to edit properties</p>
        </div>
      </div>
    );
  }

  const canResize = [
    "rectangle",
    "sharp-rectangle",
    "circle",
    "oval",
    "text",
  ].includes(selectedShape.type);
  const isCurve = ["curve", "bezier"].includes(selectedShape.type);

  return (
    <div className="w-64 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
          <button
            onClick={onDeleteShape}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Delete
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {selectedShape.type} - {selectedShape.id}
        </p>
        {canResize && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 Blue handles: corners, Green handles: edges
          </div>
        )}
        {isCurve && (
          <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
            💡 Drag control points to adjust curve
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500">X</label>
              <input
                type="number"
                value={selectedShape.x}
                onChange={(e) =>
                  onPropertyChange("x", parseFloat(e.target.value) || 0)
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Y</label>
              <input
                type="number"
                value={selectedShape.y}
                onChange={(e) =>
                  onPropertyChange("y", parseFloat(e.target.value) || 0)
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        {(selectedShape.type === "rectangle" ||
          selectedShape.type === "sharp-rectangle" ||
          selectedShape.type === "oval" ||
          selectedShape.type === "text") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500">Width</label>
                <input
                  type="number"
                  value={selectedShape.width || 0}
                  onChange={(e) =>
                    onPropertyChange("width", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Height</label>
                <input
                  type="number"
                  value={selectedShape.height || 0}
                  onChange={(e) =>
                    onPropertyChange("height", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Area:{" "}
              {(
                (selectedShape.width || 0) * (selectedShape.height || 0)
              ).toFixed(0)}{" "}
              px²
            </div>
          </div>
        )}

        {/* Radius for circles */}
        {selectedShape.type === "circle" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius
            </label>
            <input
              type="number"
              value={selectedShape.radius || 0}
              onChange={(e) =>
                onPropertyChange("radius", parseFloat(e.target.value) || 0)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <div className="mt-1 text-xs text-gray-500">
              Diameter: {((selectedShape.radius || 0) * 2).toFixed(0)}px
            </div>
            <div className="text-xs text-gray-500">
              Area: {((selectedShape.radius || 0) ** 2 * Math.PI).toFixed(0)}{" "}
              px²
            </div>
          </div>
        )}

        {/* Curve properties */}
        {isCurve && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Curve Settings
            </label>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500">Tension</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedShape.tension || 0.5}
                  onChange={(e) =>
                    onPropertyChange("tension", parseFloat(e.target.value))
                  }
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">
                  {((selectedShape.tension || 0.5) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="closed"
                  checked={selectedShape.closed || false}
                  onChange={(e) => onPropertyChange("closed", e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="closed" className="text-xs text-gray-500">
                  Closed curve
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fill Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={selectedShape.fill}
              onChange={(e) => onPropertyChange("fill", e.target.value)}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={selectedShape.fill}
              onChange={(e) => onPropertyChange("fill", e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stroke Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={selectedShape.stroke}
              onChange={(e) => onPropertyChange("stroke", e.target.value)}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={selectedShape.stroke}
              onChange={(e) => onPropertyChange("stroke", e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stroke Width
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={selectedShape.strokeWidth}
            onChange={(e) =>
              onPropertyChange("strokeWidth", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {selectedShape.strokeWidth}px
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedShape.opacity}
            onChange={(e) =>
              onPropertyChange("opacity", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {Math.round(selectedShape.opacity * 100)}%
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rotation
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={selectedShape.rotation}
            onChange={(e) =>
              onPropertyChange("rotation", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {selectedShape.rotation}°
          </div>
        </div>

        {/* Text properties */}
        {selectedShape.type === "text" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                value={selectedShape.text || ""}
                onChange={(e) => onPropertyChange("text", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <input
                type="number"
                value={selectedShape.fontSize || 16}
                onChange={(e) =>
                  onPropertyChange("fontSize", parseFloat(e.target.value) || 16)
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </>
        )}

        {/* Resize Instructions */}
        {canResize && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Resize Instructions
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 🔵 Blue handles: resize corners</li>
              <li>• 🟢 Green handles: resize edges</li>
              <li>• Select the shape first</li>
              <li>• Drag handles to resize</li>
              <li>• Minimum size: 10px</li>
            </ul>
          </div>
        )}

        {/* Curve Instructions */}
        {isCurve && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-medium text-purple-700 mb-2">
              Curve Instructions
            </h4>
            <ul className="text-xs text-purple-600 space-y-1">
              <li>• Click to add points</li>
              <li>• Double-click to finish</li>
              <li>• Drag control points to adjust</li>
              <li>• Use tension slider for smoothness</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
