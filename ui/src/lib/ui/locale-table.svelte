<script lang="ts">
    import * as Table from "$lib/components/ui/table/index.js"
    import {I18N} from "$lib/core/i18n.js";
    import {BanIcon} from "@lucide/svelte"

    interface Props {
        data: Record<string, I18N>;
        mode?: "basic" | "extended";
    }

    let {data, mode}: Props = $props();
    let numOfRows = $derived(Object.values(data).reduce((acc, val) => {
        acc += val.locales.length
        return acc
    }, 0))
</script>

<Table.Root>
    <Table.Header>
        <Table.Row>
            <Table.Head>Field</Table.Head>
            <Table.Head>Language</Table.Head>
            <Table.Head>Value</Table.Head>
        </Table.Row>
    </Table.Header>
    <Table.Body>
        {#if numOfRows}
            {#each Object.keys(data) as field(field)}
                {@const i18n = data[field]}

                {#if mode === "extended"}

                    {#each i18n.locales as lang,index(lang)}
                        <Table.Row>
                            {#if !index}
                                <Table.Cell class="capitalize" rowspan={i18n.locales.length}>{field}</Table.Cell>
                            {/if}
                            <Table.Cell>{i18n.getTagName(lang)}</Table.Cell>
                            <Table.Cell {lang}>{i18n.query(lang)}</Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    {#if i18n.locales.length}
                        <Table.Row>
                            <Table.Cell class="capitalize">{field}</Table.Cell>
                            <Table.Cell>{i18n.getTagName(i18n.value!.tag)}</Table.Cell>
                            <Table.Cell>{i18n.value!.value}</Table.Cell>
                        </Table.Row>
                    {/if}
                {/if}
            {/each}
        {:else}
            <Table.Row>
                <Table.Cell class="items-center gap-2 flex-row" colspan={3}>
                    <BanIcon/>
                    No Data Found
                </Table.Cell>
            </Table.Row>
        {/if}

    </Table.Body>
</Table.Root>