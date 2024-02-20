<script>
    import Map from './Map.svelte';
</script>

<svelte:head>
    <title>Home</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="app">
    <Map />
    <!-- <div class="header">Hello Header</div>
    <div class="container">
        <div class="map">
            <Map />
        </div>
        <div class="drawer">Hello Drawer</div>
    </div> -->
</div>

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
        width: 80%;
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
</style>
