<script lang="ts">
    import { Map } from 'ol';
    import Control from 'ol/control/Control';
    import type { Coordinate } from 'ol/coordinate';
    import { toRadians } from 'ol/math';
    import { onMount } from 'svelte';
    import { DistanceUnits, get_distance, get_heading } from './Ruler';
    import type Unit from './Entities/Unit';
    import { fromLonLat } from 'ol/proj';

    export let map: Map | null;

    /** @var coords: Coordinate */
    export let player: Unit;

    export let bullseye: Coordinate;

    let root: HTMLDivElement;
    let canvas: HTMLCanvasElement;

    onMount(() => {
        const ctx = canvas?.getContext('2d');
        if (ctx == null || ctx == undefined) {
            return;
        }

        // Text inside is range
        // Text below is heading 030

        ctx.strokeStyle = '#33f';
        ctx.lineWidth = 5;

        let offset = 67.5;
        let radius = 20;
        let pointer_length = 2;

        let last_heading = 0;

        const update = () => {
            let coords = player.position;
            let angle = get_heading(bullseye, coords);
            let display_angle = angle % 360;
            angle = angle - player.heading;

            // This shouldnt be here, but this is the only place with an update
            if (player.is_player && last_heading != player.heading) {
                map?.getView().setRotation(toRadians(-player.heading));
                last_heading = player.heading;
            }

            let distance = get_distance(bullseye, coords, DistanceUnits.NauticalMiles);

            ctx.clearRect(0, 0, 135, 135);
            let cos = Math.cos(toRadians(angle + 90));
            let sin = Math.sin(toRadians(angle + 90));

            let x1 = cos * radius;
            let y1 = sin * radius;

            let x2 = x1 * pointer_length;
            let y2 = y1 * pointer_length;

            ctx.beginPath();
            ctx.arc(offset, offset, radius, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.font = '600 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (distance <= 99) {
                ctx.fillText(distance.toFixed(0).toString(), offset, offset);
            }

            ctx.textBaseline = 'hanging';

            ctx.fillText(
                ('00' + display_angle.toFixed(0).toString()).slice(-3),
                offset,
                offset + radius * 2,
            );

            ctx.moveTo(offset + x1, offset + y1);
            ctx.lineTo(offset + x2, offset + y2);
            ctx.stroke();

            requestAnimationFrame(() => {
                update();
            });
        };

        update();

        map?.addControl(
            new Control({
                element: root,
            }),
        );
    });
</script>

<div bind:this={root} class="bullseye-pointer ol-unselectable ol-control">
    <canvas bind:this={canvas}></canvas>
</div>

<style>
    .bullseye-pointer {
        background-color: transparent;
        bottom: 5px;
        left: 5px;
        width: 270px; /* huh? */
        height: 135px;
    }

    .bullseye-pointer canvas {
        width: 100%;
        height: 100%;
    }
</style>
