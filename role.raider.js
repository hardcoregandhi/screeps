

global.roleRaider = {
    name: "raider",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [],
    bodyLoop: [CARRY, MOVE],
    
    /** @param {Creep} creep **/
    run: function (creep) {
        creep.say("raidin");
        if (creep.memory.scav == undefined) {
            creep.memory.scav = false;
        }
        
        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (!creep.memory.scav && creep.store.getUsedCapacity() == 0) {
            creep.memory.scav = true;
            creep.say("🔄 scav");
        }
        if (creep.memory.scav && creep.store.getFreeCapacity() == 0) {
            creep.memory.scav = false;
            creep.say("dropping");
        }

        if (!creep.memory.scav) {
            creep.say("emptyin");
            
            //no storage, just grab energy
            mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (mainStorage == undefined) {
                Log(creep, "mainStorage could not be found");
            } else {
                Log(creep, "using mainStorage");
                for (const resourceType in creep.store) {
                    if (creep.transfer(mainStorage, resourceType) != OK) {
                        moveToMultiRoomTarget(creep, mainStorage)
                        return;
                    }
                }
                return;
            }
        
        } else {
            if (creep.room.name != creep.memory.targetRoomName) {
                // const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName, {
                //     maxRooms: 16,
                // });
                // if (route.length > 0) {
                //     const exit = creep.pos.findClosestByRange(route[0].exit);
                //     creep.moveTo(exit);
                //     return;
                // }
                if(Game.rooms[creep.memory.targetRoomName] == undefined)
                    moveToRoom(creep, creep.memory.targetRoomName)
                else 
                    creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoomName))
            } else {
                if (creep.memory.currentTarget == null) {
                    var resourceFilledStructs = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                        filter: (r) => r.store != undefined && r.store.getUsedCapacity() >= 150,
                    });
                    creep.memory.currentTarget = resourceFilledStructs.id
                }
                
                resourceFilledStructs = Game.getObjectById(creep.memory.currentTarget)
                
                if(resourceFilledStructs == null || resourceFilledStructs.store.getUsedCapacity() < 150) {
                    creep.memory.currentTarget = null
                }
               
                if (resourceFilledStructs) {
                    creep.say("f/tomb");
                    for (const resourceType in resourceFilledStructs.store) {
                        if (creep.withdraw(resourceFilledStructs, resourceType) != 0) {
                            moveToMultiRoomTarget(creep, resourceFilledStructs)
                        }
                    }
                } else {
                    creep.say("LOST");
                }
            }
        }
    },
};

module.exports = roleScavenger;
