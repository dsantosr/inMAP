export type FlowConnection =
  | { type: 'simple'; to: string }
  | { type: 'bifurcation'; to: string[] }
  | { type: 'conditional'; text: string; positiveTo: string; negativeTo: string }
  | { type: 'none' };

export interface FlowAction {
  id: string;
  what: string;
  who: string;
  how: string;
  reference: string;
  connection: FlowConnection;
}

export interface FlowchartData {
  name: string;
  actions: FlowAction[];
}
