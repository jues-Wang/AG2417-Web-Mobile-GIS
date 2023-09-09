let map;

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    center: { lat: 59.330287, lng: 18.068278 },
    zoom: 12,
  });

  const KTHLibrarymarker = new google.maps.Marker({
    position: {lat: 59.34797912864201, lng: 18.07287220429032},
    map,
    title: "Click to zoom",
  });

  // map.addListener("click", (e) => {
  //   placeMarkerAndPanTo(e.latLng, map);
  // });

  // map.addListener("center_changed", () => {
  //   // 3 seconds after the center of the map has changed, pan back to the
  //   // marker.
  //   window.setTimeout(() => {
  //     map.panTo(marker.getPosition());
  //   }, 3000);
  // });

  marker.addListener("click", () => {
    map.setZoom(18);
    map.setCenter(marker.getPosition());
  });

  map.data.loadGeoJson('data.geojson');

  const initStyle = {
    strokeColor: "gray",
    strokeOpacity: "0.5",
  };
  map.data.setStyle(initStyle);

  map.data.addListener("mouseover", function (event) {
    map.data.setStyle({
      strokeColor: "blue",
      strokeOpacity: "1",
      strokeWeight: 3,
    });
  });

  //2.when the mouse leave the metro line, the line will become its original style
  map.data.addListener("mouseout", function (event) {
    map.data.setStyle(initStyle);
  });




  }

  function placeMarkerAndPanTo(latLng, map) {
    marker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: "Click to zoom",
    });
    map.panTo(latLng);
}



window.initMap = initMap;
initMap();