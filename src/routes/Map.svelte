<script lang="ts">
    // OpenLayers
    import 'ol/ol.css';
    import Map from 'ol/Map';
    import TileLayer from 'ol/layer/Tile';
    import View from 'ol/View';
    import OSM from 'ol/source/OSM';
    import Feature from 'ol/Feature';
    import { Circle, LineString, Point } from 'ol/geom';
    import {
        Modify,
        MouseWheelZoom,
        PinchZoom,
        defaults as defaultInteractions,
    } from 'ol/interaction';
    import VectorSource from 'ol/source/Vector';
    import VectorLayer from 'ol/layer/Vector';
    import { transform, fromLonLat } from 'ol/proj';
    import { offset } from 'ol/sphere';
    import Polygon, { circular } from 'ol/geom/Polygon.js';
    import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
    import { toRadians } from 'ol/math';
    import type { Coordinate } from 'ol/coordinate';
    import { DistanceUnits, Ruler, get_distance } from './Ruler';
    import Compass from './Compass.svelte';
    import UnitRender from './Entities/UnitRender';
    import Unit from './Entities/Unit';
    import { onMount } from 'svelte';
    import { preload } from './icon';
    import { extend } from 'ol/array';
    import { doubleClick } from 'ol/events/condition';
    import MyPinchZoom from './MyPinchZoom';

    export let targets: Unit[] = [];

    let lon = 16.854444444444443;
    let lat = 45.4025654863123;

    let center = fromLonLat([lon, lat]);
    let bullseye = center;

    let random_lon = Math.random() * 4 - 2 + lon;
    let random_lat = Math.random() * 4 - 2 + lat;

    let playerpos = fromLonLat([random_lon, random_lat]);
    // let random_lat = lat - 1.2;
    // let random_lon = lon;

    let player = new Unit({
        Position: playerpos,
        Heading: 0,
        Name: 'F-16C_50',
        Flags: {
            Invisible: false,
        },
        CoalitionID: 2,
        is_player: false,
    });

    // Exports
    let mapId = 20;
    // Local state
    let map: Map | null = null;

    let units = new UnitRender();

    let node: HTMLDivElement;

    onMount(async () => {
        await preload();

        setupMap(node);
    });

    // functions
    const setupMap = (node: HTMLDivElement) => {
        // useGeographic();
        const osmLayer = new TileLayer({
            // http://b.basemaps.cartocdn.com/light_all/10/626/383.png
            // https://api.mapbox.com/v4/mapbox.mapbox-bathymetry-v2,mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2,mapbox.mapbox-models-v1/6/39/22.vector.pbf?sku=101GzTXgNFDpp&access_token=pk.eyJ1Ijoic3ZjLW9rdGEtbWFwYm94LXN0YWZmLWFjY2VzcyIsImEiOiJjbG5sMnExa3kxNTJtMmtsODJld24yNGJlIn0.RQ4CHchAYPJQZSiUJ0O3VQ
            source: new OSM(),
        });

        const nm_to_m = (m: number) => {
            return m * 1852.0;
        };

        let stroke = new Stroke({
            color: 'rgba(0,128,0,0.4)',
            width: 2,
        });
        let fill = new Fill({
            color: 'red',
        });

        let vectorLayer: VectorLayer<VectorSource<Feature>> = new VectorLayer({
            source: new VectorSource({
                features: [],
            }),
            style: new Style({
                stroke,
                image: new CircleStyle({
                    radius: 5,
                    fill: fill,
                    scale: 1,
                    stroke: stroke,
                    declutterMode: 'none',
                    displacement: [0, 0],
                    rotateWithView: true,
                    rotation: 0,
                }),
            }),
            zIndex: 1000,
            declutter: false,
        });

        const line = (center: Coordinate, length: number, angle: number) => {
            center = transform(center, 'EPSG:3857', 'EPSG:4326');

            // let start = offset(center, -(length / 2), toRadians(angle));
            let end = offset(center, length, toRadians(angle));

            let c = transform(center, 'EPSG:4326', 'EPSG:3857');
            let a = transform(end, 'EPSG:4326', 'EPSG:3857');

            return new LineString([c, a]);
        };

        const circle = (center: Coordinate, radius: number) => {
            center = transform(center, 'EPSG:3857', 'EPSG:4326');

            const n = 128;
            const flatCoordinates: number[] = [];
            for (let i = 0; i < n; ++i) {
                let c = offset(center, radius, (2 * Math.PI * i) / n);
                c = transform(c, 'EPSG:4326', 'EPSG:3857');
                extend(flatCoordinates, c);
            }

            flatCoordinates.push(flatCoordinates[0], flatCoordinates[1]);

            return new Polygon(flatCoordinates, 'XY', [flatCoordinates.length]);
        };

        vectorLayer.getSource()?.addFeatures([
            new Feature(new Point(bullseye)),
            new Feature(circle(bullseye, nm_to_m(30))),
            new Feature(circle(bullseye, nm_to_m(60))),
            new Feature(circle(bullseye, nm_to_m(90))),
            new Feature(circle(bullseye, nm_to_m(120))),
            new Feature(circle(bullseye, nm_to_m(150))),
            new Feature(circle(bullseye, nm_to_m(180))),
            //               center    length        angle
            new Feature(line(bullseye, nm_to_m(180), 0)),
            new Feature(line(bullseye, nm_to_m(180), 30 - 0.785)),
            new Feature(line(bullseye, nm_to_m(180), 60 - 1.34)),
            new Feature(line(bullseye, nm_to_m(180), 90 - 1.52)),
            new Feature(line(bullseye, nm_to_m(180), 120 - 1.295)),
            new Feature(line(bullseye, nm_to_m(180), 150 - 0.735)),
            new Feature(line(bullseye, nm_to_m(180), 180)),
            new Feature(line(bullseye, nm_to_m(180), 210 + 0.735)),
            new Feature(line(bullseye, nm_to_m(180), 240 + 1.295)),
            new Feature(line(bullseye, nm_to_m(180), 270 + 1.52)),
            new Feature(line(bullseye, nm_to_m(180), 300 + 1.34)),
            new Feature(line(bullseye, nm_to_m(180), 330 + 0.785)),
        ]);

        // vectorLayer.getSource()?.addFeature(new Feature(new LineString([bullseye, playerpos])));

        map = new Map({
            target: node.id,
            layers: [osmLayer, vectorLayer],
            view: new View({
                center: center,
                zoom: 8,
                // rotation: 0,
                // extent: [
                //     // [minx, miny, maxx, maxy
                //     lon - 2,
                //     lat - 2,
                //     lon + 2,
                //     lat + 2,
                // ],
            }),
            interactions: defaultInteractions({
                dragPan: false,
                shiftDragZoom: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                pinchZoom: false,
                doubleClickZoom: false,
                mouseWheelZoom: true,
                onFocusOnly: false,
            }).extend([
                new MouseWheelZoom({
                    useAnchor: false,
                }),
                new MyPinchZoom({
                    anchor: center,
                }),
            ]),
        });
        var extent = vectorLayer.getSource()?.getExtent();
        map.getView().fit(extent!, { size: map.getSize() });

        // map.on('moveend', (m) => {
        //     m.map.getView().setCenter(center);
        // });

        // map.getTargetElement().addEventListener('dblclick', (e) => {
        //     var coords = map!.getEventCoordinate(e);

        //     let closest = null;
        //     let distance = Number.MAX_SAFE_INTEGER;
        //     for (let target of targets) {
        //         let calculated = get_distance(coords, target.position, DistanceUnits.Meters);
        //         if (calculated < distance) {
        //             distance = calculated;
        //             closest = target;
        //         }
        //     }

        //     let distance_in_nm = distance / 1852;
        // });

        let ruler = new Ruler(bullseye);
        ruler.set_units(DistanceUnits.NauticalMiles);
        ruler.set_mouse_button(0);
        ruler.addTo(map);

        let player_ruler = new Ruler(player);
        player_ruler.set_mouse_button(0);
        player_ruler.set_units(DistanceUnits.NauticalMiles);
        player_ruler.addTo(map);
        player_ruler.set_color('#7fdfff');

        units.add(player);

        units.addTo(map);
        units.setZIndex(1000);

        return {
            destroy() {
                if (map) {
                    // as Map
                    map.setTarget(undefined);
                    map = null;
                }
            },
        };
    };
</script>

<div class="map-container">
    <div id={mapId.toString()} class="map" bind:this={node}></div>
    <Compass {map} {player} {bullseye} />
</div>

<style>
    .map,
    .map-container {
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>
