global.runBaseBuilder = function () {
    for (var roomName of myRooms[Game.shard.name]) {
        try {
            r = Game.rooms[roomName];
            if (r == undefined) {
                log.error("runBaseBuilder: Couldn't retrieve room to upgrade it");
                continue;
            }
            if (r.controller.level == 1) continue;

            if (Memory.rooms[roomName].mainSpawn == undefined) return;

            var currentRoomBuildingLevel = Memory.rooms[roomName].currentRoomBuildingLevel;
            if (Memory.rooms[roomName].building[r.controller.level].isComplete == true) continue;

            var currentStage = Memory.rooms[roomName].building[currentRoomBuildingLevel].currentStage;
            stageComplete = true;

            baseCenter = Memory.rooms[roomName].mainSpawn.pos;

            if (baseData[currentRoomBuildingLevel] == undefined || baseData[currentRoomBuildingLevel].stages == undefined) continue;

            for (var s in baseData[currentRoomBuildingLevel].stages[currentStage]) {
                // console.log(s)
                // console.log(currentStage)
                baseData[currentRoomBuildingLevel].stages[currentStage].forEach((subStageBuildingTypeSet) => {
                    // console.log(subStageBuildingTypeSet)
                    for (var offsetPos of subStageBuildingTypeSet.pos) {
                        var realX = baseCenter.x + offsetPos.x;
                        var realY = baseCenter.y + offsetPos.y;
                        if (realX <=1 || realY <=1 || 
                            realX >=48 || realY >=48) {
                                continue
                            }
                        // console.log(`realX ${realX} realY ${realY}`)
                        r.visual.circle(realX, realY, { color: "green", lineStyle: "dashed" });
                        const look = new RoomPosition(realX, realY, roomName).lookFor(LOOK_STRUCTURES);
                        if (look.length) {
                            if (look[0].structureType == STRUCTURE_ROAD && look[0].structureType != subStageBuildingTypeSet.buildingType) {
                                look[0].destroy();
                                look.pop();
                            }
                            if (look[0].structureType == subStageBuildingTypeSet.buildingType) {
                                continue;
                            }
                        }
                        const isWall = new Room.Terrain(roomName).get(realX, realY) == TERRAIN_MASK_WALL;
                        if (!isWall && !look.length) {
                            var ret = r.createConstructionSite(realX, realY, subStageBuildingTypeSet.buildingType);
                            // console.log(ret)
                            if (ret == ERR_RCL_NOT_ENOUGH) {
                                // console.log("ERR_RCL_NOT_ENOUGH");
                            } else if (ret == ERR_INVALID_TARGET || ret == ERR_INVALID_ARGS) {
                                continue;
                            } else {
                                // console.log(`stageComplete = ${stageComplete}`)
                                stageComplete = false;
                            }
                        }
                    }
                });
            }

            // console.log(`stageComplete = ${stageComplete}`)
            if (stageComplete == true) {
                Memory.rooms[roomName].building[currentRoomBuildingLevel].currentStage++;
                if (Memory.rooms[roomName].building[currentRoomBuildingLevel].currentStage > baseData[r.controller.level].stages.length) {
                    // this will only be hit once on the pass that all building is completed
                    if (r.controller.level == 3) {
                        buildRoadsToSources(r);
                    }
                    if (r.controller.level == 5) {
                        buildControllerRampartSurroundings(r);
                        buildWalls(r)
                        queueSpawnCreep(roleRepairer, null, null, roomName);
                    }
                    if (r.controller.level == 6) {
                        buildExtractor(r);
                    }
                    Memory.rooms[roomName].building[currentRoomBuildingLevel].isComplete = true;
                    Memory.rooms[roomName].currentRoomBuildingLevel++;
                }
            }
        } catch(e) {}
    }
};

function buildControllerRampartSurroundings(r) {
    // controller surroundings
    const terrain = r.getTerrain();
    for (var i = r.controller.pos.x - 1; i <= r.controller.pos.x + 1; i++) {
        for (var j = r.controller.pos.y - 1; j <= r.controller.pos.y + 1; j++) {
            // r.visual.circle(i, j, { fill: "red", lineStyle: "dashed" , radius: 0.55 });
            if (
                // any edges
                i == r.controller.pos.x - 1 ||
                i == r.controller.pos.x + 1 ||
                j == r.controller.pos.y - 1 ||
                j == r.controller.pos.y + 1
            ) {
                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                    // r.visual.circle(i, j, { fill: "green", lineStyle: "dashed", radius: 0.55 });
                    r.createConstructionSite(i, j, "rampart");
                }
            }
        }
    }
}

buildRampartSurroundings = function (r) {
    // controller surroundings
    const terrain = r.getTerrain();
    var center = Game.getObjectById(Memory.rooms[r.name].mainSpawn.id).pos;
    for (var i = center.x - 8; i <= center.x + 8; i++) {
        for (var j = center.y - 8; j <= center.y + 8; j++) {
            // r.visual.circle(i, j, { fill: "red", lineStyle: "dashed" , radius: 0.55 });
            if (
                // any edges
                // i == center.x - 8 ||
                // i == center.x + 8 ||
                // j == center.y - 8 ||
                // j == center.y + 8
                center.getRangeTo(i, j) == 7
            ) {
                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                    // r.visual.circle(i, j, { fill: "green", lineStyle: "dashed", radius: 0.55 });
                    r.createConstructionSite(i, j, "rampart");
                }
            }
        }
    }
};

function buildExtractor(r) {
    deposits = r.find(FIND_DEPOSITS);
    for (d of deposits) {
        r.createConstructionSite(d.pos, "extractor");
        const terrain = r.getTerrain();
        for (var i = d.pos.x - 1; i <= d.pos.x + 1; i++) {
            for (var j = d.pos.y - 1; j <= d.pos.y + 1; j++) {
                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                    for (var ii = i - 1; ii <= i + 1; ii++) {
                        for (var jj = j - 1; jj <= j + 1; jj++) {
                            if (terrain.get(ii, jj) != TERRAIN_MASK_WALL) {
                                if (r.createConstructionSite(ii, jj, STRUCTURE_CONTAINER) == OK) return;
                            }
                        }
                    }
                }
            }
        }
    }
}

setRoomCostMatrix = function (r) {
    if (_.isString(r)) {
        r = Game.rooms[r];
        if (r == undefined) {
            return false;
        }
    }
    console.log(`Calculating room cost matrix for ${r.name}`)
    const terrain = new Room.Terrain(r.name);
    const matrix = new PathFinder.CostMatrix();
    const visual = new RoomVisual(r.name);

    // Fill CostMatrix with default terrain costs for future analysis:
    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            const tile = terrain.get(x, y);
            weight =
                tile === TERRAIN_MASK_WALL
                    ? 255 // wall  => unwalkable
                    : tile === TERRAIN_MASK_SWAMP
                    ? 5 // swamp => weight:  5
                    : 3; // plain => weight:  3
            var struct = r.lookForAt(LOOK_STRUCTURES, x, y);
            if (struct.length) {
                if (struct[0].structureType == STRUCTURE_ROAD) {
                    weight = 0;
                } else {
                    weight = 255;
                }
            }
            matrix.set(x, y, weight);
        }
    }
    for (var l in baseData) {
        for (var s in baseData[l].stages) {
            for (var sub_s in baseData[l].stages[s]) {
                baseData[l].stages[s].forEach((subStageBuildingTypeSet) => {
                    subStageBuildingTypeSet.pos.forEach((offsetPos) => {
                        baseCenter = Memory.rooms[r.name].mainSpawn.pos;
                        var realX = baseCenter.x + offsetPos.x;
                        var realY = baseCenter.y + offsetPos.y;
                        if (subStageBuildingTypeSet.buildingType == "road") {
                            matrix.set(realX, realY, 0);
                        } else {
                            matrix.set(realX, realY, 255);
                        }
                    });
                });
            }
        }
    }
    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            visual.text(matrix.get(x, y), x, y);
        }
    }
    Memory.rooms[r.name].costMatrix = matrix.serialize();
};

buildRoadsToSources = function (r, debug = false) {
    if (_.isString(r)) {
        r = Game.rooms[r];
        if (r == undefined) {
            return false;
        }
    }
    setRoomCostMatrix(r);
    mainSpawn = Game.getObjectById(Memory.rooms[r.name].mainSpawn.id); // Use spawn just incase storage doesn't exist

    new RoomVisual().circle(mainSpawn, { fill: "transparent", radius: 0.55, stroke: "red" });

    _.forEach(Memory.rooms[r.name].sources, (source) => {
        s = Game.getObjectById(source.id);
        if (s == undefined) {
            return;
        }
        pathTo = mainSpawn.pos.findPathTo(s, {
            ignoreCreeps: true,
            range: 1,
            maxRooms: 1,
            costCallback: function (roomName, costMatrix) {
                if (Memory.rooms[roomName].costMatrix == undefined) {
                    console.log(`${roomName} has no costMatrix`)
                    return null
                } else {
                    return PathFinder.CostMatrix.deserialize(Memory.rooms[roomName].costMatrix);
                }
            },
        });
        if (!debug) {
            _.forEach(pathTo, (step) => {
                r.createConstructionSite(step.x, step.y, "road");
            });
        }
        console.log(JSON.stringify(pathTo));
        new RoomVisual().poly(pathTo);
    });
};

buildRoadsToExtSources = function (r, debug = false) {
    if (_.isString(r)) {
        r = Game.rooms[r];
        if (r == undefined) {
            return false;
        }
    }
    mainSpawn = Game.getObjectById(Memory.rooms[r.name].mainSpawn.id); // Use spawn just incase storage doesn't exist

    console.log(mainSpawn.pos);
    new RoomVisual().circle(mainSpawn, { fill: "transparent", radius: 0.55, stroke: "red" });

    _.forEach(Memory.rooms[r.name].externalSources, (ext) => {
        s = Game.getObjectById(ext);
        if (s == undefined) {
            return;
        }
        // pathTo = mainSpawn.pos.findPathTo(s, { ignoreCreeps: true, maxRooms: 3 });
        pathTo = PathfinderSearchUsePathsIgnoreCreeps(mainSpawn.pos, s.pos);
        if (!debug) {
            _.forEach(pathTo.path, (step) => {
                const terrain = Game.rooms[step.roomName].getTerrain();
                if (terrain.get(step.x, step.y) != TERRAIN_MASK_WALL) {
                    Game.rooms[step.roomName].createConstructionSite(step.x, step.y, "road");
                }
            });
        }
        console.log(JSON.stringify(pathTo));
        new RoomVisual().poly(pathTo);
        return;
    });
};

buildWalls = function (r, debug = false) {
    if (_.isString(r)) {
        r = Game.rooms[r];
        if (r == undefined) {
            return false;
        }
    }
    mainSpawn = Game.getObjectById(Memory.rooms[r.name].mainSpawn.id); // Use spawn just incase storage doesn't exist

    new RoomVisual().circle(mainSpawn, { fill: "transparent", radius: 0.55, stroke: "red" });

    _.forEach(wallData.constructedWall, (w) => {
        if (r.lookAt(mainSpawn.pos.x + w.x, mainSpawn.pos.y + w.y).length == 1) {
            r.visual.circle(mainSpawn.pos.x + w.x, mainSpawn.pos.y + w.y, { stroke: "black" });
            if (!debug) {
                r.createConstructionSite(mainSpawn.pos.x + w.x, mainSpawn.pos.y + w.y, "constructedWall");
            }
        }
    });
    _.forEach(wallData.rampart, (w) => {
        if (r.getTerrain().get(mainSpawn.pos.x + w.x, mainSpawn.pos.y + w.y) != 1) {
            r.visual.circle(mainSpawn.pos.x + w.x, mainSpawn.pos.y + w.y, { fill: "transparent", stroke: "light-green" });
            if (!debug) {
                r.createConstructionSite(mainSpawn.pos.x + w.x, mainSpawn.pos.y + w.y, "rampart");
            }
        }
    });
};

restartRoomBuildingLevel = function (roomName, level = 1) {
    room = Game.rooms[roomName];
    if (room == undefined) return;
    room.memory.currentRoomBuildingLevel = level;
    for (var i = level; i <= 8; i++) {
        room.memory.building[i].currentStage = 0;
        room.memory.building[i].isComplete = false;
    }
};

resetMainStorage = function (roomName) {
    room = Game.rooms[roomName];
    if (room == undefined) return;
    mainSpawnPos = room.memory.mainSpawn.pos;
    if (room.controller.level >= 4) {
        r.createConstructionSite(mainSpawnPos.x + 2, mainSpawnPos.y - 1, "storage");
    } else {
        r.createConstructionSite(mainSpawnPos.x + 2, mainSpawnPos.y, "container");
    }
};

global.baseRawData = `
{
    "2": {
        "stages": [
            [
                {
                    "buildingType": "extension",
                    "pos": [
                        { "x": -2, "y": -1 },
                        { "x": -3, "y": -2 },
                        { "x": -2, "y": -2 },
                        { "x": -2, "y": -3 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "road",
                    "pos": [
                        { "x": -1, "y": -3 },
                        { "x": -1, "y": -1 },
                        { "x": 0, "y": -1 },
                        { "x": 0, "y": -2 },
                        { "x": -1, "y": 0 },
                        { "x": -2, "y": 0 },
                        { "x": -2, "y": -4 },
                        { "x": -3, "y": -1 },
                        { "x": -4, "y": -2 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "container",
                    "pos": [
                        { "x": 2, "y": 0 }
                    ]
                }
            ]
        ]
    },
    "3": {
        "stages": [
            [
                {
                    "buildingType": "extension",
                    "pos": [
                        { "x": -4, "y": -4 },
                        { "x": -3, "y": -4 },
                        { "x": -4, "y": -3 },
                        { "x": -4, "y": -5 },
                        { "x": -4, "y": -1 }
                        
                    ]
                }
            ],
            [
                {
                    "buildingType": "tower",
                    "pos": [
                        { "x": 1, "y": -2 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "road",
                    "pos": [
                        { "x": -3, "y": -5 }
                    ]
                }
            ]
        ]
    },
    "4": {
        "stages": [
            [
                {
                    "buildingType": "extension",
                    "pos": [
                        { "x": -5, "y": -4 },
                        { "x": -5, "y": -5 },
                        { "x": -5, "y": -6 },
                        { "x": -6, "y": -5 },
                        { "x": -7, "y": -5 },
                        { "x": -7, "y": -4 },
                        { "x": -6, "y": -3 },
                        { "x": -6, "y": -2 },
                        { "x": -5, "y": -2 },
                        { "x": -5, "y": -1 }
                    ]
                },
                {
                    "buildingType": "road",
                    "pos": [
                        { "x": -6, "y": -4 },
                        { "x": -5, "y": -3 },
                        { "x": -4, "y": -2 },
                        { "x": -4, "y": -6 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "storage",
                    "pos": [
                        { "x": 2, "y": -1 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "road",
                    "pos": [
                        { "x": 1, "y": 0 },
                        { "x": 2, "y": 0 },
                        { "x": 1, "y": -1 }
                    ]
                    
                }
            ]
        ]
    },
    "5": {
        "stages": [
            [
                {
                    "buildingType": "extension",
                    "pos": [
                        { "x": -3, "y": 0 },
                        { "x": -4, "y": 0 },
                        { "x": -4, "y": -1 },
                        { "x": -4, "y": 1 },
                        { "x": -5, "y": 2 },
                        { "x": -2, "y": 2 },
                        { "x": -2, "y": 3 }
                    ]
                },
                {
                    "buildingType": "road",
                    "pos": [
                        { "x": 0, "y": 1 },
                        { "x": 1, "y": 1 },
                        { "x": -1, "y": 1 },
                        { "x": 0, "y": 2 },
                        { "x": -1, "y": 3 },
                        { "x": -3, "y": 1 },
                        { "x": -2, "y": 4 },
                        { "x": -3, "y": 1 },
                        { "x": -4, "y": 2 },
                        { "x": -5, "y": 3 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "tower",
                    "pos": [
                        { "x": 1, "y": 2 }
                    ]
                }
            ]
        ]
    },
    "6": {
        "stages": [
            [
                {
                    "buildingType": "road",
                    "pos": [
                        { "x": -2, "y": 4 },
                        { "x": -3, "y": 5 },
                        { "x": -4, "y": 6 },
                        { "x": -5, "y": 7 },
                        { "x": -3, "y": 3 },
                        { "x": -5, "y": 5 },
                        { "x": -6, "y": 4 },
                        { "x": -7, "y": 5 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "extension",
                    "pos": [
                        { "x": -3, "y": 2 },
                        { "x": -3, "y": 4 },
                        { "x": -4, "y": 3 },
                        { "x": -4, "y": 4 },
                        { "x": -4, "y": 5 },
                        { "x": -5, "y": 4 },
                        { "x": -5, "y": 6 },
                        { "x": -6, "y": 5 },
                        { "x": -6, "y": 6 },
                        { "x": -7, "y": 4 },
                        { "x": -7, "y": 6 },
                        { "x": -6, "y": 2 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "road",
                    "pos": [
                        { "x": 3, "y": -1 },
                        { "x": 4, "y": -2 },
                        { "x": -7, "y": 3 },
                        { "x": -8, "y": 2 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "link",
                    "pos": [
                        { "x": 3, "y": -2 }
                    ]
                }
            ]
        ]
    },
    "7": {
        "stages": [
            [
                {
                    "buildingType": "extension",
                    "pos": [
                        { "x": -6, "y": 3 },
                        { "x": -7, "y": 3 },
                        { "x": -7, "y": 4 },
                        { "x": 0, "y": -4 },
                        { "x": -1, "y": -4 },
                        { "x": -1, "y": -5 },
                        { "x": -2, "y": -5 },
                        { "x": -2, "y": -6 },
                        { "x": -3, "y": -6 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "tower",
                    "pos": [
                        { "x": 0, "y": 3 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "spawn",
                    "pos": [
                        { "x": 2, "y": 1 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "lab",
                    "pos": [
                        { "x": 4, "y": 1 },
                        { "x": 5, "y": 1 },
                        { "x": 5, "y": 2 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "terminal",
                    "pos": [
                        { "x": 3, "y": 0 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "factory",
                    "pos": [
                        { "x": 2, "y": 2 }
                    ]
                }
            ]
        ]
    },
    "8": {
        "stages": [
            [
                {
                    "buildingType": "tower",
                    "pos": [
                        { "x": -1, "y": 2 },
                        { "x": -1, "y": -2 },
                        { "x": 0, "y": -3 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "spawn",
                    "pos": [
                        { "x": -2, "y": 1 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "observer",
                    "pos": [
                        { "x": 3, "y": -4 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "extension",
                    "pos": [
                        { "x": -1, "y": 4 },
                        { "x": -2, "y": 5 },
                        { "x": -3, "y": 6 },
                        { "x": -4, "y": 7 },
                        { "x": -5, "y": 8 },
                        { "x": -3, "y": 7 },
                        { "x": -6, "y": 7 },
                        { "x": -7, "y": 6 },
                        { "x": -6, "y": -6 },
                        { "x": -3, "y": -7 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "powerSpawn",
                    "pos": [
                        { "x": 3, "y": -2 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "nuker",
                    "pos": [
                        { "x": 4, "y": -3 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "lab",
                    "pos": [
                        { "x": 6, "y": 2 },
                        { "x": 6, "y": 3 },
                        { "x": 4, "y": 4 },
                        { "x": 5, "y": 4 }
                    ]
                }
            ]
        ]
    }
}
`;

global.baseData = JSON.parse(baseRawData);
Memory.buildingPlan = baseData;

wallRawData = `{"constructedWall":[{"x":-8,"y":7},{"x":-6,"y":7},{"x":-4,"y":7},{"x":-2,"y":7},{"x":-1,"y":7},{"x":0,"y":7},{"x":1,"y":7},{"x":2,"y":7},{"x":3,"y":7},{"x":4,"y":7},{"x":4,"y":6},{"x":5,"y":6},{"x":5,"y":5},{"x":6,"y":5},{"x":6,"y":4},{"x":7,"y":4},{"x":7,"y":3},{"x":7,"y":2},{"x":7,"y":1},{"x":7,"y":0},{"x":7,"y":-1},{"x":6,"y":-2},{"x":5,"y":-3},{"x":4,"y":-4},{"x":3,"y":-5},{"x":2,"y":-6},{"x":1,"y":-7},{"x":1,"y":-8},{"x":2,"y":-7},{"x":3,"y":-6},{"x":4,"y":-5},{"x":5,"y":-4},{"x":6,"y":-3},{"x":7,"y":-2},{"x":-10,"y":-1},{"x":-10,"y":-2},{"x":-10,"y":-3},{"x":-10,"y":-4},{"x":-10,"y":-5},{"x":-10,"y":-6},{"x":-9,"y":-6},{"x":-8,"y":-7},{"x":-8,"y":-8},{"x":-7,"y":-8},{"x":-10,"y":0},{"x":-10,"y":1},{"x":-10,"y":2},{"x":-10,"y":3},{"x":-10,"y":4},{"x":-10,"y":5},{"x":-10,"y":6},{"x":-10,"y":7},{"x":-4,"y":-8},{"x":-3,"y":-8},{"x":-2,"y":-8},{"x":-1,"y":-8}],"rampart":[{"x":-9,"y":7},{"x":-7,"y":7},{"x":-5,"y":7},{"x":-3,"y":7},{"x":0,"y":-8},{
    "x":-8,"y":-6}]}`;
global.wallData = JSON.parse(wallRawData);
