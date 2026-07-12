import {
	CatmullRomCurve3,
	Color,
	type Camera,
	Raycaster,
	SRGBColorSpace,
	Vector2,
	Vector3,
} from 'three';
import {
	createCamera,
	createGame,
	createStage,
	Perspectives,
} from '@zylem/game-lib/core';
import { createLine, createSphere } from '@zylem/game-lib/entity';

export default function createDemo() {
	const controlPoints: Vector3[] = [];
	for (let i = -25; i < 25; i++) {
		const t = i / 5;
		controlPoints.push(
			new Vector3(t * Math.sin(2 * t), t, t * Math.cos(2 * t)),
		);
	}

	const spline = new CatmullRomCurve3(controlPoints);
	const positions: Array<{ x: number; y: number; z: number }> = [];
	const colors: string[] = [];
	const divisions = controlPoints.length * 3;

	for (let i = 0; i <= divisions; i++) {
		const t = i / divisions;
		const point = spline.getPoint(t);
		positions.push({ x: point.x, y: point.y, z: point.z });
		const color = new Color().setHSL(t, 1, 0.5, SRGBColorSpace);
		colors.push(`#${color.getHexString()}`);
	}

	const path = createLine({
		points: positions,
		colors,
		linewidth: 0.08,
		worldUnits: true,
		pickThreshold: 0.05,
	});

	const hoverMarker = createSphere({
		color: new Color('#ffffff'),
		size: { x: 0.14, y: 0.14, z: 0.14 },
	});

	const pointerNdc = new Vector2();
	const raycaster = new Raycaster();
	let threeCamera: Camera | null = null;
	let pointerActive = false;
	let disposePointerListeners: (() => void) | null = null;

	const camera = createCamera({
		position: { x: 0, y: 8, z: 18 },
		target: { x: 0, y: 0, z: 0 },
		perspective: Perspectives.ThirdPerson,
	});

	const stage = createStage(
		{
			backgroundColor: new Color('#0b1020'),
		},
		camera,
	);

	stage.add(path, hoverMarker);

	const setHoverVisible = (visible: boolean) => {
		if (hoverMarker.mesh) hoverMarker.mesh.visible = visible;
	};

	stage.onSetup(({ me }) => {
		setHoverVisible(false);
		threeCamera = me.cameraRef?.camera ?? null;

		const canvas =
			me.cameraRef?.renderer.domElement ??
			me.scene?.zylemCamera.renderer.domElement ??
			null;
		if (!canvas) return;

		const updatePointerNdc = (clientX: number, clientY: number) => {
			const rect = canvas.getBoundingClientRect();
			pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
			pointerNdc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
		};

		const onPointerMove = (event: PointerEvent) => {
			updatePointerNdc(event.clientX, event.clientY);
			pointerActive = true;
		};

		const onPointerLeave = () => {
			pointerActive = false;
		};

		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerleave', onPointerLeave);

		disposePointerListeners = () => {
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerleave', onPointerLeave);
		};
	});

	stage.onUpdate(() => {
		if (!pointerActive || !threeCamera) {
			setHoverVisible(false);
			return;
		}

		raycaster.setFromCamera(pointerNdc, threeCamera);
		const hit = path.pickFromRaycaster(raycaster);

		if (hit) {
			hoverMarker.setPosition(
				hit.pointOnLine.x,
				hit.pointOnLine.y,
				hit.pointOnLine.z,
			);
			setHoverVisible(true);
		} else {
			setHoverVisible(false);
		}
	});

	const game = createGame(
		{
			id: 'line-demo',
			debug: true,
		},
		stage,
	);

	game.onDestroy(() => {
		disposePointerListeners?.();
	});

	return game;
}
