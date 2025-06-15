
// [Perspectives.ThirdPerson](aspectRatio: number): Camera {
// 	console.warn('Third person camera not fully implemented');
// 	return new PerspectiveCamera(zModifier, aspectRatio, 0.1, 1000);
// }

// [Perspectives.Fixed2D](aspectRatio: number, position: Vector3): Camera {
// 	const frustumSize = position.z;
// 	const distance = position.distanceTo(new Vector3(0, 0, 0));
// 	// const orthographicCamera = new OrthographicCamera(
// 	// 	frustumSize * aspectRatio / -2,
// 	// 	frustumSize * aspectRatio / 2,
// 	// 	frustumSize / 2,
// 	// 	frustumSize / -2,
// 	// 	0.1,
// 	// 	1000 //distance * 2
// 	// );
// 	const orthographicCamera = new OrthographicCamera(
// 		10 * (-aspectRatio),
// 		10 * (aspectRatio),
// 		10,
// 		-10,
// 		0,
// 		2000
// 	);

// 	orthographicCamera.position.copy(position);
// 	return orthographicCamera;
// }

// [Perspectives.FirstPerson](): Camera {
// 	console.warn('First person camera not fully implemented');
// 	return new PerspectiveCamera(45, 1, 0.1, 1000);;
// }

// [Perspectives.Flat2D](aspectRatio: number, position: Vector3): Camera {
// 	console.warn('Flat2D camera not fully implemented');
// 	return this[Perspectives.Fixed2D](aspectRatio, position);
// }

// [Perspectives.Isometric](aspectRatio: number, position: Vector3): Camera {
// 	console.warn('Isometric camera not fully implemented');
// 	const frustumSize = 20;
// 	const isometricCamera = new OrthographicCamera(
// 		frustumSize * aspectRatio / -2,
// 		frustumSize * aspectRatio / 2,
// 		frustumSize / 2,
// 		frustumSize / -2,
// 		0.1,
// 		position.z * 2
// 	);
// 	isometricCamera.position.copy(position);
// 	isometricCamera.lookAt(new Vector3(0, 0, 0));

// 	isometricCamera.rotation.set(
// 		Math.atan(-1 / Math.sqrt(2)),
// 		0,
// 		0,
// 		'YXZ'
// 	);
// 	return isometricCamera;
// }
