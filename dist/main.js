import { createGame as m } from "./lib/game/game.js";
import { gameConfig as a } from "./lib/game/game-config.js";
import { createStage as f } from "./lib/stage/stage.js";
import { entitySpawner as n } from "./lib/stage/entity-spawner.js";
import { vessel as i } from "./lib/core/vessel.js";
import { camera as b } from "./lib/camera/camera.js";
import { Perspectives as h } from "./lib/camera/perspective.js";
import { ZylemBox as v, box as d } from "./lib/entities/box.js";
import { sphere as R } from "./lib/entities/sphere.js";
import { sprite as E } from "./lib/entities/sprite.js";
import { plane as w } from "./lib/entities/plane.js";
import { zone as D } from "./lib/entities/zone.js";
import { actor as I } from "./lib/entities/actor.js";
import { text as S } from "./lib/entities/text.js";
import { rect as z } from "./lib/entities/rect.js";
import { makeMoveable as G } from "./lib/actions/capabilities/moveable.js";
import { makeRotatable as Z } from "./lib/actions/capabilities/rotatable.js";
import { makeTransformable as q } from "./lib/actions/capabilities/transformable.js";
import { ricochet2DInBounds as J } from "./lib/actions/behaviors/ricochet/ricochet-2d-in-bounds.js";
import { ricochet2DCollision as L } from "./lib/actions/behaviors/ricochet/ricochet-2d-collision.js";
import { boundary2d as O } from "./lib/actions/behaviors/boundaries/boundary.js";
import { destroy as U } from "./lib/entities/destroy.js";
import { Howl as W } from "howler";
import * as o from "three";
import * as r from "@dimforge/rapier3d-compat";
import { globalChange as Y, globalChanges as _, variableChange as $, variableChanges as oo } from "./lib/actions/global-change.js";
export {
  W as Howl,
  h as Perspectives,
  r as RAPIER,
  o as THREE,
  v as ZylemBox,
  I as actor,
  O as boundary2d,
  d as box,
  b as camera,
  m as createGame,
  f as createStage,
  U as destroy,
  n as entitySpawner,
  a as gameConfig,
  Y as globalChange,
  _ as globalChanges,
  G as makeMoveable,
  Z as makeRotatable,
  q as makeTransformable,
  w as plane,
  z as rect,
  L as ricochet2DCollision,
  J as ricochet2DInBounds,
  R as sphere,
  E as sprite,
  S as text,
  $ as variableChange,
  oo as variableChanges,
  i as vessel,
  D as zone
};
