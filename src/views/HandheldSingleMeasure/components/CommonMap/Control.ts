/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-12 10:48:28
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-13 17:26:51
 * @FilePath: \zxi-surface\src\views\HandheldSingleMeasure\components\CommonMap\Control.ts
 * @Description:
 */
import {
  Map,
  GeoJSONSource,
  MapMouseEvent,
  IControl,
  ControlPosition,
} from "maplibre-gl";
import {
  getCoord,
  length,
  center,
  distance as Distance,
  bearing as Bearing,
  point,
  bearingToAzimuth,
  points,
} from "@turf/turf";
import maplibregl from "maplibre-gl";
import { useServerStore } from "@/store";
import { computed, onBeforeUnmount, watch } from "vue";
import stationSuccess from "images/stationSuccess.png";
import stationFail from "images/stationFail.png";
import { MarkerExtension } from "./MarkerExtension";

function copyValueFromObject(
  target: { [p: string]: any },
  source: { [p: string]: any }
) {
  for (const prop in source) {
    const value = source[prop];
    if (prop in target) {
      const type = Object.prototype.toString.call(value);
      if (type === "[object Object]") {
        const targetValue = target[prop];

        if (targetValue !== undefined) {
          copyValueFromObject(targetValue, value);
        } else {
          target[prop] = value;
        }
      } else {
        target[prop] = value;
      }
    }
  }
}
/**
 * @description: 图层顺序：LayerId_Labels、LayerId_Points、LayerId_Lines
 * @return {*}
 */
export class MeasureControl implements IControl {
  /**
   * @description: 线图层ID
   */
  static LayerId_Lines = "measure-lines";
  /**
   * @description: 连接点图层ID
   */
  static LayerId_Points = "measure-points";
  /**
   * @description: 标签图层ID
   */
  static LayerId_Labels = "measure-labels";

  map: Map | undefined;

  wrapper: HTMLDivElement | undefined;

  container: HTMLElement | undefined;

  activation = false;

  geojson: any = {
    type: "FeatureCollection",
    features: [],
  };

  labeljson: any = {
    type: "FeatureCollection",
    features: [],
  };

  linestring: any = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [],
    },
  };

  options = {
    circleColor: "white",
    circleRadius: 8,
    circleStrokeColor: "#008C00",
    lineColor: "#008C00",
    lineWidth: 2.5,
    labelSize: 20,
    labelColor: "#008C00",
  };

  constructor(
    options?: {
      circleColor?: string;
      circleRadius?: number;
      lineColor?: string;
      lineWidth?: number;
      labelSize?: number;
      labelColor?: string;
    },
    dom?: HTMLDivElement
  ) {
    if (options) {
      copyValueFromObject(this.options, options);
    }
    if (dom) {
      this.wrapper = document.createElement("div");
      this.wrapper.style.cssText = `
      position: absolute;
      top: 0px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      pointer-events: none;
      `;
      dom.appendChild(this.wrapper);
    }
  }
  onAdd(map: Map) {
    this.map = map;

    this.container = document.createElement("div");
    this.container.classList.add(
      ...["maplibregl-ctrl", "maplibregl-ctrl-group"]
    );

    const button = document.createElement("button");
    button.setAttribute("type", "button");
    
    button.title = "测量";

    const i = document.createElement("i");
    i.classList.add(...["iconfont", "icon-chizi"]);

    i.style.cssText = `
      font-weight: 700;
      color: #333333;
    `;

    button.appendChild(i);

    this.container.appendChild(button);

    this.container.addEventListener("click", this.active);

    this.map.on("load", () => {
      if (!this.map) return;

      this.map.addSource("MeasureControl", {
        type: "geojson",
        data: this.geojson,
      });

      this.map.addSource("labeljson", {
        type: "geojson",
        data: this.labeljson,
      });

      this.map.addLayer({
        id: MeasureControl.LayerId_Lines,
        type: "line",
        source: "MeasureControl",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": this.options.lineColor,
          "line-width": this.options.lineWidth,
        },
        filter: ["in", "$type", "LineString"],
      });

      this.map.addLayer({
        id: MeasureControl.LayerId_Points,
        type: "circle",
        source: "MeasureControl",
        paint: {
          "circle-radius": this.options.circleRadius,
          "circle-color": this.options.circleColor,
          "circle-stroke-color": this.options.circleStrokeColor,
          "circle-stroke-width": 2,
          "circle-pitch-alignment": "map",
        },
        filter: ["in", "$type", "Point"],
      });

      this.map.addLayer({
        id: MeasureControl.LayerId_Labels,
        type: "symbol",
        source: "labeljson",
        layout: {
          "text-size": this.options.labelSize,
          "text-field": ["get", "label"],
          "text-font": ["Roboto Medium"],
          "text-offset": [0, -2],
        },
        paint: {
          "text-color": this.options.labelColor,
          "text-halo-color": "white",
          "text-halo-width": 1,
        },
      });

      this.map.on("click", this.click);

      this.map.on("mousemove", this.mousemove);
    });

    return this.container;
  }

  onRemove() {
    if (this.container) {
      this.container.removeEventListener("click", this.active);
      if (this.container.parentNode)
        this.container.parentNode.removeChild(this.container);
    }

    this.map = undefined;
  }

  private mousemove = (e: MapMouseEvent) => {
    if (!this.activation || !this.map) return;

    const features = this.map.queryRenderedFeatures(e.point, {
      layers: [MeasureControl.LayerId_Points],
    });

    this.map.getCanvas().style.cursor = features.length
      ? "pointer"
      : "crosshair";
  };

  private click = (e: MapMouseEvent) => {
    if (!this.activation || !this.map) return;

    const features = this.map.queryRenderedFeatures(e.point, {
      layers: [MeasureControl.LayerId_Points],
    });

    // 先移除线，后面再放进来，确保线在数组末尾
    if (this.geojson.features.length > 1) this.geojson.features.pop();

    if (features.length) {
      // 如果选中折点，删除
      const selectId = features[0].properties.id;

      this.geojson.features = this.geojson.features.filter((point: any) => {
        return point.properties.id !== selectId;
      });
    } else {
      // 增加一个测量点
      const point = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [e.lngLat.lng, e.lngLat.lat],
        },
        properties: {
          id: new Date().getTime().toString(),
        },
      };

      this.geojson.features.push(point);
    }

    // 文本标签
    this.labeljson.features = [];
    if (this.geojson.features.length > 1) {
      let firstFeature,
        secondFeature,
        firsPosition,
        secondPosition,
        distance,
        bearing,
        point1,
        point2;
      for (let i = 0, len = this.geojson.features.length; i < len - 1; i++) {
        firstFeature = this.geojson.features[i];
        secondFeature = this.geojson.features[i + 1];

        firsPosition = getCoord(firstFeature);
        secondPosition = getCoord(secondFeature);

        point1 = point(firsPosition);
        point2 = point(secondPosition);

        // 方位角
        bearing = bearingToAzimuth(Bearing(point1, point2));
        // 距离（公里）
        distance = Distance(point1, point2);
        // 计算中间位置经纬度坐标
        const midleFeature = center(points([firsPosition, secondPosition]));
        midleFeature.properties!.label = `方位角:${parseFloat(
          bearing.toFixed(1)
        )}°\n\r距离:${parseFloat(distance.toFixed(3))}公里`;
        this.labeljson.features.push(midleFeature);
      }
    }

    const sourceLabel = this.map.getSource("labeljson") as GeoJSONSource;

    sourceLabel.setData(this.labeljson);

    if (this.geojson.features.length > 1) {
      // 折线
      this.linestring.geometry.coordinates = this.geojson.features.map(
        (point) => {
          return point.geometry.coordinates;
        }
      );

      this.geojson.features.push(this.linestring);
      // 创建元素
      const value = document.createElement("pre");
      value.style.cssText = `
            background-color: rgba(0, 0, 0, 0.5);
            color: #fff;
            font-size: 2rem;
            line-height: 18px;
            display: block;
            margin: 0;
            padding: 10px 20px;
            border-radius: 0px;
        `;
      value.textContent =
        "总距离: " + length(this.linestring).toLocaleString() + "km";
      if (this.wrapper) {
        this.wrapper.innerHTML = "";
        this.wrapper.appendChild(value);
      }
    }

    const source = this.map.getSource("MeasureControl") as GeoJSONSource;

    source.setData(this.geojson);
  };

  private active = () => {
    if (!this.map) return;
    if (this.wrapper) this.wrapper.innerHTML = "";
    this.activation = !this.activation;

    if (this.container) {
      this.container.style.backgroundColor = this.activation
        ? "#a0cfff"
        : "#fff";
    }

    this.map.getCanvas().style.cursor = this.activation
      ? "crosshair"
      : "grabbing";

    if (!this.activation) {
      this.geojson.features = [];
      const source0 = this.map.getSource("MeasureControl") as GeoJSONSource;

      source0.setData(this.geojson);

      this.labeljson.features = [];
      const source1 = this.map.getSource("labeljson") as GeoJSONSource;

      source1.setData(this.labeljson);
    }
  };
}

export class LocationControl implements IControl {
  map: Map | undefined;

  container: HTMLElement | undefined;
  /**
   * @description: 点击按钮后的回掉函数集
   */
  afterClick = new Set<(map: Map) => void>();

  options = {
    title: "定位设备位置",
  };

  constructor(options?: { title?: string }) {
    if (options) {
      copyValueFromObject(this.options, options);
    }
  }

  onAdd(map: Map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.classList.add(
      ...["maplibregl-ctrl", "maplibregl-ctrl-group"]
    );

    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.title = this.options.title;

    const i = document.createElement("i");
    i.classList.add(...["iconfont", "icon-dingwei"]);

    i.style.cssText = `
       font-weight: 700;
       color: rgb(24,145,255);
       font-size: 20px;
     `;

    button.appendChild(i);

    this.container.appendChild(button);

    this.container.addEventListener("click", this.click);

    return this.container;
  }

  onRemove(map: Map): void {
    if (this.container) {
      this.container.removeEventListener("click", this.click);

      if (this.container.parentNode)
        this.container.parentNode.removeChild(this.container);
    }

    this.map = undefined;
  }

  private click = () => {
    for (const fun of this.afterClick) {
      if (this.map) fun(this.map);
    }
  };

  readonly getDefaultPosition: (() => ControlPosition) | undefined = () => {
    return "top-right";
  };
}

/**
 * @description: 设置设备marker
 */
export function setDeviceMarker(map: maplibregl.Map) {
  const serverStore = useServerStore();

  let deviceMarker: MarkerExtension | undefined;

  const devicePosition = computed(
    () => serverStore.s_serverStateInfo.gpsLocation
  );

  const isLocated = computed(() => devicePosition.value.isLocated);

  let mapLoad = false;

  map.on("load", () => {
    mapLoad = true;
    setMarker();
  });

  const locationControl = new LocationControl();
  locationControl.afterClick.add((map) => {
    map.flyTo({
      center: [devicePosition.value.longitude, devicePosition.value.latitude],
      zoom: 14,
      curve: 1.1,
      speed: 2.5,
    });
  });

  function setMarker() {
    const v = devicePosition.value;
    const position = new maplibregl.LngLat(v.longitude, v.latitude);

    if (v.latitude !== 0 && v.longitude !== 0) {
      if (deviceMarker === undefined) {
        const v = devicePosition.value;
        const image = document.createElement("img");
        image.src = v.isLocated ? stationSuccess : stationFail;
        image.style.cursor = "pointer";
        console.log(image.src);

        deviceMarker = new MarkerExtension({
          element: image,
        })
          .setPosition(position)
          .addTo(map);

        deviceMarker.setLabel({
          content: "设备",
          offset: [0, -36],
        });
        map.panTo(position);
      } else {
        deviceMarker.setPosition([v.longitude, v.latitude]);
      }
    }
  }

  const watch1 = watch(devicePosition, () => {
    if (mapLoad) setMarker();
  });

  const watch2 = watch(isLocated, (v) => {
    if (deviceMarker) {
      const image = deviceMarker.getElement() as HTMLImageElement;
      image.src = v ? stationSuccess : stationFail;
    }
  });

  onBeforeUnmount(() => {
    watch1();
    watch2();
  });

  return {
    deviceMarker,
    devicePosition,
    isLocated,
    locationControl,
  };
}
