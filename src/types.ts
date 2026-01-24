export interface NodeData {
  id: number;
  pid?: number;
  label: string;
  x: number;
  y: number;
  children?: NodeData[];
  expanded?: boolean;
}

export interface Point {
  x: number;
  y: number;
}
