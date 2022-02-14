const { map } = require("lodash");

global.roleCourier = {
    name: "courier",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [
        CARRY*10, 
        MOVE*10
    ],
    baseBodyParts: [],
    bodyLoop: [MOVE, CARRY],
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
            creep.memory.healing = true;
            creep.say("m2home");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (!creep.memory.returning) {
            Log(creep, "!returning")
            if (creep.room.name != creep.memory.targetRoomName) {
                moveToMultiRoomTarget(creep, new RoomPosition(25,25,creep.memory.targetRoomName))
            } else {
                roomCreeps = creep.room.find(FIND_CREEPS).filter(function(c) { return c.owner.username == "Screeps"});
                console.log(roomCreeps)
                if (roomCreeps.length) {
                    caravanCreepMap = new Map();
                    _.forEach(roomCreeps, (c) => {
                        try {
                            caravanCreepMap[c.id] = Object.keys(c.store)[0]
                            caravanCreepMap[Object.keys(c.store)[0]] = c.id
                        } catch {
                            
                        }
                    })
                    creep.memory.targetCreep = caravanCreepMap[creep.memory.resourceType]
                    // console.log(JSON.stringify(caravanCreepMap))
                    console.log(creep.memory.targetCreep)
                    if (creep.transfer(Game.getObjectById(creep.memory.targetCreep), creep.memory.resourceType) != OK) {
                        creep.moveTo(Game.getObjectById(creep.memory.targetCreep))
                    }
                    
                } else {
                    console.log(`${creep}@${creep.pos} is in targetroom but can't find caravan`)
                }
            }
        } else {
            Log(creep, "returning")

            var target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.factory.id);
            Log(creep, target)
            Log(creep, creep.memory.resourceType)
            if (creep.withdraw(target, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        }
    },
};

module.exports = roleCourier;