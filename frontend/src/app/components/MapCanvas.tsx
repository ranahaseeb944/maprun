import React, { useRef, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Ellipse,
  Line,
  Text,
  Group,
  Path,
} from "react-konva";
import Konva from "konva";
import { Tool } from "./Toolbar";
import { ShapeProperties } from "./PropertiesPanel";

interface MapCanvasProps {
  width?: number;
  height?: number;
  activeTool: Tool;
  zoom: number;
  shapes: ShapeProperties[];
  onShapeSelect?: (shape: ShapeProperties | null) => void;
  onShapeMove?: (shapeId: string, x: number, y: number) => void;
  onShapeAdd?: (shape: ShapeProperties) => void;
  onShapeUpdate?: (
    shapeId: string,
    properties: Partial<ShapeProperties>
  ) => void;
  onShapeDelete?: (shapeId: string) => void;
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number };
  currentShape: ShapeProperties | null;
  points: number[];
  controlPoints: number[];
}

interface ResizeState {
  isResizing: boolean;
  handle: string;
  startPoint: { x: number; y: number };
  startShape: ShapeProperties;
}

export default function MapCanvas({
  width = 800,
  height = 600,
  activeTool,
  zoom,
  shapes,
  onShapeSelect,
  onShapeMove,
  onShapeAdd,
  onShapeUpdate,
  onShapeDelete,
}: MapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: { x: 0, y: 0 },
    currentShape: null,
    points: [],
    controlPoints: [],
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: "",
    startPoint: { x: 0, y: 0 },
    startShape: {} as ShapeProperties,
  });

  // Generate unique IDs
  const generateId = () =>
    `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to find shape ID from any clicked element
  const findShapeId = (target: any): string | null => {
    let current = target;
    while (current) {
      // Check if current element has an ID and it's a shape ID
      const id = current.id();
      if (id && shapes.find((s) => s.id === id)) {
        return id;
      }
      // Move to parent
      current = current.getParent();
      // Stop if we reach the stage
      if (current === current.getStage()) {
        break;
      }
    }
    return null;
  };

  // Generate SVG path for curves
  const generateCurvePath = (
    points: number[],
    tension: number = 0,
    closed: boolean = false
  ): string => {
    if (points.length < 4) return "";

    let path = `M ${points[0]} ${points[1]}`;

    if (points.length === 4) {
      // Two-point curve (straight line that can be curved)
      const x1 = points[0];
      const y1 = points[1];
      const x2 = points[2];
      const y2 = points[3];

      if (tension === 0) {
        // Straight line
        path += ` L ${x2} ${y2}`;
      } else {
        // Curved line - create a quadratic curve
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        // Calculate control point based on tension
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const perpendicular = Math.PI / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Control point perpendicular to the line
        const cpX =
          midX + Math.cos(angle + perpendicular) * distance * tension * 0.5;
        const cpY =
          midY + Math.sin(angle + perpendicular) * distance * tension * 0.5;

        path += ` Q ${cpX} ${cpY} ${x2} ${y2}`;
      }
    } else if (points.length >= 6) {
      // Multi-point curve
      for (let i = 2; i < points.length - 2; i += 2) {
        const x0 = points[i - 2];
        const y0 = points[i - 1];
        const x1 = points[i];
        const y1 = points[i + 1];
        const x2 = points[i + 2];
        const y2 = points[i + 3];

        // Calculate control points for smooth curves
        const cp1x = x1 + (x2 - x0) * tension * 0.5;
        const cp1y = y1 + (y2 - y0) * tension * 0.5;
        const cp2x = x2 - (x2 - x0) * tension * 0.5;
        const cp2y = y2 - (y2 - y0) * tension * 0.5;

        path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
      }
    }

    if (closed) {
      path += " Z";
    }

    return path;
  };

  // Handle mouse down for drawing
  const handleMouseDown = useCallback(
    (e: any) => {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const x = point.x;
      const y = point.y;

      console.log("Mouse down:", {
        activeTool,
        x,
        y,
        isDrawing: drawingState.isDrawing,
        points: drawingState.points,
      });

      // Check if clicking on resize handle first - improved detection
      if (e.target.hasName && e.target.hasName("resize-handle")) {
        const handle = e.target.getAttr("data-handle");
        const shapeId = e.target.getAttr("data-shape-id");
        const shape = shapes.find((s) => s.id === shapeId);

        if (shape) {
          setResizeState({
            isResizing: true,
            handle,
            startPoint: { x, y },
            startShape: { ...shape },
          });
        }
        e.cancelBubble = true; // Prevent event bubbling
        return;
      }

      if (activeTool === "select") {
        // Selection logic
        const clickedShape = e.target;

        // If clicking on stage (empty area), deselect
        if (clickedShape === stage) {
          setSelectedShape(null);
          onShapeSelect?.(null);
          return;
        }

        // Find the shape ID from the clicked element
        const shapeId = findShapeId(clickedShape);

        if (shapeId) {
          setSelectedShape(shapeId);
          const shape = shapes.find((s) => s.id === shapeId);
          if (shape) {
            onShapeSelect?.(shape);
          }
        } else {
          // If no shape found, deselect
          setSelectedShape(null);
          onShapeSelect?.(null);
        }
        return;
      }

      if (activeTool === "pan") {
        stage.draggable(true);
        return;
      }

      // Handle curve tools
      if (activeTool === "curve" || activeTool === "bezier") {
        if (!drawingState.isDrawing) {
          // Start new curve - create a straight line initially
          const newShape: ShapeProperties = {
            id: generateId(),
            type: activeTool,
            x: 0,
            y: 0,
            fill: "transparent",
            stroke: "#1f2937",
            strokeWidth: 2,
            opacity: 1,
            rotation: 0,
            points: [x, y, x, y], // Start with two identical points (straight line)
            tension: 0, // Start with no curve (straight line)
            closed: false,
          };

          setDrawingState({
            isDrawing: true,
            startPoint: { x, y },
            currentShape: newShape,
            points: [x, y, x, y],
            controlPoints: [],
          });
        } else {
          // Update the end point of the line
          const newPoints = [
            drawingState.points[0],
            drawingState.points[1],
            x,
            y,
          ];
          setDrawingState((prev) => ({
            ...prev,
            points: newPoints,
            currentShape: prev.currentShape
              ? {
                  ...prev.currentShape,
                  points: newPoints,
                }
              : null,
          }));
        }
        return;
      }

      // Start drawing for other tools
      setDrawingState({
        isDrawing: true,
        startPoint: { x, y },
        currentShape: null,
        points: [x, y],
        controlPoints: [],
      });

      // Create new shape based on tool
      const newShape: ShapeProperties = {
        id: generateId(),
        type: activeTool,
        x,
        y,
        width: 0,
        height: 0,
        fill: "#3b82f6",
        stroke: "#1f2937",
        strokeWidth: 2,
        opacity: 1,
        rotation: 0,
      };

      switch (activeTool) {
        case "rectangle":
          newShape.width = 0;
          newShape.height = 0;
          break;
        case "sharp-rectangle":
          newShape.width = 0;
          newShape.height = 0;
          break;
        case "circle":
          newShape.radius = 0;
          break;
        case "oval":
          newShape.width = 0;
          newShape.height = 0;
          break;
        case "line":
          newShape.points = [x, y];
          break;
        case "text":
          newShape.text = "New Text";
          newShape.fontSize = 16;
          newShape.width = 100;
          newShape.height = 20;
          break;
      }

      setDrawingState((prev) => ({ ...prev, currentShape: newShape }));
    },
    [activeTool, shapes, onShapeSelect, drawingState.isDrawing]
  );

  // Handle double click to finish curves
  const handleDoubleClick = useCallback(
    (e: any) => {
      if (
        (activeTool === "curve" || activeTool === "bezier") &&
        drawingState.isDrawing &&
        drawingState.currentShape
      ) {
        // Finish the curve
        onShapeAdd?.(drawingState.currentShape);
        setSelectedShape(drawingState.currentShape.id);

        setDrawingState({
          isDrawing: false,
          startPoint: { x: 0, y: 0 },
          currentShape: null,
          points: [],
          controlPoints: [],
        });
      }
    },
    [activeTool, drawingState, onShapeAdd]
  );

  // Handle mouse move for drawing and resizing
  const handleMouseMove = useCallback(
    (e: any) => {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const x = point.x;
      const y = point.y;

      // Handle resizing
      if (resizeState.isResizing) {
        const { handle, startPoint, startShape } = resizeState;
        const deltaX = x - startPoint.x;
        const deltaY = y - startPoint.y;

        let newProperties: Partial<ShapeProperties> = {};

        switch (startShape.type) {
          case "rectangle":
          case "sharp-rectangle":
          case "oval":
          case "text":
            const width = startShape.width || 0;
            const height = startShape.height || 0;
            switch (handle) {
              case "top-left":
                newProperties = {
                  x: startShape.x + deltaX,
                  y: startShape.y + deltaY,
                  width: width - deltaX,
                  height: height - deltaY,
                };
                break;
              case "top-right":
                newProperties = {
                  y: startShape.y + deltaY,
                  width: width + deltaX,
                  height: height - deltaY,
                };
                break;
              case "bottom-left":
                newProperties = {
                  x: startShape.x + deltaX,
                  width: width - deltaX,
                  height: height + deltaY,
                };
                break;
              case "bottom-right":
                newProperties = {
                  width: width + deltaX,
                  height: height + deltaY,
                };
                break;
              // Edge handles
              case "top":
                newProperties = {
                  y: startShape.y + deltaY,
                  height: height - deltaY,
                };
                break;
              case "bottom":
                newProperties = {
                  height: height + deltaY,
                };
                break;
              case "left":
                newProperties = {
                  x: startShape.x + deltaX,
                  width: width - deltaX,
                };
                break;
              case "right":
                newProperties = {
                  width: width + deltaX,
                };
                break;
            }
            break;

          case "circle":
            const centerX = startShape.x;
            const centerY = startShape.y;
            const distance = Math.sqrt(
              Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            );
            newProperties = { radius: distance };
            break;
        }

        // Ensure minimum dimensions
        if (newProperties.width !== undefined && newProperties.width < 10) {
          newProperties.width = 10;
        }
        if (newProperties.height !== undefined && newProperties.height < 10) {
          newProperties.height = 10;
        }
        if (newProperties.radius !== undefined && newProperties.radius < 5) {
          newProperties.radius = 5;
        }

        onShapeUpdate?.(startShape.id, newProperties);
        return;
      }

      // Handle drawing
      if (!drawingState.isDrawing || !drawingState.currentShape) return;

      const { startPoint } = drawingState;
      const shape = { ...drawingState.currentShape };

      switch (activeTool) {
        case "rectangle":
          shape.width = Math.abs(x - startPoint.x);
          shape.height = Math.abs(y - startPoint.y);
          shape.x = Math.min(startPoint.x, x);
          shape.y = Math.min(startPoint.y, y);
          break;
        case "sharp-rectangle":
          shape.width = Math.abs(x - startPoint.x);
          shape.height = Math.abs(y - startPoint.y);
          shape.x = Math.min(startPoint.x, x);
          shape.y = Math.min(startPoint.y, y);
          break;
        case "circle":
          const radius = Math.sqrt(
            Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
          );
          shape.radius = radius;
          break;
        case "oval":
          shape.width = Math.abs(x - startPoint.x);
          shape.height = Math.abs(y - startPoint.y);
          shape.x = Math.min(startPoint.x, x);
          shape.y = Math.min(startPoint.y, y);
          break;
        case "line":
          shape.points = [startPoint.x, startPoint.y, x, y];
          break;
        case "curve":
        case "bezier":
          // Update the end point of the curve
          shape.points = [startPoint.x, startPoint.y, x, y];
          break;
      }

      setDrawingState((prev) => ({ ...prev, currentShape: shape }));
    },
    [
      drawingState.isDrawing,
      drawingState.currentShape,
      drawingState.startPoint,
      activeTool,
      resizeState,
      onShapeUpdate,
    ]
  );

  // Handle mouse up to finish drawing and resizing
  const handleMouseUp = useCallback(() => {
    // Handle resize end
    if (resizeState.isResizing) {
      setResizeState({
        isResizing: false,
        handle: "",
        startPoint: { x: 0, y: 0 },
        startShape: {} as ShapeProperties,
      });
      return;
    }

    // Handle drawing end
    if (!drawingState.isDrawing || !drawingState.currentShape) return;

    const shape = drawingState.currentShape;

    // Only add shape if it has meaningful dimensions
    if (
      (activeTool === "rectangle" &&
        (shape.width || 0) > 5 &&
        (shape.height || 0) > 5) ||
      (activeTool === "sharp-rectangle" &&
        (shape.width || 0) > 5 &&
        (shape.height || 0) > 5) ||
      (activeTool === "circle" && (shape.radius || 0) > 5) ||
      (activeTool === "oval" &&
        (shape.width || 0) > 5 &&
        (shape.height || 0) > 5) ||
      (activeTool === "line" && shape.points && shape.points.length >= 4) ||
      (activeTool === "curve" && shape.points && shape.points.length >= 4) ||
      (activeTool === "bezier" && shape.points && shape.points.length >= 4) ||
      activeTool === "text"
    ) {
      onShapeAdd?.(shape);
      setSelectedShape(shape.id);
    }

    setDrawingState({
      isDrawing: false,
      startPoint: { x: 0, y: 0 },
      currentShape: null,
      points: [],
      controlPoints: [],
    });
  }, [drawingState, activeTool, onShapeAdd, resizeState]);

  // Handle shape property updates
  const handlePropertyUpdate = useCallback(
    (shapeId: string, properties: Partial<ShapeProperties>) => {
      onShapeUpdate?.(shapeId, properties);
    },
    [onShapeUpdate]
  );

  // Render resize handles
  const renderResizeHandles = (shape: ShapeProperties) => {
    if (selectedShape !== shape.id || activeTool !== "select") return null;

    const handles = [];
    const handleSize = 8;
    const handleOffset = handleSize / 2;

    switch (shape.type) {
      case "rectangle":
      case "sharp-rectangle":
      case "oval":
      case "text":
        const width = shape.width || 0;
        const height = shape.height || 0;

        // Corner handles
        const corners = [
          {
            name: "top-left",
            x: shape.x - handleOffset,
            y: shape.y - handleOffset,
          },
          {
            name: "top-right",
            x: shape.x + width - handleOffset,
            y: shape.y - handleOffset,
          },
          {
            name: "bottom-left",
            x: shape.x - handleOffset,
            y: shape.y + height - handleOffset,
          },
          {
            name: "bottom-right",
            x: shape.x + width - handleOffset,
            y: shape.y + height - handleOffset,
          },
        ];

        // Edge handles
        const edges = [
          {
            name: "top",
            x: shape.x + width / 2 - handleOffset,
            y: shape.y - handleOffset,
          },
          {
            name: "bottom",
            x: shape.x + width / 2 - handleOffset,
            y: shape.y + height - handleOffset,
          },
          {
            name: "left",
            x: shape.x - handleOffset,
            y: shape.y + height / 2 - handleOffset,
          },
          {
            name: "right",
            x: shape.x + width - handleOffset,
            y: shape.y + height / 2 - handleOffset,
          },
        ];

        // Add corner handles
        corners.forEach((corner) => {
          handles.push(
            <Rect
              key={`${shape.id}-${corner.name}`}
              name="resize-handle"
              x={corner.x}
              y={corner.y}
              width={handleSize}
              height={handleSize}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={2}
              draggable={false}
              data-handle={corner.name}
              data-shape-id={shape.id}
              listening={true}
              hitStrokeWidth={4}
            />
          );
        });

        // Add edge handles
        edges.forEach((edge) => {
          handles.push(
            <Rect
              key={`${shape.id}-${edge.name}`}
              name="resize-handle"
              x={edge.x}
              y={edge.y}
              width={handleSize}
              height={handleSize}
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth={2}
              draggable={false}
              data-handle={edge.name}
              data-shape-id={shape.id}
              listening={true}
              hitStrokeWidth={4}
            />
          );
        });
        break;

      case "circle":
        const radius = shape.radius || 0;
        handles.push(
          <Circle
            key={`${shape.id}-resize-handle`}
            name="resize-handle"
            x={shape.x + radius}
            y={shape.y}
            radius={handleSize / 2}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2}
            draggable={false}
            data-handle="resize-handle"
            data-shape-id={shape.id}
            listening={true}
            hitStrokeWidth={4}
          />
        );
        break;
    }

    return handles;
  };

  // Render shape based on type
  const renderShape = (shape: ShapeProperties) => {
    const isSelected = selectedShape === shape.id;
    const canBeResized = [
      "rectangle",
      "sharp-rectangle",
      "circle",
      "oval",
      "text",
    ].includes(shape.type);

    const commonProps = {
      key: shape.id,
      id: shape.id,
      draggable: activeTool === "select" && !isSelected, // Only make draggable if not selected (not in Group)
      onClick: (e: any) => {
        e.cancelBubble = true; // Prevent event bubbling
        if (activeTool === "select") {
          setSelectedShape(shape.id);
          onShapeSelect?.(shape);
        }
      },
      onDragEnd: (e: any) => {
        const newAttrs = {
          x: e.target.x(),
          y: e.target.y(),
        };
        handlePropertyUpdate(shape.id, newAttrs);
        onShapeMove?.(shape.id, newAttrs.x, newAttrs.y);
      },
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      opacity: shape.opacity,
      rotation: shape.rotation,
    };

    const shapeElement = (() => {
      switch (shape.type) {
        case "rectangle":
          return (
            <Rect
              {...commonProps}
              x={isSelected && canBeResized ? 0 : shape.x}
              y={isSelected && canBeResized ? 0 : shape.y}
              width={shape.width || 0}
              height={shape.height || 0}
              cornerRadius={4}
            />
          );

        case "sharp-rectangle":
          return (
            <Rect
              {...commonProps}
              x={isSelected && canBeResized ? 0 : shape.x}
              y={isSelected && canBeResized ? 0 : shape.y}
              width={shape.width || 0}
              height={shape.height || 0}
              cornerRadius={0}
            />
          );

        case "circle":
          return (
            <Circle
              {...commonProps}
              x={isSelected && canBeResized ? 0 : shape.x}
              y={isSelected && canBeResized ? 0 : shape.y}
              radius={shape.radius || 0}
            />
          );

        case "oval":
          return (
            <Ellipse
              {...commonProps}
              x={
                isSelected && canBeResized
                  ? (shape.width || 0) / 2
                  : shape.x + (shape.width || 0) / 2
              }
              y={
                isSelected && canBeResized
                  ? (shape.height || 0) / 2
                  : shape.y + (shape.height || 0) / 2
              }
              radiusX={(shape.width || 0) / 2}
              radiusY={(shape.height || 0) / 2}
            />
          );

        case "line":
          return (
            <Line
              {...commonProps}
              points={shape.points || []}
              lineCap="round"
              lineJoin="round"
            />
          );

        case "text":
          return (
            <Text
              {...commonProps}
              x={isSelected && canBeResized ? 0 : shape.x}
              y={isSelected && canBeResized ? 0 : shape.y}
              text={shape.text || ""}
              fontSize={shape.fontSize || 16}
              fontFamily="Arial"
              width={shape.width}
              height={shape.height}
            />
          );

        case "curve":
        case "bezier":
          const pathData = generateCurvePath(
            shape.points || [],
            shape.tension || 0.5,
            shape.closed || false
          );
          console.log("Rendering curve shape:", { shape, pathData });

          if (pathData) {
            return (
              <Path
                {...commonProps}
                data={pathData}
                lineCap="round"
                lineJoin="round"
              />
            );
          } else {
            // Fallback to line if path generation fails
            return (
              <Line
                {...commonProps}
                points={shape.points || []}
                lineCap="round"
                lineJoin="round"
              />
            );
          }

        default:
          return null;
      }
    })();

    // If shape is selected and can be resized, wrap in Group
    if (isSelected && canBeResized) {
      return (
        <Group
          key={shape.id}
          x={shape.x}
          y={shape.y}
          id={shape.id}
          draggable={activeTool === "select"}
          onDragEnd={(e: any) => {
            const newAttrs = {
              x: e.target.x(),
              y: e.target.y(),
            };
            handlePropertyUpdate(shape.id, newAttrs);
            onShapeMove?.(shape.id, newAttrs.x, newAttrs.y);
          }}
        >
          {shapeElement}
        </Group>
      );
    }

    // For non-resizable shapes or unselected shapes, return the element directly
    return shapeElement;
  };

  // Render current drawing shape
  const renderCurrentShape = () => {
    if (!drawingState.currentShape) return null;
    return renderShape(drawingState.currentShape);
  };

  // Render current curve being drawn
  const renderCurrentCurve = () => {
    if (
      !drawingState.isDrawing ||
      (activeTool !== "curve" && activeTool !== "bezier")
    )
      return null;

    const elements = [];

    // Show start and end points
    if (drawingState.points.length >= 4) {
      // Start point
      elements.push(
        <Circle
          key="curve-start-point"
          x={drawingState.points[0]}
          y={drawingState.points[1]}
          radius={4}
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth={2}
          opacity={0.8}
        />
      );

      // End point
      elements.push(
        <Circle
          key="curve-end-point"
          x={drawingState.points[2]}
          y={drawingState.points[3]}
          radius={4}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={2}
          opacity={0.8}
        />
      );
    }

    console.log("Rendering current curve with points:", drawingState.points);

    // Show the curve/line
    if (drawingState.points.length === 4) {
      const tension = drawingState.currentShape?.tension || 0;
      const pathData = generateCurvePath(drawingState.points, tension, false);
      console.log("Generated path data:", pathData);

      if (pathData) {
        elements.push(
          <Path
            key="current-curve-path"
            data={pathData}
            stroke="#1f2937"
            strokeWidth={2}
            fill="transparent"
            lineCap="round"
            lineJoin="round"
            opacity={0.7}
          />
        );
      } else {
        // Fallback to line if path generation fails
        elements.push(
          <Line
            key="current-curve-fallback"
            points={drawingState.points}
            stroke="#1f2937"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
            opacity={0.7}
          />
        );
      }
    }

    return elements.length > 0 ? elements : null;
  };

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDblClick={handleDoubleClick}
          className="bg-white"
        >
          <Layer>
            {/* Grid background */}
            {Array.from({ length: Math.ceil(width / 50) }, (_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * 50, 0, i * 50, height]}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: Math.ceil(height / 50) }, (_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * 50, width, i * 50]}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
            ))}

            {/* Render all shapes */}
            {shapes.map(renderShape)}

            {/* Render resize handles for selected shape */}
            {selectedShape &&
              shapes.find((s) => s.id === selectedShape) &&
              renderResizeHandles(shapes.find((s) => s.id === selectedShape)!)}

            {/* Render current drawing shape */}
            {renderCurrentShape()}

            {/* Render current curve being drawn */}
            {renderCurrentCurve()}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
