"use client";

import Map, { Layer, MapProps, Marker, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useState } from "react";
import { GeoJSONFeature, MapMouseEvent } from "mapbox-gl";
import { RemoteRunnable } from "langchain/runnables/remote";

export default function MyMap() {
  const lat = -22.227282718304494;
  const lon = -45.938001208679935;

  const [allData, setAllData] = useState(null);

  const [hoverInfo, setHoverInfo] = useState<null | {
    infos: {
      name: string | null;
      desc: string | null;
      layer: string | null;
      num: string | null;
    }[];
    x: number;
    y: number;
  }>(null);

  const [hoveredFeatureId, setHoverInfoFeatureId] = useState<
    string | number | null
  >(null);

  useEffect(() => {
    fetch("/pd-pa.geojson")
      .then((resp) => resp.json())
      .then((json) => {
        const geojson = {
          ...json,
          features: json.features.map(
            (feature: GeoJSONFeature, index: number) => {
              return {
                ...feature,
                id: index,
              };
            }
          ),
        };

        return setAllData(geojson);
      })
      .catch((err) => console.log(err));
  }, []);

  function onHover(e: MapMouseEvent) {
    if (e.features) {
      const infos = e.features.map((feature) => {
        const info = {
          name: feature.properties?.["name"] ?? null,
          desc: feature.properties?.["DESC"] ?? null,
          layer: feature.properties?.["Layer"] ?? null,
          num: feature.properties?.["NUM"] ?? null,
        };

        return info;
      });
      //console.log(e.features);
      setHoverInfo({ infos: infos, x: e.point.x, y: e.point.y });
      setHoverInfoFeatureId(e.features[0]?.id ?? null);
    } else {
      setHoverInfo(null);
      setHoverInfoFeatureId(0);
    }
  }

  //@ts-expect-error cant make the RemoteRunnable type to work
  const [runnable, setRunnable] = useState<RemoteRunnable | null>(null);

  useEffect(() => {
    const runnable = new RemoteRunnable({
      url: "http://my-tes-Publi-um6c1WNYr5QS-1742311813.sa-east-1.elb.amazonaws.com/pa-pd",
      //url: "http://127.0.0.1:8000/pa-pd",
    });
    setRunnable(runnable);
  }, []);

  const [markerPosition, setMarkerPosition] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const [infoBox, setInfoBox] = useState<string | null>(null);
  const [infoBoxStatus, setInfoBoxStatus] = useState<null | string>(null);

  // Handle click event to place a marker
  const handleMapClick: MapProps["onClick"] = useCallback(
    async (event: MapMouseEvent) => {
      if (infoBoxStatus !== "loading" && hoverInfo?.infos[0]?.desc) {
        const { lng, lat } = event.lngLat;
        setMarkerPosition({ longitude: lng, latitude: lat });
        setInfoBoxStatus("loading");
        try {
          const res = await runnable?.invoke(
            `O que é ${hoverInfo?.infos[0].desc} e quais são os artigos que falam sobre essa questão no plano diretor?`
          );
          setInfoBox(res);
          setInfoBoxStatus("loaded");
        } catch (error) {
          console.log(error);
          setInfoBox("Error loading, try again.");
          setInfoBoxStatus("loaded");
        }
      } else {
        console.log("LLm still loading");
      }
    },
    [runnable, hoverInfo, infoBoxStatus]
  );

  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_ACCESS_TOKEN}
      initialViewState={{ longitude: lon, latitude: lat, zoom: 14 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={"mapbox://styles/mapbox/standard"}
      interactiveLayerIds={["polygon-fill"]}
      onMouseMove={onHover}
      onMouseLeave={() => {
        setHoverInfo(null);
        setHoverInfoFeatureId(null);
      }}
      reuseMaps={true}
      onClick={handleMapClick}
      onLoad={() => setMapLoaded(true)}
    >
      {mapLoaded && (
        <Source type="geojson" data={allData}>
          <Layer
            id="polygon-fill"
            type="fill"
            paint={{
              "fill-color": "#888888", // Gray fill
              "fill-opacity": 0.05,
            }}
          />
          {/* Highlighted Polygon Layer */}
          <Layer
            id="highlight-fill"
            type="fill"
            filter={["==", "$id", hoveredFeatureId]} // Highlight only the hovered polygon
            paint={{
              "fill-color": "#FF0000", // Highlight color (e.g., red)
              "fill-opacity": 0.05,
            }}
          />
          <Layer
            id="polygon-outline"
            type="line"
            paint={{
              "line-color": "#000000", // Black outline
              "line-width": 2,
            }}
          />
        </Source>
      )}

      {hoverInfo && (
        <div
          className={"absolute text-xs bg-white text-black p-2 max-w-64"}
          style={{ left: hoverInfo.x, top: hoverInfo.y + 8 }}
        >
          {hoverInfo.infos.map((info, index) => (
            <div key={index}>
              <p>name: {info.name}</p>
              {info.desc && <p>desc: {info.desc}</p>}
              {info.layer && <p>layer: {info.layer}</p>}
              {info.num && <p>num: {info.num}</p>}
              <hr />
            </div>
          ))}
        </div>
      )}
      {/* Render the marker if a position is set */}
      {markerPosition && (
        <Marker
          longitude={markerPosition.longitude}
          latitude={markerPosition.latitude}
          anchor="bottom"
        ></Marker>
      )}
      {infoBoxStatus !== null && (
        <div
          className={"absolute text-lg bg-white text-black p-2 w-1/2 min-h-36"}
        >
          {infoBoxStatus === "loading"
            ? `Carregando informações do plano diretor sobre a Zona selecionada...`
            : infoBox}
        </div>
      )}
    </Map>
  );
}
