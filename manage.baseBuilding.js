global.runBaseBuilder = function () {
    for (var roomName of myRooms) {
        r = Game.rooms[roomName];
        if (r == undefined) {
            log.error("Couldn't retrieve room to upgrade it");
            continue;
        }
        if (Memory.rooms[roomName].mainSpawn == undefined) {
            log.log(`setting up ${roomName}`);
            roomSpawner = r.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_SPAWN;
                },
            })[0];
            Memory.rooms[roomName].mainSpawn = {};
            Memory.rooms[roomName].mainSpawn.id = roomSpawner.id;
            Memory.rooms[roomName].mainSpawn.pos = roomSpawner.pos;
            Memory.rooms[roomName].currentRoomBuildingLevel = r.controller.level;
            Memory.rooms[roomName].building = [];
            for (var i = 1; i <= 8; i++) {
                Memory.rooms[roomName].building[i] = {};
                Memory.rooms[roomName].building[i].currentStage = 0;
                Memory.rooms[roomName].building[i].isComplete = false;
            }
        }

        var currentRoomBuildingLevel = Memory.rooms[roomName].currentRoomBuildingLevel;
        if (Memory.rooms[roomName].building[r.controller.level].isComplete == true) return;

        var currentStage = Memory.rooms[roomName].building[currentRoomBuildingLevel].currentStage;
        stageComplete = true;

        baseCenter = Memory.rooms[roomName].mainSpawn.pos;

        // one time swap setup
        for (var levelIter = 1; levelIter < 8; levelIter++) {
            if (baseData[levelIter] == undefined || baseData[levelIter].stages == undefined) break;
            for (var stage in baseData[levelIter].stages.length) {
                for (var set in baseData[levelIter].stages[stage]) {
                    switch (baseData[levelIter].stages[stage][set].buildingType) {
                        case "STRUCTURE_EXTENSION":
                            baseData[levelIter].stages[stage][set].buildingType = STRUCTURE_EXTENSION;
                            break;
                        case "STRUCTURE_ROAD":
                            baseData[levelIter].stages[stage][set].buildingType = STRUCTURE_ROAD;
                            break;
                        case "STRUCTURE_CONTAINER":
                            baseData[levelIter].stages[stage][set].buildingType = STRUCTURE_CONTAINER;
                            break;
                        case "STRUCTURE_TURRET":
                            baseData[levelIter].stages[stage][set].buildingType = STRUCTURE_TOWER;
                            break;
                        case "STRUCTURE_RAMPART":
                            baseData[levelIter].stages[stage][set].buildingType = STRUCTURE_RAMPART;
                            break;
                        case "STRUCTURE_ROAD":
                            baseData[levelIter].stages[stage][set].buildingType = STRUCTURE_ROAD;
                            break;
                        case "STRUCTURE_LINK":
                            baseData[levelIter].stages[stage][set].buildingType = STRUCTURE_LINK;
                            break;
                        default:
                            log.error("error parsing base data");
                    }
                }
            }
        }

        if (baseData[currentRoomBuildingLevel] == undefined || baseData[currentRoomBuildingLevel].stages == undefined) break;

        for (var s in baseData[currentRoomBuildingLevel].stages[currentStage]) {
            baseData[currentRoomBuildingLevel].stages[currentStage].forEach((subStageBuildingTypeSet) => {
                subStageBuildingTypeSet.pos.forEach((offsetPos) => {
                    var realX = baseCenter.x + offsetPos.x;
                    var realY = baseCenter.y + offsetPos.y;
                    r.visual.circle(realX, realY, { color: "green", lineStyle: "dashed" });
                    const look = new RoomPosition(realX, realY, roomName).lookFor(LOOK_STRUCTURES);
                    if (look.length == 0) {
                        // console.log(r)
                        Game.rooms[roomName].createConstructionSite(realX, realY, subStageBuildingTypeSet.buildingType);
                        // log.log(r.createConstructionSite(realX, realY, subStageBuildingTypeSet.buildingType))
                        // console.log("creting site " + subStageBuildingTypeSet.buildingType)
                        stageComplete = false;
                    }
                });
            });
        }

        if (stageComplete == true) {
            Memory.rooms[roomName].building[currentRoomBuildingLevel].currentStage++;
            if (Memory.rooms[roomName].building[currentRoomBuildingLevel].currentStage > baseData[r.controller.level].stages.length) {
                Memory.rooms[roomName].building[currentRoomBuildingLevel].isComplete = true;
                Memory.rooms[roomName].currentRoomBuildingLevel++
            }
        }
    }
};

global.baseRawData =
`
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
                        { "x": -2, "y": -3 },
                        { "x": -1, "y": -2 }
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
            ]
        ]
    },
    "3": {
        "stages": [
            [
                {
                    "buildingType": "extension",
                    "pos": [
                        { "x": -3, "y": -3 },
                        { "x": -4, "y": -4 },
                        { "x": -3, "y": -4 },
                        { "x": -4, "y": -3 },
                        { "x": -4, "y": -5 }
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
    "4": {},
    "5": {},
    "6": {},
    "7": {},
    "8": {}
}
`

global.baseData = JSON.parse(baseRawData);
Memory.buildingPlan = baseData
