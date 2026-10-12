<script lang="ts">
	import { Coverage } from '#lib/core/coverage.ts';
	import CoverageCpt from '#lib/ui/coverage/coverage-cpt.svelte';
	import gridtiled from '#lib/ui/json/data/grid-tiled.json' with { type: 'json' };
</script>

<CoverageCpt data={new Coverage(gridtiled)} />
