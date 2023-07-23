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
        Log(creep, "raidin");
        creep.say("raidin");
        if (creep.memory.scav == undefined) {
            creep.memory.scav = false;
        }

        creep.memory.noHeal = true;

        Log(creep, creep.ticksToLive < 300 || creep.memory.healing == true);
        Log(creep, creep.memory.noHeal == undefined || creep.memory.noHeal != true);

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            Log(creep, "healing");
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

        if (creep.memory.toDIE == true && creep.store.getUsedCapacity() == 0) {
            creep.memory.DIE = true;
            return;
        }

        if (!creep.memory.scav) {
            Log(creep, "emptyin");
            creep.say("emptyin");

            //no storage, just grab energy
            mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (mainStorage == undefined) {
                Log(creep, "mainStorage could not be found");
            } else {
                Log(creep, "using mainStorage");
                for (const resourceType in creep.store) {
                    if (creep.transfer(mainStorage, resourceType) != OK) {
                        creep.Move(mainStorage);
                        return;
                    }
                }
                return;
            }
        } else {
            Log(creep, "scavin");

            if (Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource] == undefined || Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource].finished == true) {
                creep.memory.toDIE = true;
                creep.memory.scav = false;
                return;
            }

            if (creep.room.name != creep.memory.targetRoomName) {
                // const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName, {
                //     maxRooms: 16,
                // });
                // if (route.length > 0) {
                //     const exit = creep.pos.findClosestByRange(route[0].exit);
                //     creep.Move(exit);
                //     return;
                // }
                // if (Game.rooms[creep.memory.targetRoomName] == undefined)
                moveToRoom(creep, creep.memory.targetRoomName);
                // else
                // creep.Move(new RoomPosition(25, 25, creep.memory.targetRoomName));
            } else {
                var droppedResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);

                if (creep.memory.power != undefined && creep.memory.power == true) {
                    var powerBanks = creep.room.find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_POWER_BANK);
                    if (!powerBanks.length && droppedResource == null) {
                        creep.memory.DIEcountdown = (creep.memory.DIEcountdown || 0) + 1;
                        if (creep.memory.DIEcountdown > 10) {
                            Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource].finished = true;
                            creep.memory.toDIE = true;
                            creep.memory.scav = false;
                            return;
                        }
                    }
                }

                if (creep.pickup(droppedResource) != OK) {
                    creep.Move(droppedResource);
                }
                return;
                // if (creep.memory.currentTarget == null) {

                // var resourceFilledStructs = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                //     filter: (r) => r.store != undefined && r.store.getUsedCapacity()
                // });

                // if (creep.memory.currentTarget == null && resourceFilledStructs)
                //     creep.memory.currentTarget = resourceFilledStructs.id;
                // }

                // if (creep.memory.currentTarget == null && droppedResource)
                //     creep.memory.currentTarget = droppedResource.id
                // if (creep.memory.currentTarget == null && creep.memory.power == undefined)
                //     creep.memory.DIE = true
                // }

                resourceFilledStructs = Game.getObjectById(creep.memory.currentTarget);

                if (resourceFilledStructs == null || resourceFilledStructs.store.getUsedCapacity()) {
                    creep.memory.currentTarget = null;
                }

                if (resourceFilledStructs) {
                    creep.say("f/tomb");
                    for (const resourceType in resourceFilledStructs.store) {
                        if (creep.withdraw(resourceFilledStructs, resourceType) != 0) {
                            creep.Move(resourceFilledStructs);
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
