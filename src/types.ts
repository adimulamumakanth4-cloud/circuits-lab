export type ComponentType = 'battery' | 'resistor' | 'led' | 'switch' | 'wire';

export interface Point {
  x: number;
  y: number;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  value: number; // Voltage for battery, Resistance for resistor
  state?: boolean; // For switch (on/off) or LED (lit/unlit)
}

export interface Connection {
  id: string;
  fromId: string;
  fromPin: number; // 0 or 1
  toId: string;
  toPin: number; // 0 or 1
}

export interface CircuitState {
  components: CircuitComponent[];
  connections: Connection[];
}
