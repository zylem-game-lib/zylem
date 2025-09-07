import { game as m } from "./lib/game/game.js";
import { stage as a } from "./lib/stage/stage.js";
import { entitySpawner as f } from "./lib/stage/entity-spawner.js";
import { vessel as s } from "./lib/core/vessel.js";
import { camera as i } from "./lib/camera/camera.js";
import { Perspectives as c } from "./lib/camera/perspective.js";
import { ZylemBox as h, box as v } from "./lib/entities/box.js";
import { sphere as d } from "./lib/entities/sphere.js";
import { sprite as R } from "./lib/entities/sprite.js";
import { plane as E } from "./lib/entities/plane.js";
import { zone as w } from "./lib/entities/zone.js";
import { actor as D } from "./lib/entities/actor.js";
import { text as I } from "./lib/entities/text.js";
import { rect as T } from "./lib/entities/rect.js";
import { makeMoveable as A } from "./lib/actions/capabilities/moveable.js";
import { makeRotatable as S } from "./lib/actions/capabilities/rotatable.js";
import { makeTransformable as j } from "./lib/actions/capabilities/transformable.js";
import { ricochet2DInBounds as F } from "./lib/actions/behaviors/ricochet/ricochet-2d-in-bounds.js";
import { ricochet2DCollision as J } from "./lib/actions/behaviors/ricochet/ricochet-2d-collision.js";
import { boundary2d as L } from "./lib/actions/behaviors/boundaries/boundary.js";
import { destroy as O } from "./lib/entities/destroy.js";
import { Howl as U } from "howler";
import * as o from "three";
import * as r from "@dimforge/rapier3d-compat";
import { globalChange as W, globalChanges as X, variableChange as Y, variableChanges as _ } from "./lib/actions/global-change.js";
export {
  U as Howl,
  c as Perspectives,
  r as RAPIER,
  o as THREE,
  h as ZylemBox,
  D as actor,
  L as boundary2d,
  v as box,
  i as camera,
  O as destroy,
  f as entitySpawner,
  m as game,
  W as globalChange,
  X as globalChanges,
  A as makeMoveable,
  S as makeRotatable,
  j as makeTransformable,
  E as plane,
  T as rect,
  J as ricochet2DCollision,
  F as ricochet2DInBounds,
  d as sphere,
  R as sprite,
  a as stage,
  I as text,
  Y as variableChange,
  _ as variableChanges,
  s as vessel,
  w as zone
};
