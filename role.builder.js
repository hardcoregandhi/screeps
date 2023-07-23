var roleHarvester = require("role.harvester");
require("movement");
require("role.common");

global.roleBuilder = {
    name: "builder",
    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK,
        WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE
        ],
    baseBodyParts: [MOVE, CARRY, WORK],
    bodyLoop: [MOVE, CARRY, WORK],
    bodyPartsMaxCount: 20,

    roleMemory: { memory: {} },
    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, "roleBuilder");
        // console.log("roleBuilder")
        if (creep.memory.interShard) {
            interShardMove(creep);
            return;
        }
        if (!creep.memory.currentSource == null) {
            creep.memory.currentSource = 0;
        }
        if (creep.memory.building == null) {
            creep.memory.building = true
        }

        // creep.memory.DIE = 1

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            Log(creep, "returning home.");
            creep.Move(new RoomPosition(25, 25, creep.memory.baseRoomName));
            return;
        }
        var customStructureSpecificPercentLimits = [];
        if (0) {
            customStructureSpecificPercentLimits = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return (
                    (structure.structureType == STRUCTURE_ROAD && Math.round((structure.hits / structure.hitsMax) * 100 < 40)) ||
                    (structure.structureType == STRUCTURE_CONTAINER && Math.round((structure.hits / structure.hitsMax) * 100 < 50)) ||
                    (structure.structureType == STRUCTURE_RAMPART && Math.round((structure.hits / structure.hitsMax) * 100 < 0.1)) ||
                    (structure.structureType == STRUCTURE_WALL && Math.round((structure.hits / structure.hitsMax) * 100 < 0.001))
                );
            });

            customStructureSpecificPercentLimits.sort((a, b) => (a.hits / a.hitsMax) * 100 > (b.hits / b.hitsMax) * 100);
            _.forEach(customStructureSpecificPercentLimits, (a) => {
                creep.room.visual.circle(a.pos, {
                    stroke: "red",
                    radius: 0.5,
                    lineStyle: "dashed",
                    fill: "transparent",
                });
            });
        }
        // creep.room.visual.circle(customStructureSpecificPercentLimits[0].pos, {
        //             stroke: "blue",
        //             radius: 0.2,
        //             lineStyle: "dashed",
        //             fill: "transparent",
        //         });

        // if (creepRoomMap.get(creep.room.name + "harvester") < 1 && (creepRoomMap.get(creep.room.name + "eenergy") == undefined || creepRoomMap.get(creep.room.name + "eenergy") < 200)) {
        //     Log(creep, "Defauling to Harvester");
        //     roleHarvester.run(creep);
        //     return;
        // } else if (creepRoomMap.get(creep.room.name + "csites") == 0) {
        //     Log(creep, "Defauling to Upgrader");
        //     roleUpgrader.run(creep);
        //     return;
        // }

        if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say("🔄 harvest");
            Log(creep, "setting building false");
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            creep.say("🚧 build");
            Log(creep, "setting building true");
        }

        if (creep.memory.building) {
            Log(creep, "building");

            if (creep.memory.currentTarget != null) {
                Log(creep, `currentTarget ${creep.memory.currentTarget}`);
                target = Game.getObjectById(creep.memory.currentTarget);
                if (target != null) {
                    Log(creep, `building ${target}@${target.pos}`);

                    if (creep.build(target) == ERR_NOT_IN_RANGE) {
                        creep.Move(target, {
                            visualizePathStyle: { stroke: "#ffffff" },
                        });
                    }
                    return;
                } else {
                    Log(creep, `currentTarget is now null`);
                    creep.memory.currentTarget = null;
                    roomRefreshMap[creep.room.name] = Game.time;
                    // refreshRoomTrackingNextTick = true;
                }
            }
            var csites = creepRoomMap.get(creep.room.name + "csites");
            if (!csites) {
                // if (creep.body.filter((x) => x.type == MOVE).length > 5) {
                //     _.forEach(Game.rooms, (room) => {
                //         if (room.find(FIND_CONSTRUCTION_SITES).length) {
                //             creep.memory.baseRoomName = room.name;
                //             return;
                //         }
                //     });
                // }
                if (creepRoomMap.get(creep.room.name + "harvester") < 1 && (creepRoomMap.get(creep.room.name + "eenergy") == undefined || creepRoomMap.get(creep.room.name + "eenergy") < 200) && creep.memory.role != "harvester") {
                    // console.log("Defauling to Harvester")
                    roleHarvester.run(creep);
                    return;
                } else if (creepRoomMap.get(creep.room.name + "eenergy") < 1000) {
                    creep.memory.DIE=1
                } else {
                    // console.log("Defauling to upgrader")
                    roleUpgrader.run(creep);
                    return;
                }
            }
            Log(creep, 5);
            // var targets = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            // if (targets.length > 0) {
            //     if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            //         creep.Move(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            //     }
            // }

            if (healRoads(creep) == OK) return;

            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                var closest = creep.pos.findClosestByPath(targets);
                creep.memory.currentTarget = closest.id;

                if (creep.build(closest) == ERR_NOT_IN_RANGE) {
                    // creep.Move(closest)
                    creep.Move(closest, {
                        visualizePathStyle: { stroke: "#ffffff" },
                    });
                }
            } else {
                roleUpgrader.run(creep);
            }
            if (customStructureSpecificPercentLimits.length) {
                repairTarget = creep.pos.findClosestByPath(customStructureSpecificPercentLimits);
                if (creep.repair(repairTarget) != OK) {
                    creep.Move(repairTarget);
                }
            }
        } else {
            Log(creep, "!building");
            delete creep.memory.currentTarget

            Log(creep, 8);
            if (Game.flags.DISMANTLE && creep.memory.baseRoomName == Game.flags.DISMANTLE.room.name) {
                var dismantle = Game.flags.DISMANTLE.pos.lookFor(LOOK_STRUCTURES)[0];
                if (dismantle) {
                    if (creep.dismantle(dismantle) != OK) {
                        console.log(creep.dismantle(dismantle));
                        creep.Move(dismantle, {
                            visualizePathStyle: { stroke: "#ffaa00" },
                        });
                    }
                    return;
                }
            }

            if (creepRoomMap.get(creep.room.name + "handler") >= 1) {
                Log(creep, 81);
                Log(creep, 10);
                try {
                    var link_controller = Game.getObjectById(Memory.rooms[creep.room.name].link_controller);
                    if (link_controller && link_controller.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                        if (creep.withdraw(link_controller, RESOURCE_ENERGY) != OK) {
                            creep.Move(link_controller);
                        }
                        return;
                    }
                } catch (error) {
                    console.log(error);
                    // console.trace();
                }

                mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
                if (mainStorage == undefined) {
                    Log(creep, "mainStorage could not be found");
                } else {
                    Log(creep, "using mainStorage");
                    if (mainStorage.store.getUsedCapacity() > mainStorage.store.getCapacity() * 0.001) {
                        if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                            // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                            creep.Move(mainStorage, {
                                visualizePathStyle: { stroke: "#ffaa00" },
                                maxRooms: 0,
                            });
                        }
                    } else {
                        creep.Move(creep.room.controller.pos);
                        return;
                    }
                    return;
                }
            } else {
                if ((creepRoomMap.get(creep.room.name + "eenergy") === undefined && creep.room.energyAvailable < creep.room.energyCapacityAvailable / 3) || creepRoomMap.get(creep.room.name + "eenergy") < 300) {
                    creep.Move(creep.room.controller.pos);
                    return;
                }
                var containers = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 500;
                });
                Log(creep, containers);
                if (containers.length) {
                    container = creep.pos.findClosestByPath(containers);
                    if (creep.withdraw(container, RESOURCE_ENERGY) != OK) {
                        creep.Move(container);
                    }
                    return;
                }
                var sources = creep.room.find(FIND_SOURCES);
                Log(creep, 9);
                if (sources.length > 0) {
                    target = creep.pos.findClosestByPath(sources);
                    if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                        if (creep.Move(target) == ERR_NO_PATH) {
                            creep.say("no path");
                        }
                    }
                } else {
                    creep.Move(creep.room.controller.pos);
                }
            }
        }
    },
};

module.exports = roleBuilder;
