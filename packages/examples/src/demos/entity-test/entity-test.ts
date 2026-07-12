import { createGame, createStage, createCamera } from '@zylem/game-lib/core';
import { createBox, createPlane, createSphere, createSprite, createZone, createCone, createPyramid, createCylinder, createPill, createLine, createText, create, boxMesh, boxCollision, sphereMesh, sphereCollision } from '@zylem/game-lib/entity';
import {
	bricks,
	camouflage,
	marble,
	planet,
	polkaDots,
	processedWood,
	rust,
	satin,
	type ZylemTSLShader,
} from '@zylem/shaders';
import { Color, QuadraticBezierCurve3, SRGBColorSpace, Vector3 } from 'three';
import { playgroundActor } from '../../utils';

import { demoAsset } from '../../assets/manifest';

const rainManPath = demoAsset('general/rain-man.png');

const grassPath = demoAsset('general/texture-grass.jpg');
const woodPath = demoAsset('general/texture-wood-box.jpg');

type Point3 = { x: number; y: number; z: number };

function textureShader(colorNode: ZylemTSLShader['colorNode']): ZylemTSLShader {
	return { colorNode };
}

function sampleQuadratic(
	start: Point3,
	control: Point3,
	end: Point3,
	divisions: number,
	skipFirst = false,
): Point3[] {
	const curve = new QuadraticBezierCurve3(
		new Vector3(start.x, start.y, start.z),
		new Vector3(control.x, control.y, control.z),
		new Vector3(end.x, end.y, end.z),
	);
	const points: Point3[] = [];
	const startIndex = skipFirst ? 1 : 0;
	for (let i = startIndex; i <= divisions; i++) {
		const point = curve.getPoint(i / divisions);
		points.push({ x: point.x, y: point.y, z: point.z });
	}
	return points;
}

function buildCurvedZyPoints(z: number): Point3[] {
	const segments = [
		// Z — curved top bar, diagonal, bottom bar
		sampleQuadratic(
			{ x: -31.4, y: 13.4, z },
			{ x: -30.1, y: 13.7, z },
			{ x: -28.8, y: 13.4, z },
			6,
		),
		sampleQuadratic(
			{ x: -28.8, y: 13.4, z },
			{ x: -31.8, y: 11.2, z },
			{ x: -31.4, y: 10.6, z },
			8,
			true,
		),
		sampleQuadratic(
			{ x: -31.4, y: 10.6, z },
			{ x: -30.1, y: 10.3, z },
			{ x: -28.8, y: 10.6, z },
			6,
			true,
		),
		// connector — swoop from Z into the y
		sampleQuadratic(
			{ x: -28.8, y: 10.6, z },
			{ x: -27.6, y: 12.0, z },
			{ x: -26.8, y: 12.2, z },
			6,
			true,
		),
		// y — curved arms and descender
		sampleQuadratic(
			{ x: -26.8, y: 12.2, z },
			{ x: -27.0, y: 11.4, z },
			{ x: -26.2, y: 11.0, z },
			6,
			true,
		),
		sampleQuadratic(
			{ x: -26.2, y: 11.0, z },
			{ x: -25.6, y: 12.0, z },
			{ x: -25.0, y: 12.4, z },
			6,
			true,
		),
		sampleQuadratic(
			{ x: -25.0, y: 12.4, z },
			{ x: -25.8, y: 11.5, z },
			{ x: -26.2, y: 11.0, z },
			5,
			true,
		),
		sampleQuadratic(
			{ x: -26.2, y: 11.0, z },
			{ x: -26.5, y: 10.0, z },
			{ x: -26.4, y: 9.0, z },
			6,
			true,
		),
	];

	return segments.flat();
}

function buildZyColors(pointCount: number): string[] {
	const colors: string[] = [];
	for (let i = 0; i < pointCount; i++) {
		const t = i / Math.max(1, pointCount - 1);
		const color = new Color().setHSL(0.02 + t * 0.58, 0.85, 0.48, SRGBColorSpace);
		colors.push(`#${color.getHexString()}`);
	}
	return colors;
}

export default function createDemo() {
	const showcaseShaders = {
		pyramid: textureShader(bricks({
			scale: 2.5,
			color: new Color('#c2410c'),
			background: new Color('#fbbf24'),
		})),
		cone: textureShader(marble({
			scale: 1.8,
			thinness: 0.35,
			color: new Color('#2563eb'),
			background: new Color('#e0f2fe'),
		})),
		cylinder: textureShader(rust({
			scale: 2.2,
			amount: 0.7,
			color: new Color('#9a3412'),
			background: new Color('#334155'),
		})),
		pill: textureShader(satin({
			scale: 2,
			color: new Color('#c026d3'),
			background: new Color('#312e81'),
		})),
		sphere: textureShader(planet({
			scale: 1.4,
			levelSea: 0.48,
			colorDeep: new Color('#082f49'),
			colorShallow: new Color('#0ea5e9'),
			colorBeach: new Color('#fde68a'),
			colorGrass: new Color('#65a30d'),
			colorForest: new Color('#14532d'),
			colorSnow: new Color('#f8fafc'),
		})),
		box: textureShader(processedWood({
			scale: 2.5,
			strength: 0.65,
			color: new Color('#92400e'),
			background: new Color('#f59e0b'),
		})),
		compound: textureShader(camouflage({
			scale: 2,
			colorA: new Color('#1f2937'),
			colorB: new Color('#365314'),
			colorC: new Color('#a16207'),
			colorD: new Color('#d6d3d1'),
		})),
		bumper: textureShader(polkaDots({
			count: 3,
			size: 0.55,
			color: new Color('#f8fafc'),
			background: new Color('#e11d48'),
		})),
	} satisfies Record<string, ZylemTSLShader>;

	const stage1 = createStage(
		{ gravity: new Vector3(0, -9.82, 0) },
		createCamera({
			position: { x: 0, y: 10, z: 40 },
			target: { x: 0, y: 0, z: 0 },
		}),
	);

	// ─── Ground ──────────────────────────────────────────────────────────

	const myPlane = createPlane({
		tile: { x: 200, y: 200 },
		position: { x: 0, y: 0, z: 0 },
		collision: { static: true },
		material: { path: grassPath, repeat: { x: 20, y: 20 } },
	});

	// ─── Pedestals ───────────────────────────────────────────────────────
	// Flat static display platforms under the dynamic showcase meshes.

	const pedestalSpots = [
		{ x: -18, z: -3 }, // pyramid
		{ x: -12, z: 5 }, // cone
		{ x: -6, z: -5 }, // cylinder
		{ x: -1, z: 3 }, // pill
		{ x: 4, z: -4 }, // sphere
		{ x: 9, z: 5 }, // box
		{ x: 15, z: -6 }, // compound
	];

	const pedestals = pedestalSpots.map((spot) =>
		createBox({
			size: { x: 4, y: 1, z: 4 },
			position: { x: spot.x, y: 0.5, z: spot.z },
			collision: { static: true },
			material: { path: woodPath, repeat: { x: 2, y: 2 } },
		}),
	);

	// ─── Complexity row (left → right, staggered front/back) ─────────────
	// line → sprite → pyramid → cone → cylinder → pill → sphere → box →
	// compound → zone → actor

	const zyZ = -9;

	const zyPoints = buildCurvedZyPoints(zyZ);

	// Black panel behind the logo so the colored line reads clearly.
	const zyBackdrop = createBox({
		size: { x: 7, y: 5, z: 0.15 },
		position: { x: -28.2, y: 11.2, z: zyZ - 0.08 },
		collision: { static: true },
		material: { color: new Color(0x000000) },
	});

	// Curved "Zy" logo: capital Z and lowercase y joined by a swooping connector.
	const myLine = createLine({
		points: zyPoints,
		colors: buildZyColors(zyPoints.length),
		linewidth: 0.06,
		worldUnits: true,
	});

	const entityGuide = createText({
		name: 'entity-guide',
		text: 'Line · Sprite · Pyramid · Cone · Cylinder · Pill · Sphere · Box · Compound · Zone · Actor',
		fontSize: 18,
		fontColor: '#e8eef5',
		backgroundColor: '#0b1020',
		padding: 10,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.06 },
	});

	const materialGuide = createText({
		name: 'material-guide',
		text: 'Bricks · Marble · Rust · Satin · Planet · Processed Wood · Camouflage + Polka Dots',
		fontSize: 14,
		fontColor: '#cbd5e1',
		backgroundColor: '#0b1020',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.11 },
	});

	const mySprite = createSprite({
		position: { x: -26, y: 5, z: 4 },
		size: [5, 5, 1],
		images: [{ name: 'rain-man', file: rainManPath }],
	});

	const myPyramid = createPyramid({
		radius: 2,
		height: 3,
		position: { x: -18, y: 6, z: -3 },
		collision: { static: false },
		material: { shader: showcaseShaders.pyramid },
	});

	const myCone = createCone({
		radius: 1.5,
		height: 3,
		position: { x: -12, y: 6, z: 5 },
		collision: { static: false },
		material: { shader: showcaseShaders.cone },
	});

	const myCylinder = createCylinder({
		radiusTop: 1,
		radiusBottom: 1,
		height: 3,
		position: { x: -6, y: 6, z: -5 },
		collision: { static: false },
		material: { shader: showcaseShaders.cylinder },
	});

	const myPill = createPill({
		radius: 0.75,
		length: 2,
		position: { x: -1, y: 6, z: 3 },
		collision: { static: false },
		material: { shader: showcaseShaders.pill },
	});

	const mySphere = createSphere({
		size: { x: 4, y: 4, z: 4 },
		position: { x: 4, y: 5, z: -4 },
		collision: { static: false },
		material: { shader: showcaseShaders.sphere },
	});

	const myBox = createBox({
		size: { x: 4, y: 2, z: 1 },
		position: { x: 9, y: 5, z: 5 },
		collision: { static: false },
		material: { shader: showcaseShaders.box },
	});

	// Box with two sphere bumpers sharing one rigid body.
	const compoundEntity = create({
		position: { x: 15, y: 6, z: -6 },
		collision: { static: false },
	})
		.add(boxMesh({
			size: { x: 2, y: 2, z: 2 },
			material: { shader: showcaseShaders.compound },
		}))
		.add(boxCollision({ size: { x: 2, y: 2, z: 2 } }))
		.add(sphereMesh({
			radius: 1,
			position: { x: 2, y: 0, z: 0 },
			material: { shader: showcaseShaders.bumper },
		}))
		.add(sphereCollision({ radius: 1, offset: { x: 2, y: 0, z: 0 } }))
		.add(sphereMesh({
			radius: 1,
			position: { x: -2, y: 0, z: 0 },
			material: { shader: showcaseShaders.bumper },
		}))
		.add(sphereCollision({ radius: 1, offset: { x: -2, y: 0, z: 0 } }));

	const zonePosition = { x: 21, y: 3, z: 4 };
	const zoneSize = { x: 5, y: 5, z: 5 };

	// Visual indicator for the invisible zone volume.
	const zoneIndicator = create({
		position: zonePosition,
	})
		.add(boxMesh({
			size: zoneSize,
			material: { color: new Color(0x2266ff), opacity: 0.35 },
		}));

	const myZone = createZone({
		position: zonePosition,
		size: zoneSize,
		onEnter: ({ self, visitor, globals }: any) => {
			console.log('entered', visitor, globals);
		},
		onExit: ({ self, visitor, globals }: any) => {
			console.log('exited', visitor, globals);
		},
	});

	const myActor = playgroundActor('mascot', undefined, { x: 0, y: 0, z: 14 });

	// ─── Game ────────────────────────────────────────────────────────────

	const testGame = createGame(
		{ id: 'zylem', debug: true },
		stage1,
		myPlane,
		...pedestals,
		zyBackdrop,
		myLine,
		mySprite,
		myPyramid,
		myCone,
		myCylinder,
		myPill,
		mySphere,
		myBox,
		compoundEntity,
		zoneIndicator,
		myZone,
		myActor,
		entityGuide,
		materialGuide,
	);

	return testGame;
}
