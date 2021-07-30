global.roleTraveller = {
    name: 'traveller',
    roleMemory: { memory: {  } },
    BodyParts: [
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
    ],

    run: function (creep) {
        
        creep.say('🏳️');
        targetRoom = "W17S20"
        
        if (creep.memory.returning && creep.store.getUsedCapacity() == 0) {
            creep.memory.returning = false;
        }
        if (!creep.memory.returning && creep.store.getFreeCapacity() == 0) {
            creep.memory.returning = true;
        }
        
        if (!creep.memory.returning) {
            if (creep.room.name != targetRoom) {
                const route = Game.map.findRoute(creep.room, targetRoom);
                if(route.length > 0) {
                    console.log('Now heading to room '+route[0].room);
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    moveToTarget(creep, exit, true);
                }
            } else {
                var sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_POWER_BANK);
                    }
                });
                if (creep.attack(sources[0]) != OK) {
                    ret = creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } })
                }
            }
        } else {
            if (creep.memory.baseRoomName != targetRoom) {
                const route = Game.map.findRoute(targetRoom, creep.room);
                if(route.length > 0) {
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            } else {
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_STORAGE);
                    }
                });
                if(targets.length) {
                    creep.say('m2storage');
                    for(const resourceType in creep.store) {
                        if (creep.transfer(targets[0], resourceType) != OK) {
                            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffaa00' } })
                        }
                    }
                }
                
            }
        }
    }
};

module.exports = roleTraveller;