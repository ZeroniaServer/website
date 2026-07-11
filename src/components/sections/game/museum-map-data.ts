// bbox = hover zone in native px, image = screenshot filename
export interface MapRoom {
  file: string;
  name: string;
  bbox: [x0: number, y0: number, x1: number, y1: number];
  image: string;
}

export interface MapFloor {
  file: string;
  label: string;
  rooms: MapRoom[];
}

// real content is just the top-left corner of the 128x128 png
export const MAP_NATIVE_WIDTH = 46;
export const MAP_NATIVE_HEIGHT = 72;

// Cycle order for the floor arrows.
export const MUSEUM_MAP_FLOORS: MapFloor[] = [
  {
    file: "museum_map_floor_1.png",
    label: "Floor 1",
    rooms: [
      { file: "1_foyer.png", name: "Foyer", bbox: [14, 45, 31, 67], image: "foyer.jpg" },
      { file: "2_giftshop.png", name: "Gift Shop", bbox: [31, 45, 41, 64], image: "gift_shop.jpg" },
      { file: "3_cafe.png", name: "Cafe", bbox: [4, 45, 14, 64], image: "cafe.jpg" },
      { file: "4_bathroom.png", name: "Bathroom", bbox: [4, 64, 13, 67], image: "bathroom_1.jpg" },
      { file: "5_skeletons.png", name: "Skeletons", bbox: [4, 31, 41, 45], image: "skeletons.jpg" },
      { file: "6_aquatic.png", name: "Aquatic", bbox: [9, 12, 41, 31], image: "aquatic.jpg" },
    ],
  },
  {
    file: "museum_map_floor_2.png",
    label: "Floor 2",
    rooms: [
      { file: "10_balcony.png", name: "Balcony", bbox: [10, 44, 35, 67], image: "balcony.jpg" },
      { file: "11_mezzanine.png", name: "Mezzanine", bbox: [13, 29, 32, 44], image: "mezzanine.jpg" },
      { file: "12_aviary.png", name: "Aviary", bbox: [11, 12, 33, 29], image: "aviary.jpg" },
      { file: "13_terrarium.png", name: "Terrarium", bbox: [4, 12, 11, 29], image: "terrarium.jpg" },
      { file: "14_obersavtory.png", name: "Observatory", bbox: [33, 12, 41, 29], image: "observatory.jpg" },
      { file: "15_left_hall.png", name: "Left Hall", bbox: [4, 29, 13, 58], image: "left_hall.jpg" },
      { file: "16_humans.png", name: "Humans", bbox: [4, 58, 10, 67], image: "humans.jpg" },
      { file: "17_eggshibit.png", name: "Eggshibit", bbox: [32, 29, 41, 58], image: "eggshibit.jpg" },
      { file: "18_bathroom.png", name: "Bathroom", bbox: [35, 58, 41, 67], image: "bathroom_2.jpg" },
    ],
  },
  {
    file: "museum_map_floor_3.png",
    label: "Floor 3",
    rooms: [
      { file: "19_precambrian.png", name: "Precambrian", bbox: [30, 47, 41, 67], image: "precambrian.jpg" },
      { file: "20_paleozoic.png", name: "Paleozoic", bbox: [16, 34, 41, 52], image: "paleozoic.jpg" },
      { file: "21_mesozoic.png", name: "Mesozoic", bbox: [4, 34, 23, 52], image: "mesozoic.jpg" },
      { file: "22_cenozoic.png", name: "Cenozoic", bbox: [4, 47, 16, 67], image: "cenozoic.jpg" },
    ],
  },
  {
    file: "museum_map_ruins.png",
    label: "Ruins",
    rooms: [
      { file: "8_ruins.png", name: "Ruins", bbox: [7, 16, 37, 56], image: "ruins.jpg" },
      { file: "9_deepdark.png", name: "Deep Dark", bbox: [17, 25, 25, 38], image: "deep_dark.jpg" },
    ],
  },
  {
    file: "museum_map_floor_0.png",
    label: "Floor 0",
    rooms: [
      { file: "23_basement.png", name: "Basement", bbox: [20, 34, 41, 63], image: "basement.jpg" },
      { file: "24_startroom.png", name: "Start Room", bbox: [7, 50, 20, 63], image: "start_room.jpg" },
      { file: "7_theatre.png", name: "Theatre", bbox: [4, 12, 23, 31], image: "theatre.jpg" },
    ],
  },
];

// Paths under assets/games/<slug>/, ready to hand to gameAsset().
export const ALL_MUSEUM_MAP_ASSETS: string[] = [
  ...MUSEUM_MAP_FLOORS.map((f) => `museum_map/${f.file}`),
  ...MUSEUM_MAP_FLOORS.flatMap((f) => f.rooms.map((r) => `museum_map/${r.file}`)),
  ...MUSEUM_MAP_FLOORS.flatMap((f) => f.rooms.map((r) => `images/${r.image}`)),
];
