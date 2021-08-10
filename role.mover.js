function log(str) {
    if (0) console.log(str);
}

global.roleMover = {
    name: "mover",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],

    /** @param {Creep} creep **/
    run: function (creep) {
        var sources = creep.room.find(FIND_SOURCES);
        if (!creep.memory.currentSource) {
            creep.memory.currentSource = 0;
        }

        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit, {
                    visualizePathStyle: { stroke: "#ffffff" },
                });
            } else {
                creep.say("No route found");
            }
            return;
        }

        if (Game.flags.AVOID1 != undefined) {
            if (creep.room.name == Game.flags.AVOID1.room.name) {
                if (creep.pos.isEqualTo(Game.flags.AVOID1.pos)) {
                    if (creep.memory.previousPos != undefined) {
                        if (creep.pos.x == creep.memory.previousPos.x && creep.pos.y == creep.memory.previousPos.y) {
                            creep.move(3);
                            return;
                        }
                    }
                }
                creep.memory.previousPos = creep.pos;
            }
        }
        
        pickupNearby(creep);

        // If creep is holding non-energy, deposit it first
        var storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            },
        });
        for (const resourceType in creep.store) {
            if (resourceType != RESOURCE_ENERGY) {
                if (creep.transfer(storage, resourceType) != OK) {
                    // console.log(creep.transfer(storage, resourceType) )
                    moveToTarget(creep, storage, true);
                    return;
                }
            }
        }

        // Bad hack to split the upgraders and the harvesters
        creep.memory.currentSource = 0;

        if (creep.memory.moving && creep.store.getUsedCapacity() == 0) {
            creep.memory.moving = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
            creep.memory.moving = true;
            creep.say("dropping");
        }

        if (creep.ticksToLive < 300) {
            creep.say("healing");
            creep.memory.healing = true;
            returnToHeal(creep, creep.memory.baseRoomName);
            return;
        }

        if (!creep.memory.moving) {
            // creep.say("hello")
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity() > 0;
                },
            });
            if (targets.length) {
                // creep.say('m2storage');
                for (const resourceType in creep.store) {
                    if (resourceType != RESOURCE_ENERGY) {
                        if (creep.transfer(targets[0], resourceType) != OK) {
                            creep.moveTo(targets[0], {
                                visualizePathStyle: { stroke: "#ffaa00" },
                                maxRooms: 1,
                            });
                            return;
                        }
                    }
                }
                if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.moveTo(targets[0], {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 1,
                    });
                }
            } else creep.say("no eenergy");
        } else {
            var towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
            var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            // console.log(closestHostile)
            if (closestHostile) {
                if (creep.transfer(towers[0]) != OK) {
                    moveToTarget(creep, towers[0]);
                }
                return;
            }
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        ((structure.structureType == STRUCTURE_TOWER && Math.round((structure.store[RESOURCE_ENERGY] / structure.store.getCapacity([RESOURCE_ENERGY])) * 100) < 70) || structure.structureType == STRUCTURE_EXTENSION) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                },
            });
            // creep.say('m2extTower');
            if (!targets.length) {
                // creep.say('m2spawn');
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    },
                });
            }
            if (!targets.length) {
                // creep.say('m2Tower');
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    },
                });
            }
            if (!targets.length) {
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_LINK && storage.pos.inRangeTo(structure, 2) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    },
                });
            }
            if (!targets.length) {
                creep.say("no targets");
                try {
                    var storage = Game.getObjectById(Memory.rooms[creep.room.name].storage);
                    moveToTarget(creep, storage);
                    return;
                } catch (error) {
                    console.log(error);
                    console.trace();
                }
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTROLLER;
                    },
                });
            }
            target = creep.pos.findClosestByPath(targets);
            for (const resourceType in creep.store) {
                if (creep.transfer(target, resourceType) != OK) {
                    moveToTarget(creep, target, true);
                }
            }
        }
    },
};

module.exports = roleMover;
