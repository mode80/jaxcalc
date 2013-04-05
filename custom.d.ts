// Touch event related
interface Touch {
  identifier: number;
  target: EventTarget;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
};

interface TouchList {
  length: number;
  item(index: number): Touch;
  identifiedTouch(identifier: number): Touch;
};

interface TouchEvent extends UIEvent {
  touches: TouchList;
  targetTouches: TouchList;
  changedTouches: TouchList;
  altKey: bool;
  metaKey: bool;
  ctrlKey: bool;
  shiftKey: bool;
  initTouchEvent(type: string, canBubble: bool, cancelable: bool, view: AbstractView, detail: number, ctrlKey: bool, altKey: bool, shiftKey: bool, metaKey: bool, touches: TouchList, targetTouches: TouchList, changedTouches: TouchList);
};

declare var TouchEvent: {
  prototype: TouchEvent;
  new (): TouchEvent;
}

interface HTMLElement extends Element, MSHTMLElementRangeExtensions, ElementCSSInlineStyle, MSEventAttachmentTarget, MSHTMLElementExtensions, MSNodeExtensions {
  ontouchstart: (ev: TouchEvent) => any;
  ontouchmove: (ev: TouchEvent) => any;
  ontouchend: (ev: TouchEvent) => any;
  ontouchcancel: (ev: TouchEvent) => any;
}

// Hammer related
declare var Hammer: (element: Element, options?:HammerOptions) => HammerInstance;
interface HammerInstance {
  element: Element;
  enabled: bool;
  options: HammerOptions;
  on: (eventname:string, callback:(e:HammerEvent)=>any) => any;
}
interface HammerOptions{
  doubletap_distance: number;
  doubletap_interval: number;
  drag: bool;
  drag_block_horizontal: bool;
  drag_block_vertical: bool;
  drag_lock_to_axis: bool;
  drag_max_touches: number;
  drag_min_distance: number;
  hold: bool;
  hold_threshold: number;
  hold_timeout: number;
  prevent_default: bool;
  prevent_mouseevents: bool;
  release: bool;
  stop_browser_behavior: any;
  swipe: bool;
  swipe_max_touches: number;
  swipe_velocity: number; 
  tap_max_distance: number;
  tap_max_touchtime: number;
  touch: bool;
  transform: bool;
  transform_always_block: bool;
  transform_min_rotation: number; 
  transform_min_scale: number;
}
interface HammerEvent extends Event {
  gesture: HammerGesture;
}
interface HammerPoint {
  pageX: number;
  pageY; number;
}
interface HammerGesture {
  angle: number;
  center: HammerPoint;
  deltaTime: number;
  deltaX: number;
  deltaY: number;
  direction: string;
  distance: number;
  eventType: string;
  pointerType: string;
  preventDefault: ()=>void;
  rotation: number;
  scale: number;
  srcEvent: TouchEvent;
  startEvent: HammerGesture;
  stopDetect: () => void;
  stopPropagation: () => void;
  target: Element;
  timeStamp: number;
  touches: Touch[];
  velocityX: number;
  velocityY: number;
}
