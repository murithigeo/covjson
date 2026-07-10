<script lang="ts">
    import type {ParameterGroup} from "coveragejson";
    import {ParameterGroup as ParameterGroupClass} from "$lib/core/parameters.js";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import {Button} from "$lib/components/ui/button/index.js";
    import {Checkbox} from "$lib/components/ui/checkbox/index.js";
    import {SvelteSet} from "svelte/reactivity";
    import {BanIcon} from "@lucide/svelte";
    import ObservedProperty from "./observed-property.svelte";

    interface Props {
        data: ParameterGroupClass | ParameterGroup;
        selected?: SvelteSet<string>;
    }

    let {
        data = $bindable(),
        selected = $bindable(),
    }: Props = $props();
    let pgroup = $derived(data instanceof ParameterGroupClass ? data : new ParameterGroupClass(data,));
    let checked = $derived(pgroup.members.every(member => selected?.has(member)));
    let indeterminate = $derived(!checked && pgroup.members.some(member => selected?.has(member)));

</script>

<!--Add import for modular ObservedProperty-->
<Card.Root class="max-w-md w-full">
    <Card.Header>
        <Card.Title>
            {pgroup.id || "No Id provided"}
        </Card.Title>
        <Card.Action>
            <Checkbox {checked} {indeterminate} onCheckedChange={(checked)=>{
                pgroup.members.forEach(member=>{
                    if(checked) selected?.add(member)
                else selected?.delete(member)})
            }} value={pgroup.id}/>
        </Card.Action>
    </Card.Header>
    <Card.Content class="flex flex-col gap-2 w-full items-center">
        {#if pgroup.observedProperty}
            <ObservedProperty data={pgroup.observedProperty}/>
        {:else }
            <span class="items-center gap-2 flex-row flex"
            >
                <BanIcon/> No Observed Property
            </span>
        {/if}
    </Card.Content>
    <Card.Footer class="flex flex-col gap-2 w-full items-center">
        <h4>Select Members individually</h4>
        <div class="flex-row flex items-center gap-2">
            {#each pgroup.members || [] as member(member)}
                <ButtonGroup.Root class="flex flex-row items-center gap-2 border">
                    <Button variant="ghost" class="uppercase" size="sm"
                            href={`#parameter-${member}`}>{member}</Button>
                    <Button variant="ghost" class="icon-sm">
                        <Checkbox onCheckedChange={(checked)=>{
                            if(checked) selected?.add(member)
                            else selected?.delete(member)
                        }} checked={selected?.has(member)}/>
                    </Button>
                </ButtonGroup.Root>
            {/each}
        </div>

    </Card.Footer>
</Card.Root>