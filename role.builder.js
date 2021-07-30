var roleHarvester = require("role.harvester");
require("movement");

global.roleBuilder = {
    name: "builder",
    BodyParts: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    roleMemory: { memory: {} },
    /** @param {Creep} creep **/
    run: function (creep) {
        if (!creep.memory.currentSource == null) {
            creep.memory.currentSource = 0;
        }
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                moveToTarget(creep, exit, true);
            } else {
                creep.say("No route found");
            }
            return;
        }
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length == 0) {
            if (creep.body.filter((x) => x.type == MOVE).length > 5) {
                _.forEach(Game.rooms, (room) => {
                    if (room.find(FIND_CONSTRUCTION_SITES).length) {
                        creep.memory.baseRoomName = room.name;
                        return;
                    }
                });
            }
            if (creepRoomMap.get(creep.room.name + "eenergy") == undefined || creepRoomMap.get(creep.room.name + "eenergy") < 200) {
                // console.log("Defauling to Harvester")
                roleHarvester.run(creep);
                return;
            } else {
                // console.log("Defauling to upgrader")
                roleUpgrader.run(creep);
                return;
            }
        }

        var sources = creep.room.find(FIND_SOURCES);
        if (creep.memory.currentSource > sources.length - 1) {
            creep.memory.currentSource = 0;
        }

        if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            creep.say("🚧 build");
        }

        if (creep.memory.building) {
            // var targets = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            // if (targets.length > 0) {
            //     if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            //         creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            //     }
            // }
            if (creep.ticksToLive < 250) {
                creep.memory.healing = true;
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_SPAWN;
                        // && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    },
                });
                target = targets[0];
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: { stroke: "#ffffff" },
                    });
                    return;
                }
            }
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                var closest = creep.pos.findClosestByPath(targets);

                if (creep.build(closest) == ERR_NOT_IN_RANGE) {
                    // moveToTarget(creep, closest, false)
                    creep.moveTo(closest, {
                        visualizePathStyle: { stroke: "#ffffff" },
                    });
                }
            }
        } else {
            if (Game.flags.DISMANTLE) {
                var dismantle = Game.flags.DISMANTLE.pos.lookFor(LOOK_STRUCTURES)[0];
                if (dismantle) {
                    if (creep.dismantle(dismantle) != OK) {
                        console.log(creep.dismantle(dismantle));
                        creep.moveTo(dismantle, {
                            visualizePathStyle: { stroke: "#ffaa00" },
                        });
                    }
                    return;
                }
            }

            if (creepRoomMap.get(creep.room.name + "mover") > 0) {
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity() > 0;
                    },
                });
                if (creepRoomMap.get(creep.room.name + "eenergy") < 800) {
                    moveToTarget(creep, creep.room.controller.pos, false);
                    return;
                }
                if (targets.length) {
                    if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                        creep.moveTo(targets[0], {
                            visualizePathStyle: { stroke: "#ffaa00" },
                        });
                    }
                }
            } else {
                var closeSources = creep.room.find(FIND_SOURCES, {
                    filter: (s) => {
                        return creep.pos.inRangeTo(s, 15) == true;
                    },
                });
                if (closeSources.length > 0) {
                    if (creep.store.getFreeCapacity() > 0) {
                        if (creep.harvest(sources[creep.memory.currentSource]) == ERR_NOT_IN_RANGE) {
                            if (
                                moveToTarget(
                                    creep,
                                    sources[creep.memory.currentSource],
                                    {
                                        visualizePathStyle: {
                                            stroke: "#ffaa00",
                                        },
                                    },
                                    false
                                ) == ERR_NO_PATH
                            ) {
                                creep.memory.currentSource++;
                            }
                        }
                    }
                }
            }
        }
    },
};

module.exports = roleBuilder;
