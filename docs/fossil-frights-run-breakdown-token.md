# Fossil Frights run-breakdown token (v1)

Run breakdowns are URL-safe token generated from unmodified speedrun solo runs appended to `https://zeronia.org/ff/run=`.

## Grammar

```text
1U<username>_<event>_<event>..._R<result><day>.<ticks>
```

- `D<day>.<ticks>`: day complete
- `T<task-id>.<ticks>`: task complete
- `H<hazard-id><state>.<ticks>`: hazard on(1)/off(0)
- `C<use-id>.<ticks>`: coin use.
- `R<result><day>.<ticks>`: defeat (F), leave (L), or victory (V)

## Hazard IDs

| ID | Hazard |
|---:|---|
| 1 | Lights |
| 2 | Lava |
| 3 | Floods |
| 4 | Security |
| 5 | Curse |

## DinoCoin use IDs

| ID | Use |
|---:|---|
| 01 | Well |
| 02 | Sculkadillo crane |
| 03 | Sarcophagus |
| 04 | Crab |
| 11 | Veloci-Tea |
| 12 | Pteranadon Twist |
| 13 | Raptor Rush |
| 14 | Bubbly Bat |
| 15 | Chorus Cola |
| 16 | Fossil Fizz |

## Task IDs

| ID | Task |
|---:|---|
| 01 | `bathroom_leak` |
| 02 | `check_ankylo` |
| 03 | `check_security` |
| 04 | `climb_the_tower` |
| 05 | `count_shells` |
| 06 | `count_toes` |
| 07 | `dig_sand` |
| 08 | `dive_into_well` |
| 09 | `fire_pottery` |
| 10 | `fix_cracked_egg` |
| 11 | `fix_mars` |
| 12 | `lock_register` |
| 13 | `make_some_noise` |
| 14 | `polish_bell` |
| 15 | `reset_fountain` |
| 16 | `reset_salt_level` |
| 17 | `static_buildup` |
| 18 | `swat_flies` |
| 19 | `sweep_popcorn` |
| 20 | `tnt_test` |
| 21 | `toilet_clog` |
| 22 | `visit_archean` |
| 23 | `visit_jurassic` |
| 24 | `visit_neogene` |
| 25 | `visit_silurian` |
| 26 | `water_temp` |
| 27 | `ancient_portal` |
| 28 | `bring_brush` |
| 29 | `brush_delivery` |
| 30 | `chlorinify` |
| 31 | `coffee_top_up` |
| 32 | `cool_it` |
| 33 | `credit_reel` |
| 34 | `feed_parrot` |
| 35 | `feed_the_fish` |
| 36 | `feed_the_plants` |
| 37 | `fix_sculker` |
| 38 | `heat_it_up` |
| 39 | `nautilus_guard` |
| 40 | `picnic_with_trike` |
| 41 | `popcorn_buckets` |
| 42 | `refill_coffee` |
| 43 | `refill_ice` |
| 44 | `replenish_soap` |
| 45 | `restock_plushies` |
| 46 | `revitalize_coral` |
| 47 | `shark_bait` |
| 48 | `smelly_toilet` |
| 49 | `sponge_up_spill` |
| 50 | `wash_muddy_sherd` |
| 51 | `water_crops` |
| 52 | `a_c_reset` |
| 53 | `basketball_dance` |
| 54 | `defrost_freezer` |
| 55 | `evolution` |
| 56 | `feed_the_bats` |
| 57 | `fertilize_plant` |
| 58 | `glowberry_trees` |
| 59 | `holy_grail` |
| 60 | `hoveraptor` |
| 61 | `pig_wrangler` |
| 62 | `return_the_key` |
| 63 | `skincare_routine` |
| 64 | `star_gazing` |
| 65 | `the_lost_code` |
| 66 | `final_task` |
