function Log(str) {
    if (0) console.log(str);
}

global.roleDeliverer = {
    name: "deliverer",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    baseBodyParts: [],
    bodyLoop: [CARRY, MOVE],
    bodyPartsMaxCount: 30,

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.memory.DIE = true
        Log(creep, "run()")
        if (creep.memory.returning == undefined) {
            creep.memory.returning = true;
        }

        if (creep.memory.returning && creep.store.getFreeCapacity() == 0) {
            creep.memory.returning = false;
            creep.say("m2dest");
        }
        if (!creep.memory.returning && creep.store.getUsedCapacity() == 0) {
            creep.memory.returning = true;
            creep.say("m2home");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (!creep.memory.returning) {
            Log(creep, "!returning")
            target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.terminal.id)
            Log(creep, target)
            // console.log(targetCreep)
            for (resourceType in creep.store) {
                if (creep.transfer(target, resourceType) != OK) {
                    // console.log(creep.transfer(storage, resourceType) )
                    creep.moveTo(target);
                    return;
                }
            }
        } else {
            Log(creep, "returning")

            var target = Game.getObjectById('621e4cf805dfb7e3a79afcec');
            if (creep.withdraw(target, RESOURCE_LEMERGIUM) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        }
    },
};

module.exports = roleDeliverer;
