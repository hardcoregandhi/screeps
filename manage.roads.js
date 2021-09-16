global.runRoads = function () {
    // Auto roads
    for (var room in Game.rooms) {
        r = Game.rooms[room];
        // console.log(r.name)
        if (!myRooms.includes(r.name)) {
            continue;
        }
        if (!r.controller) {
            continue;
        }
        if (r.controller.my) {
            var sources = r.find(FIND_SOURCES);
            for (var s of sources) {
                // console.log(s)
                r.visual.circle(s.pos, { fill: "blue", radius: 0.55 });
                // Sources to controller
                for (var pathStep of s.pos.findPathTo(r.controller.pos, {
                    ignoreCreeps: true,
                    ignoreRoads: false,
                    swampCost: 1,
                    range: 16,
                })) {
                    r.visual.circle(pathStep, {
                        color: "red",
                        lineStyle: "dashed",
                    });
                    if (
                        /*new Room.Terrain(room.name).get(pathStep.x, pathStep.y) == TERRAIN_MASK_SWAMP &&*/
                        r.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0
                    ) {
                        r.visual.circle(pathStep, { color: "green", lineStyle: "dashed" });
                        // r.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                    }
                }

                // Sources to spawns
                spawn = Game.getObjectById(r.memory.mainSpawn.id);
                if (spawn != null) {
                    r.visual.circle(spawn.pos, {
                        fill: "blue",
                        radius: 0.55,
                    });
                    if (room_spawner.length) {
                        for (var pathStep2 of s.pos.findPathTo(spawn.pos, {
                            ignoreCreeps: true,
                            ignoreRoads: false,
                            swampCost: 20,
                        })) {
                            r.visual.circle(pathStep, { color: "red", lineStyle: "dashed" });
                            if (/*new Room.Terrain(r.name).get(pathStep2.x, pathStep2.y) == TERRAIN_MASK_SWAMP &&*/ r.lookForAt(LOOK_STRUCTURES, pathStep2.x, pathStep2.y).length == 0) {
                                r.visual.circle(pathStep2, {
                                    fill: "green",
                                    radius: 0.55,
                                });
                                // r.createConstructionSite(pathStep2.x, pathStep2.y, STRUCTURE_ROAD);
                            }
                        }
                    }
                }

                // Source surroundings
                for (var i = s.pos.x - 2; i <= s.pos.x + 2; i++) {
                    for (var j = s.pos.y - 2; j <= s.pos.y + 2; j++) {
                        var surr = new RoomPosition(i, j, r.name);
                        if (new Room.Terrain(r.name).get(surr.x, surr.y) == TERRAIN_MASK_SWAMP) {
                            r.visual.circle(surr, { fill: "green" });
                            // r.createConstructionSite(surr.x, surr.y, STRUCTURE_ROAD);
                        }
                    }
                }

                // Sources to towers
                room_towers = r.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_TOWER;
                    },
                });
                for (var t of room_towers) {
                    for (var pathStep of s.pos.findPathTo(t.pos, {
                        ignoreCreeps: true,
                        ignoreRoads: false,
                        swampCost: 0.1,
                    })) {
                        r.visual.circle(pathStep, {
                            fill: "red",
                            lineStyle: "dashed",
                        });
                        if (new Room.Terrain(r.name).get(pathStep.x, pathStep.y) != TERRAIN_MASK_SWAMP && r.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0) {
                            r.visual.circle(pathStep, {
                                color: "green",
                                lineStyle: "dashed",
                            });
                            // r.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                        }
                    }
                }
            }
        }
    }
};
