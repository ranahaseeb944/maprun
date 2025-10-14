"use client";

import React, { useState, useCallback } from "react";
import Toolbar, { Tool } from "./components/Toolbar";
import LayersPanel, { Layer } from "./components/LayersPanel";
import PropertiesPanel, { ShapeProperties } from "./components/PropertiesPanel";
import MapCanvas from "./components/MapCanvas";

export default function Home() {
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [selectedShape, setSelectedShape] = useState<ShapeProperties | null>(
    null
  );
  const [shapes, setShapes] = useState<ShapeProperties[]>([]);
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: "layer1",
      name: "Main Layer",
      visible: true,
      locked: false,
      shapes: [],
    },
  ]);
  const [activeLayer, setActiveLayer] = useState("layer1");

  // Toolbar handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handleSave = useCallback(() => {
    const mapData = {
      shapes,
      layers,
      selectedShape,
      zoom,
      timestamp: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `map_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [shapes, layers, selectedShape, zoom]);

  const handleLoad = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.shapes) setShapes(data.shapes);
            if (data.layers) setLayers(data.layers);
            if (data.zoom) setZoom(data.zoom);
            console.log("Map loaded successfully");
          } catch (error) {
            console.error("Error loading map:", error);
            alert("Error loading map file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const handleClear = useCallback(() => {
    if (confirm("Are you sure you want to clear all shapes?")) {
      setShapes([]);
      setSelectedShape(null);
      setLayers((prev) => prev.map((layer) => ({ ...layer, shapes: [] })));
    }
  }, []);

  // Layer handlers
  const handleLayerSelect = useCallback((layerId: string) => {
    setActiveLayer(layerId);
  }, []);

  const handleLayerToggle = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const handleLayerLock = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    );
  }, []);

  const handleLayerAdd = useCallback(() => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      shapes: [],
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayer(newLayer.id);
  }, [layers.length]);

  const handleLayerDelete = useCallback(
    (layerId: string) => {
      if (layers.length === 1) return;
      setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
      if (activeLayer === layerId) {
        const remainingLayers = layers.filter((layer) => layer.id !== layerId);
        setActiveLayer(remainingLayers[0].id);
      }
    },
    [layers, activeLayer]
  );

  const handleLayerRename = useCallback((layerId: string, name: string) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, name } : layer))
    );
  }, []);

  // Shape handlers
  const handleShapeSelect = useCallback((shape: ShapeProperties | null) => {
    setSelectedShape(shape);
  }, []);

  const handleShapeMove = useCallback(
    (shapeId: string, x: number, y: number) => {
      setShapes((prev) =>
        prev.map((shape) => (shape.id === shapeId ? { ...shape, x, y } : shape))
      );
      // Update selected shape if it's the one being moved
      if (selectedShape && selectedShape.id === shapeId) {
        setSelectedShape((prev) => (prev ? { ...prev, x, y } : null));
      }
    },
    [selectedShape]
  );

  const handleShapeAdd = useCallback(
    (shape: ShapeProperties) => {
      setShapes((prev) => [...prev, shape]);
      setSelectedShape(shape);
      // Update layer with new shape
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === activeLayer
            ? { ...layer, shapes: [...layer.shapes, shape.id] }
            : layer
        )
      );
    },
    [activeLayer]
  );

  const handleShapeUpdate = useCallback(
    (shapeId: string, properties: Partial<ShapeProperties>) => {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === shapeId ? { ...shape, ...properties } : shape
        )
      );
      // Update selected shape if it's the one being updated
      if (selectedShape && selectedShape.id === shapeId) {
        setSelectedShape((prev) => (prev ? { ...prev, ...properties } : null));
      }
    },
    [selectedShape]
  );

  const handleShapeDelete = useCallback(
    (shapeId: string) => {
      setShapes((prev) => prev.filter((shape) => shape.id !== shapeId));
      if (selectedShape && selectedShape.id === shapeId) {
        setSelectedShape(null);
      }
      // Remove from all layers
      setLayers((prev) =>
        prev.map((layer) => ({
          ...layer,
          shapes: layer.shapes.filter((id) => id !== shapeId),
        }))
      );
    },
    [selectedShape]
  );

  const handlePropertyChange = useCallback(
    (property: string, value: any) => {
      if (selectedShape) {
        const updatedShape = { ...selectedShape, [property]: value };
        setSelectedShape(updatedShape);
        handleShapeUpdate(selectedShape.id, { [property]: value });
      }
    },
    [selectedShape, handleShapeUpdate]
  );

  const handleDeleteShape = useCallback(() => {
    if (selectedShape) {
      handleShapeDelete(selectedShape.id);
    }
  }, [selectedShape, handleShapeDelete]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">
          MapRun - Professional Map Editor
        </h1>
        <p className="text-gray-600 mt-1">
          Create, edit, and manage interactive maps with powerful drawing tools
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0">
        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onSave={handleSave}
          onLoad={handleLoad}
          onClear={handleClear}
          zoom={zoom}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layers Panel */}
        <div className="flex-shrink-0">
          <LayersPanel
            layers={layers}
            activeLayer={activeLayer}
            onLayerSelect={handleLayerSelect}
            onLayerToggle={handleLayerToggle}
            onLayerLock={handleLayerLock}
            onLayerAdd={handleLayerAdd}
            onLayerDelete={handleLayerDelete}
            onLayerRename={handleLayerRename}
          />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <MapCanvas
            width={800}
            height={600}
            activeTool={activeTool}
            zoom={zoom}
            shapes={shapes}
            onShapeSelect={handleShapeSelect}
            onShapeMove={handleShapeMove}
            onShapeAdd={handleShapeAdd}
            onShapeUpdate={handleShapeUpdate}
            onShapeDelete={handleShapeDelete}
          />
        </div>

        {/* Properties Panel */}
        <div className="flex-shrink-0">
          <PropertiesPanel
            selectedShape={selectedShape}
            onPropertyChange={handlePropertyChange}
            onDeleteShape={handleDeleteShape}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center text-sm text-gray-600 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span>Tool: {activeTool}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Layer: {layers.find((l) => l.id === activeLayer)?.name}</span>
          <span>Shapes: {shapes.length}</span>
        </div>
        <div>
          {selectedShape && (
            <span>
              Selected: {selectedShape.type} - {selectedShape.id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
