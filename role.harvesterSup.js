function log(str) {
    if (0) console.log(str);
}

global.roleHarvSup = {
    name: "harvSup",
    roleMemory: { memory: {} },
    // prettier-ignore
    baseBodyParts: [WORK],
    bodyLoop: [CARRY, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
        }
        if (creep.memory.returning == undefined) {
            creep.memory.returning = true;
        }

        if (creep.memory.mainStorage == undefined) {
            // find room spawn
            spawn = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_SPAWN;
                },
            });
            if (spawn.length == 0) {
                creep.say("no spawn found!");
                return -1;
            }
            spawn = spawn[0];
            // find closest storage/container to spawn which is presumably main storage
            var target = spawn.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_STORAGE || (structure.structureType == STRUCTURE_CONTAINER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                },
            });
            creep.memory.mainStorage = target.id;
        }
        mainStorage = Game.getObjectById(creep.memory.mainStorage);
        if (mainStorage == undefined) {
            log(creep, "mainStorage could not be found");
        }

        if (creep.memory.returning && creep.store.getFreeCapacity() == 0) {
            creep.memory.returning = false;
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
            creep.say("m2dest");
        }
        if (!creep.memory.returning && creep.store.getUsedCapacity() == 0) {
            creep.memory.returning = true;
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
            creep.say("m2home");
        }

        // Lost creeps return home
        if (creep.room.name != creep.memory.fakeBaseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.fakeBaseRoomName, { maxRooms: 1 });
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit, {
                    visualizePathStyle: { stroke: "#ffffff" },
                    maxRooms: 1,
                });
            } else {
                creep.say("No route found");
            }
            return;
        }

        if (creep.ticksToLive < 200) {
            creep.say("healing");
            creep.memory.healing = true;
            returnToHeal(creep, creep.memory.baseRoomName);
            return;
        }

        if (!creep.memory.returning) {
            healRoads(creep);

            if (creep.transfer(mainStorage, RESOURCE_ENERGY) != OK) {
                creep.moveTo(mainStorage, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        } else {
            pickupNearby(creep);
            if (creep.memory.targetContainer == undefined) {
                var containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && structure != mainStorage;
                    },
                });
                if (!containers.length) return -1;

                containers.sort((a, b) => b.store.getUsedCapacity() - a.store.getUsedCapacity());
                creep.memory.targetContainer = containers[0].id;
            }

            target = Game.getObjectById(creep.memory.targetContainer);

            if (creep.withdraw(target, RESOURCE_ENERGY) != OK) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                    maxRooms: 1,
                });
            }
        }
    },
};

module.exports = roleHarvSup;
