<script lang="ts">

    import type {ParameterGroup} from "coveragejson";
    import type {ParameterGroup as PGroupClass} from "$lib/core/parameters.js"
    import ParameterGroupComponent from "./parameter-group.svelte"
    import type {ClassValue} from "clsx";
    import {cn} from "$lib/utils.js";
    import type {SvelteSet} from "svelte/reactivity";

    interface Props {
        data: (ParameterGroup | PGroupClass)[];
        class?: ClassValue;
        selected?: SvelteSet<string>
    }

    let {data, class: className, selected=$bindable()}: Props = $props();
</script>

<div class={cn(["flex flex-row gap-2"],className)}>
    {#each data as group,index(index)}
        <ParameterGroupComponent data={group} bind:selected/>
    {/each}
</div>