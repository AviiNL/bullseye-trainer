<script lang="ts">
    import { fromLonLat } from 'ol/proj';
    import Unit from './Entities/Unit';
    import Map from './Map.svelte';
    import { SvelteToast, toast } from '@zerodevx/svelte-toast';
    import { DistanceUnits, get_distance, get_heading } from './Ruler';

    let targets: Unit[] = [];

    // if (document) {
    //     document.addEventListener('contextmenu', (event) => event.preventDefault());
    // }
    const request_awacs_call = () => {
        const lon = 16.854444444444443;
        const lat = 45.4025654863123;

        let random_lon = Math.random() * 4 - 2 + lon;
        let random_lat = Math.random() * 4 - 2 + lat;

        let bullseye = fromLonLat([lon, lat]);
        let pos = fromLonLat([random_lon, random_lat]);

        targets.push(
            new Unit({
                Position: pos,
                Heading: 0,
                Name: 'F-16C_50',
                Flags: {
                    Invisible: false,
                },
                CoalitionID: 1,
                is_player: false,
            }),
        );

        let heading = get_heading(bullseye, pos);
        let distance = get_distance(bullseye, pos, DistanceUnits.NauticalMiles);

        toast.push(
            `Falcon 1, Enemy,<br/><strong>Bullseye ${heading.toFixed(0)}° / ${distance.toFixed(0)}NM. 20,000</strong><br/>Track EAST`,
            {
                duration: 10000,
                dismissable: false,
            },
        );
    };
</script>

<svelte:head>
    <title>Home</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="app">
    <!-- <div class="header">
        <button on:click={() => request_awacs_call()}>SHOW TOAST</button>
    </div> -->
    <div class="container">
        <div class="map">
            <Map {targets} />
        </div>
    </div>
</div>

<SvelteToast options={{ reversed: true, intro: { y: 192 } }} />

<style>
    .app {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .header {
        background-color: white; /* TODO: variables */
        padding: 12px 0;
        box-shadow: -15px 15px 15px 0px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    }
    .container {
        display: flex;
        height: 100%;
    }
    .map {
        width: 100%;
    }
    .drawer {
        background-color: white; /* TODO: variables */
        width: 20%;
        min-width: 250px;
        padding: 25px;
        /* border-left: 2px solid #333; */
        box-shadow: -15px 15px 15px 0px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    }

    :root {
        --toastContainerTop: 8rem;
        --toastContainerRight: auto;
        --toastContainerBottom: auto;
        --toastContainerLeft: calc(50vw - 8rem);
    }
</style>
