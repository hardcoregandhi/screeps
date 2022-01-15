function Log(str) {
    if (0) console.log(str);
}

global.roleTrucker = {
    name: "trucker",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    baseBodyParts: [],
    bodyLoop: [CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    bodyPartsMaxCount: 30,

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
        }
        if (creep.memory.returning == undefined) {
            creep.memory.returning = true;
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
            var targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });
            if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
            return;
        }

        if (!creep.memory.returning) {
            var target = Game.getObjectById(Memory.rooms[creep.memory.targetRoomName].mainStorage);
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        } else {
            var target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        }
    },
};

module.exports = roleTrucker;
