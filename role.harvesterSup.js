

global.roleHarvSup = {
    name: "harvSup",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
    ],
    baseBodyParts: [WORK],
    bodyLoop: [CARRY, MOVE],
    bodyPartsMaxCount: 21,

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
        }
        if (creep.memory.returning == undefined) {
            creep.memory.returning = true;
        }

        mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
        if (mainStorage == undefined) {
            Log(creep, "mainStorage could not be found");
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

        if ((creep.ticksToLive < 200 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (!creep.memory.returning) {
            Log(creep, "retrieving");
            healRoads(creep);

            for (const resourceType in creep.store) {
                if (creep.transfer(mainStorage, resourceType) != OK) {
                    moveToTarget(creep, mainStorage);
                }
            }
        } else {
            Log(creep, "returning");
            pickupNearby(creep);
            if (creep.memory.targetContainer == undefined) {
                Log(creep, "finding new container");

                var containers = creep.room.find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && structure != mainStorage);
                if (!containers.length) return -1;

                containers.sort((a, b) => b.store.getUsedCapacity() - a.store.getUsedCapacity());
                creep.memory.targetContainer = containers[0].id;
                creep.memory.targetSource = containers[0].pos.findClosestByRange(FIND_SOURCES).id;
            }

            target = Game.getObjectById(creep.memory.targetContainer);
            creep.memory.targetSource = target.pos.findClosestByRange(FIND_SOURCES).id;

            if (creep.room.controller.level >= 6 && Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].link != undefined && target.store.getUsedCapacity() == 0) {
                creep.memory.DIE = {};
            }

            for (const resourceType in target.store) {
                Log(creep, 9);
                if (creep.withdraw(target, resourceType) != OK) {
                    moveToTarget(creep, target);
                }
            }
        }
    },
};

module.exports = roleHarvSup;
