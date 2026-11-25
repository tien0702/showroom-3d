/**
 * Room & design domain types.
 * Plan coordinates are [x, z] in metres on the floor plane. Y is up.
 */

export type Vec2 = [number, number];

export type OpeningType = 'door' | 'window';

export interface Opening {
  id: string;
  type: OpeningType;
  /** Distance from the wall's `from` corner to the opening's near edge. */
  offset: number;
  width: number;
  height: number;
  /** Window sill height. 0 for doors. */
  sill: number;
}

export interface Wall {
  id: string;
  from: string;
  to: string;
  thickness: number;
  openings: Opening[];
}

export interface Room {
  id: string;
  name: string;
  height: number;
  /** Corner id → position. Walls reference corners so moving one moves both walls. */
  corners: Record<string, Vec2>;
  walls: Wall[];
  /** Corner ids in order, describing the floor outline. */
  outline: string[];
  floor: { material: string; color: string };
  wallColor: string;
}

/** A product instance placed in a design. */
export interface PlacedItem {
  uid: string;
  sku: string;
  variant: string;
  /** Plan position of the item's pivot (bottom-centre of footprint). */
  position: Vec2;
  /** Elevation of the pivot above the floor. 0 for floor items. */
  elevation: number;
  rotationY: number;
}

export type RoomKind = 'living' | 'bedroom' | 'dining' | 'studio';
export type FurnishLevel = 'full' | 'partial' | 'empty';

export interface Showroom {
  id: string;
  name: string;
  style: string;
  kind: RoomKind;
  cover: string;
  room: Room;
  items: PlacedItem[];
}
