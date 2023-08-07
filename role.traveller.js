global.roleTraveller = {
    name: "traveller",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],

    run: function (creep) {
        creep.say("🏳️");
        targetRoom = "W19S20";

        if (creep.memory.returning && creep.store.getUsedCapacity() == 0) {
            creep.memory.returning = false;
        }
        if (!creep.memory.returning && creep.store.getFreeCapacity() == 0) {
            creep.memory.returning = true;
        }

        if (!creep.memory.returning) {
            if (creep.room.name != targetRoom) {
                const route = Game.map.findRoute(creep.room, targetRoom);
                if (route.length > 0) {
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.Move(exit);
                }
            } else {
                var sources = creep.room.find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_POWER_BANK);
                if (sources.length) {
                    if (creep.attack(sources[0]) != OK) {
                        ret = creep.Move(sources[0], {
                            visualizePathStyle: { stroke: "#ffaa00" },
                        });
                    }
                    return;
                }

                var power = creep.room.find(FIND_DROPPED_RESOURCES).filter((r) => r.resourceType == RESOURCE_POWER);
                if (power.length) {
                    if (creep.pickup(power[0]) != OK) {
                        ret = creep.Move(power[0], {
                            visualizePathStyle: { stroke: "#ffaa00" },
                        });
                    }
                    return;
                }
            }
        } else {s
            if (creep.memory.baseRoomName != creep.room.name) {
                creep.Move(new RoomPosition(25, 25, creep.memory.baseRoomName));
            } else {
                var targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                    return structure.structureType == STRUCTURE_STORAGE;
                });
                if (targets.length) {
                    creep.say("m2storage");
                    for (const resourceType in creep.store) {
                        if (creep.transfer(targets[0], resourceType) != OK) {
                            creep.Move(targets[0], {
                                visualizePathStyle: { stroke: "#ffaa00" },
                            });
                        }
                    }
                }
            }
        }
    },
};

module.exports = roleTraveller;
