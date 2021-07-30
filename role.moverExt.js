
function log(str) {
    if (0)
    console.log(str)
}


global.roleMoverExt = {
    name: 'moverExt',
    roleMemory: { memory: {} },
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY,
                CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE,
                MOVE, MOVE, MOVE, MOVE, MOVE,
            ],

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.memory.targetRoomName = "W17S21"

        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName
        }
        if (creep.memory.banking == undefined) {
            creep.memory.banking = false;
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName
        }

        if (creep.memory.banking && creep.store.getUsedCapacity() == 0) {
            creep.memory.banking = false;
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName
            creep.say('m2harvester');
        }
        if (!creep.memory.banking && creep.store.getFreeCapacity() == 0) {
            creep.memory.banking = true;
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName
            creep.say('m2storage');
        }

        if (creep.room.name != creep.memory.fakeBaseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.fakeBaseRoomName);
            if (route.length > 0) {
                creep.say('Headin oot');
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffaa00' },
                    maxRooms: 0,
                    ignoreRoads: true,
                    ignoreCreeps: true,
                })
            }
            else {
                creep.say('No route found');
            }
            return
        }

        if (!creep.memory.banking) {    
            var targetCreep = creep.pos.findClosestByRange(
                                    creep.room.find(FIND_MY_CREEPS, {
                                            filter: (creep) => {
                                                return (creep.memory.role == "harvesterExt" && creep.store.getUsedCapacity != 0)
                                            }
                                        })
                                    )
            if (targetCreep != null) {
                if(creep.pos.x == 49)
                    creep.move(7)
                if(creep.pos.y == 49)
                    creep.move(1)
                if(creep.pos.x == 0)
                    creep.move(3)
                if(creep.pos.y == 0)
                    creep.move(5)
                creep.moveTo(targetCreep.pos, { 
                    visualizePathStyle: { stroke: '#ffaa00' },
                    maxRooms: 0,
                    ignoreRoads: true,
                    ignoreCreeps: true,
                })

            }
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE ||
                            structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity() > 0;
                }
            });
            if(targets.length) {
                var target = creep.pos.findClosestByRange(targets)
                if (creep.transfer(target, RESOURCE_ENERGY) != OK) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } })
                }
            }
            else
                creep.say("no eenergy")
        }
    }
};

module.exports = roleMoverExt;