export type SelectorStrategy = "css" | "text";

export type TextTarget = {
  root: string;
  text: string;
};

export type CssTarget = string | string[];

export type TourStep = {
  id: string;
  route: string;
  selectorStrategy: SelectorStrategy;
  target: CssTarget | TextTarget;
  title: string;
  body: string;
};

export type TargetRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type TourStatus =
  | "not_started"
  | "in_progress"
  | "skipped"
  | "finished";

export type TourState = {
  status: TourStatus;
  stepIndex: number;
  updatedAt: number;
};
