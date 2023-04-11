/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-11 13:56:48
 * @FilePath: \zxi-surface\src\helper\mapStyle.ts
 * @Description:
 */

import { useServerStore } from "@/store";
import { StyleSpecification, VectorSourceSpecification } from "maplibre-gl";
import { computed } from "vue";

function mapStyle(
  stlye: any,
  options?: {
    zoom?: number;
    center?: number[];
  }
) {
  const serverStore = useServerStore();
  const devicePosition = computed(
    () => serverStore.s_serverStateInfo.gpsLocation
  );

  const changeStyle = stlye as StyleSpecification;

  if (!changeStyle.sprite!.includes("http"))
    changeStyle.sprite! = location.origin + "/" + changeStyle.sprite!;

  const openmaptiles = changeStyle.sources
    .openmaptiles as VectorSourceSpecification;

  const mapConfig = {
    sourceUrl: "http://192.168.0.141:8086/data/v3.json",
    zoom: 9,
    center: [104.065, 30.657]
  };

  changeStyle.center = mapConfig.center;
  changeStyle.zoom = mapConfig.zoom;

  if (
    devicePosition.value.latitude !== 0 &&
    devicePosition.value.longitude !== 0
  ) {
    changeStyle.center = [
      devicePosition.value.longitude,
      devicePosition.value.latitude,
    ];
  }

  if (options) {
    if (options.zoom) changeStyle.zoom = options.zoom;
    if (options.center) changeStyle.center = options.center;
  }

  if (mapConfig.sourceUrl) {
    openmaptiles.url = mapConfig.sourceUrl;
  } else {
    openmaptiles.url = location.origin + "/api/Map/json";
  }

  return changeStyle;
}

export { mapStyle };
