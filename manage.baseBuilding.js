global.runBaseBuilder = function () {
    for (var roomName of myRooms[Game.shard.name]) {
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
            baseData[currentRoomBuildingLevel].stages[currentStage].forEach((subStageBuildingTypeSet) => {
                subStageBuildingTypeSet.pos.forEach((offsetPos) => {
                    var realX = baseCenter.x + offsetPos.x;
                    var realY = baseCenter.y + offsetPos.y;
                    r.visual.circle(realX, realY, { color: "green", lineStyle: "dashed" });
                    const look = new RoomPosition(realX, realY, roomName).lookFor(LOOK_STRUCTURES);
                    if (look.length) {
                        if (look[0].structureType == STRUCTURE_ROAD && look[0].structureType != subStageBuildingTypeSet.buildingType) {
                            look[0].destroy();
                            look.pop();
                        }
                        if (look[0].structureType == subStageBuildingTypeSet.buildingType) {
                            return;
                        }
                    }
                    const isWall = new Room.Terrain(roomName).get(realX, realY) == TERRAIN_MASK_WALL;
                    if (!isWall && !look.length) {
                        var ret = r.createConstructionSite(realX, realY, subStageBuildingTypeSet.buildingType);
                        if (ret == ERR_RCL_NOT_ENOUGH) {
                            console.log("ERR_RCL_NOT_ENOUGH");
                        } else {
                            stageComplete = false;
                        }
                    }
                });
            });
        }

        if (stageComplete == true) {
            Memory.rooms[roomName].building[currentRoomBuildingLevel].currentStage++;
            if (Memory.rooms[roomName].building[currentRoomBuildingLevel].currentStage > baseData[r.controller.level].stages.length) {
                // this will only be hit once on the pass that all building is completed
                if (r.controller.level == 4) {
                    buildControllerSurroundings(r);
                }
                if (r.controller.level == 5) {
                    buildControllerRampartSurroundings(r);
                }
                if (r.controller.level == 6) {
                    buildExtractor(r);
                }
                Memory.rooms[roomName].building[currentRoomBuildingLevel].isComplete = true;
                Memory.rooms[roomName].currentRoomBuildingLevel++;
            }
        }
    }
};

function buildControllerSurroundings(r) {
    // controller surroundings
    const terrain = r.getTerrain();
    for (var i = r.controller.pos.x - 4; i <= r.controller.pos.x + 4; i++) {
        for (var j = r.controller.pos.y - 4; j <= r.controller.pos.y + 4; j++) {
            // r.visual.circle(i, j, { fill: "red", lineStyle: "dashed" , radius: 0.55 });
            if (
                // any edges
                i == r.controller.pos.x - 4 ||
                i == r.controller.pos.x + 4 ||
                j == r.controller.pos.y - 4 ||
                (j == r.controller.pos.y + 4 &&
                    // but not the corners (diagonal movement)
                    (!(i == r.controller.pos.x - 4 && i == r.controller.pos.y - 4) ||
                        !(i == r.controller.pos.x - 4 && i == r.controller.pos.y + 4) ||
                        !(i == r.controller.pos.x + 4 && i == r.controller.pos.y - 4) ||
                        !(i == r.controller.pos.x + 4 && i == r.controller.pos.y + 4)))
            ) {
                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                    // r.visual.circle(i, j, { fill: "green", lineStyle: "dashed", radius: 0.55 });
                    r.createConstructionSite(i, j, "road");
                }
            }
        }
    }
}

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
    }
}

buildRoadsToSources = function (r) {
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
        pathTo = mainSpawn.pos.findPathTo(s, { ignoreCreeps: true });
        _.forEach(pathTo, (step) => {
            r.createConstructionSite(step.x, step.y, "road");
        });
        console.log(JSON.stringify(pathTo));
        new RoomVisual().poly(pathTo);
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
                        { "x": -5, "y": 1 },
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
            ],
            [
                {
                    "buildingType": "rampart",
                    "pos": [
                        { "x": 0, "y": 8 },
                        { "x": 1, "y": 8 },
                        { "x": 2, "y": 8 },
                        { "x": 3, "y": 8 },
                        { "x": -1, "y": 8 },
                        { "x": -2, "y": 8 },
                        { "x": -3, "y": 8 },
                        { "x": -4, "y": 8 },
                        { "x": 4, "y": 8 },
                        { "x": -5, "y": 8 },
                        { "x": -6, "y": 7 },
                        { "x": -7, "y": 6 },
                        { "x": -8, "y": 5 },
                        { "x": -8, "y": 1 },
                        { "x": -8, "y": 2 },
                        { "x": -8, "y": 3 },
                        { "x": -8, "y": 4 },
                        { "x": 0, "y": -8 },
                        { "x": -1, "y": -8 },
                        { "x": -2, "y": -8 },
                        { "x": -3, "y": -8 },
                        { "x": -4, "y": -8 },
                        { "x": -5, "y": -8 },
                        { "x": 7, "y": 6 },
                        { "x": 8, "y": 4 },
                        { "x": 8, "y": 3 },
                        { "x": 8, "y": 2 },
                        { "x": 8, "y": 1 },
                        { "x": 8, "y": 5 },
                        { "x": 8, "y": 0 },
                        { "x": 8, "y": -1 },
                        { "x": 8, "y": -2 },
                        { "x": 8, "y": -3 },
                        { "x": 8, "y": -4 },
                        { "x": 8, "y": -5 },
                        { "x": 7, "y": -6 },
                        { "x": 8, "y": 6 },
                        { "x": -8, "y": 6 },
                        { "x": -7, "y": 7 },
                        { "x": -6, "y": 8 },
                        { "x": 7, "y": -7 },
                        { "x": 8, "y": -6 },
                        { "x": 6, "y": -7 },
                        { "x": 7, "y": 7 },
                        { "x": 6, "y": 7 },
                        { "x": 5, "y": 8 }
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
                        { "x": -6, "y": 7 },
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
                        { "x": 4, "y": -2 }
                    ]
                }
            ],
            [
                {
                    "buildingType": "road",
                    "pos": [
                        { "x": 3, "y": 1 },
                        { "x": 4, "y": 2 }
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
                    "buildingType": "lab",
                    "pos": [
                        { "x": 3, "y": 2 },
                        { "x": 3, "y": 3 },
                        { "x": 4, "y": 3 }
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
