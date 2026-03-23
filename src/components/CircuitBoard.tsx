import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Group, Text } from 'react-konva';
import { CircuitComponent, Connection, Point } from '../types';
import { simulateCircuit } from '../simulator';
import { Battery, Zap, Lightbulb, ToggleLeft, Trash2, MousePointer2, Share2, Play, Square, Info, RefreshCw } from 'lucide-react';

const GRID_SIZE = 20;

export default function CircuitBoard() {
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'wire' | 'delete' | 'battery' | 'resistor' | 'led' | 'switch'>('select');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeComponents, setActiveComponents] = useState<CircuitComponent[]>([]);
  const [showHelp, setShowHelp] = useState(true);
  
  const [wiringStart, setWiringStart] = useState<{ id: string; pin: number } | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  const stageRef = useRef<any>(null);

  useEffect(() => {
    if (isSimulating) {
      const result = simulateCircuit(components, connections);
      setActiveComponents(result);
    } else {
      setActiveComponents(components.map(c => ({ ...c, state: false })));
    }
  }, [isSimulating, components, connections]);

  const handleStageClick = (e: any) => {
    // If we clicked on a component or pin, don't place a new one
    if (e.target !== e.target.getStage()) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const snappedX = Math.round(pos.x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(pos.y / GRID_SIZE) * GRID_SIZE;

    if (['battery', 'resistor', 'led', 'switch'].includes(selectedTool)) {
      const newComp: CircuitComponent = {
        id: Math.random().toString(36).substr(2, 9),
        type: selectedTool as any,
        x: snappedX,
        y: snappedY,
        rotation: 0,
        value: selectedTool === 'battery' ? 9 : 100,
        state: false,
      };
      setComponents([...components, newComp]);
      setSelectedTool('select');
    }
  };

  const handlePinClick = (compId: string, pinIndex: number) => {
    if (selectedTool === 'wire') {
      if (!wiringStart) {
        setWiringStart({ id: compId, pin: pinIndex });
      } else {
        if (wiringStart.id !== compId || wiringStart.pin !== pinIndex) {
          const newConn: Connection = {
            id: Math.random().toString(36).substr(2, 9),
            fromId: wiringStart.id,
            fromPin: wiringStart.pin,
            toId: compId,
            toPin: pinIndex,
          };
          setConnections([...connections, newConn]);
        }
        setWiringStart(null);
      }
    }
  };

  const handleComponentClick = (id: string) => {
    if (selectedTool === 'delete') {
      setComponents(components.filter(c => c.id !== id));
      setConnections(connections.filter(conn => conn.fromId !== id && conn.toId !== id));
    } else if (selectedTool === 'select') {
      setComponents(components.map(c => {
        if (c.id === id && c.type === 'switch') {
          return { ...c, state: !c.state };
        }
        return c;
      }));
    }
  };

  const getPinPos = (comp: CircuitComponent, pinIndex: number) => {
    const offset = 40;
    if (pinIndex === 0) return { x: comp.x - offset, y: comp.y };
    return { x: comp.x + offset, y: comp.y };
  };

  const clearAll = () => {
    if (window.confirm('Clear all components and connections?')) {
      setComponents([]);
      setConnections([]);
      setIsSimulating(false);
    }
  };

  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 256, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth - 256, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white font-sans">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#2a2a2a] bg-[#151619] p-6 flex flex-col gap-8 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-black" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">CircuitPro</h1>
        </div>

        <div>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8E9299] mb-4">Tools</h2>
          <div className="grid grid-cols-2 gap-2">
            <ToolButton active={selectedTool === 'select'} onClick={() => setSelectedTool('select')} icon={MousePointer2} label="Select" />
            <ToolButton active={selectedTool === 'wire'} onClick={() => setSelectedTool('wire')} icon={Share2} label="Wire" />
            <ToolButton active={selectedTool === 'delete'} onClick={() => setSelectedTool('delete')} icon={Trash2} label="Delete" />
            <ToolButton active={false} onClick={clearAll} icon={RefreshCw} label="Clear" />
          </div>
        </div>

        <div>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8E9299] mb-4">Components</h2>
          <div className="grid grid-cols-2 gap-2">
            <ToolButton active={selectedTool === 'battery'} onClick={() => setSelectedTool('battery')} icon={Battery} label="Battery" />
            <ToolButton active={selectedTool === 'resistor'} onClick={() => setSelectedTool('resistor')} icon={Zap} label="Resistor" />
            <ToolButton active={selectedTool === 'led'} onClick={() => setSelectedTool('led')} icon={Lightbulb} label="LED" />
            <ToolButton active={selectedTool === 'switch'} onClick={() => setSelectedTool('switch')} icon={ToggleLeft} label="Switch" />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all transform active:scale-95 ${isSimulating ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'}`}
          >
            {isSimulating ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            {isSimulating ? 'STOP SIM' : 'RUN SIM'}
          </button>
          
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="w-full py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-mono text-[#8E9299] hover:text-white transition-colors"
          >
            <Info size={14} />
            {showHelp ? 'HIDE HELP' : 'SHOW HELP'}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]" onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}>
        {/* Help Overlay */}
        {showHelp && (
          <div className="absolute top-6 right-6 w-72 bg-[#151619]/90 backdrop-blur-md border border-[#2a2a2a] p-5 rounded-2xl z-20 shadow-2xl">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-green-500">
              <Info size={16} /> Quick Guide
            </h3>
            <ul className="text-xs space-y-3 text-[#8E9299]">
              <li className="flex gap-2"><span className="text-white font-bold">1.</span> Select a component and click on the grid to place it.</li>
              <li className="flex gap-2"><span className="text-white font-bold">2.</span> Use the <span className="text-white">Wire</span> tool to connect pins (the small circles).</li>
              <li className="flex gap-2"><span className="text-white font-bold">3.</span> Click <span className="text-white">Run Sim</span> to see if your LED lights up!</li>
              <li className="flex gap-2"><span className="text-white font-bold">4.</span> In <span className="text-white">Select</span> mode, click a Switch to toggle it.</li>
            </ul>
          </div>
        )}

        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
        }} />

        <Stage 
          width={stageSize.width} 
          height={stageSize.height}
          onClick={handleStageClick}
          ref={stageRef}
        >
          <Layer>
            {/* Connections */}
            {connections.map(conn => {
              const from = components.find(c => c.id === conn.fromId);
              const to = components.find(c => c.id === conn.toId);
              if (!from || !to) return null;
              const p1 = getPinPos(from, conn.fromPin);
              const p2 = getPinPos(to, conn.toPin);
              return (
                <Line
                  key={conn.id}
                  points={[p1.x, p1.y, p2.x, p2.y]}
                  stroke={isSimulating && activeComponents.find(c => c.id === from.id)?.state ? "#4ade80" : "#2a2a2a"}
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                  shadowBlur={isSimulating && activeComponents.find(c => c.id === from.id)?.state ? 15 : 0}
                  shadowColor="#4ade80"
                />
              );
            })}

            {/* Ghost Wire */}
            {wiringStart && (
              <Line
                points={[
                  getPinPos(components.find(c => c.id === wiringStart.id)!, wiringStart.pin).x,
                  getPinPos(components.find(c => c.id === wiringStart.id)!, wiringStart.pin).y,
                  mousePos.x,
                  mousePos.y
                ]}
                stroke="#4ade80"
                strokeWidth={2}
                dash={[10, 5]}
                opacity={0.5}
              />
            )}

            {/* Components */}
            {activeComponents.map(comp => (
              <Group 
                key={comp.id} 
                x={comp.x} 
                y={comp.y}
                onClick={() => handleComponentClick(comp.id)}
                draggable={selectedTool === 'select'}
                onDragEnd={(e) => {
                  const x = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
                  const y = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
                  setComponents(components.map(c => c.id === comp.id ? { ...c, x, y } : c));
                }}
              >
                {/* Component Body */}
                <Rect
                  x={-35}
                  y={-20}
                  width={70}
                  height={40}
                  fill="#151619"
                  stroke={comp.type === 'led' && comp.state ? "#fde047" : "#2a2a2a"}
                  strokeWidth={2}
                  cornerRadius={8}
                  shadowBlur={comp.type === 'led' && comp.state ? 30 : 0}
                  shadowColor="#fde047"
                />

                {/* Internal Details based on type */}
                {comp.type === 'battery' && (
                  <Group>
                    <Rect x={-25} y={-10} width={10} height={20} fill="#ef4444" cornerRadius={2} />
                    <Rect x={15} y={-10} width={10} height={20} fill="#3b82f6" cornerRadius={2} />
                    <Text text="+" x={-23} y={-8} fill="white" fontSize={14} fontStyle="bold" />
                    <Text text="-" x={17} y={-8} fill="white" fontSize={14} fontStyle="bold" />
                  </Group>
                )}

                {comp.type === 'led' && (
                  <Circle 
                    radius={12} 
                    fill={comp.state ? "#fde047" : "#333"} 
                    stroke={comp.state ? "#fff" : "#444"}
                    strokeWidth={1}
                  />
                )}

                {comp.type === 'resistor' && (
                  <Group>
                    <Rect x={-20} y={-4} width={40} height={8} fill="#d97706" cornerRadius={2} />
                    <Rect x={-10} y={-4} width={4} height={8} fill="#92400e" />
                    <Rect x={0} y={-4} width={4} height={8} fill="#92400e" />
                    <Rect x={10} y={-4} width={4} height={8} fill="#92400e" />
                  </Group>
                )}

                {comp.type === 'switch' && (
                  <Group>
                    <Line 
                      points={comp.state ? [-15, 0, 15, 0] : [-15, 0, 10, -15]} 
                      stroke={comp.state ? "#4ade80" : "#ef4444"} 
                      strokeWidth={4} 
                    />
                    <Circle x={-15} y={0} radius={4} fill="#666" />
                    <Circle x={15} y={0} radius={4} fill="#666" />
                  </Group>
                )}
                
                {/* Pins */}
                <Group onClick={(e) => { e.cancelBubble = true; handlePinClick(comp.id, 0); }}>
                  <Line points={[-35, 0, -40, 0]} stroke="#444" strokeWidth={2} />
                  <Circle x={-40} y={0} radius={6} fill="#1e1e1e" stroke="#444" strokeWidth={2} />
                </Group>
                <Group onClick={(e) => { e.cancelBubble = true; handlePinClick(comp.id, 1); }}>
                  <Line points={[35, 0, 40, 0]} stroke="#444" strokeWidth={2} />
                  <Circle x={40} y={0} radius={6} fill="#1e1e1e" stroke="#444" strokeWidth={2} />
                </Group>

                {/* Label */}
                <Text 
                  text={comp.type.toUpperCase()} 
                  x={-30} 
                  y={25} 
                  fontSize={8} 
                  fontFamily="monospace" 
                  fill="#444" 
                  width={60}
                  align="center"
                />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all transform active:scale-95 ${active ? 'bg-[#2a2a2a] border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#8E9299] hover:bg-[#252525] hover:border-[#3a3a3a]'}`}
    >
      <Icon size={20} />
      <span className="text-[9px] mt-2 font-mono font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
