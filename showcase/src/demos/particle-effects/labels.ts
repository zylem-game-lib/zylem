export const particleEffectsDemoLabels = {
	title: 'Semantic particle presets: twenty-four lower-config QUARKS examples.',
	status:
		'Base semantic variants plus magic overlays across fire, water, gas, and electricity.',
	stations: {
		fireSpark: {
			name: 'Fire / Spark',
			description: 'tiny, sudden, energetic, fleeting',
		},
		fireBlaze: {
			name: 'Fire / Blaze',
			description: 'sustained open burning with strong lift',
		},
		waterHolyMist: {
			name: 'Water / Holy Mist',
			description: 'diffuse moisture overlaid with light',
		},
		waterTorrent: {
			name: 'Water / Torrent',
			description: 'forceful dense flow under gravity',
		},
		gasVapor: {
			name: 'Gas / Vapor',
			description: 'thin buoyant release with soft drift',
		},
		gasCorruptedMiasma: {
			name: 'Gas / Corrupted Miasma',
			description: 'contaminating cloud with decaying intent',
		},
		electricArc: {
			name: 'Electric / Arc',
			description: 'directed snapping bridge of charge',
		},
		electricStorm: {
			name: 'Electric / Storm',
			description: 'restless volume of crackling discharge',
		},
		arcaneFlamelet: {
			name: 'Arcane Flamelet',
			description: 'geometric fire warped by arcane order',
		},
		natureEmber: {
			name: 'Nature Ember',
			description: 'warm residual cinders with healing lift',
		},
		voidVapor: {
			name: 'Void Vapor',
			description: 'seeking haze pulled toward the dark',
		},
		psychicPulse: {
			name: 'Psychic Pulse',
			description: 'rhythmic charge with sentient feel',
		},
		fireEmber: {
			name: 'Fire / Ember',
			description: 'lingering warm fragments with drift',
		},
		fireFlamelet: {
			name: 'Fire / Flamelet',
			description: 'small coherent tongue of flame',
		},
		fireSmolder: {
			name: 'Fire / Smolder',
			description: 'low-oxygen persistent smoky heat',
		},
		waterSpray: {
			name: 'Water / Spray',
			description: 'fine ejected droplets under pressure',
		},
		waterSplash: {
			name: 'Water / Splash',
			description: 'impact-driven burst of discrete beads',
		},
		waterDrizzle: {
			name: 'Water / Drizzle',
			description: 'soft continuous fall with light beads',
		},
		gasSmoke: {
			name: 'Gas / Smoke',
			description: 'opaque buoyant combustion residue',
		},
		gasHaze: {
			name: 'Gas / Haze',
			description: 'thin atmospheric contamination spread wide',
		},
		gasPlume: {
			name: 'Gas / Plume',
			description: 'columnar release with strong lift',
		},
		electricSpark: {
			name: 'Electric / Spark',
			description: 'tiny discontinuous discharge',
		},
		electricSurge: {
			name: 'Electric / Surge',
			description: 'charge-rich spike that floods the space',
		},
		electricPulse: {
			name: 'Electric / Pulse',
			description: 'rhythmic swelling packet of charge',
		},
	},
} as const;

export type ParticleEffectsDemoLabelKey =
	keyof typeof particleEffectsDemoLabels.stations;
