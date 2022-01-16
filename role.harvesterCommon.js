

depositInSupportedContainer = function(creep, source, container) {
    if (container.store.getFreeCapacity() == 0) {
        if (creep.memory.containerFilledTimestamp == undefined) {
            creep.memory.containerFilledTimestamp = Game.time;
        }
        if (Game.time > creep.memory.containerFilledTimestamp + 60 ) {
            if (creep.memory.moverLimitIncreaseCooldownTimestamp == undefined) {
                creep.memory.moverLimitIncreaseCooldownTimestamp = Game.time;
            }
            if (Game.time > creep.memory.moverLimitIncreaseCooldownTimestamp + 10000) {
                Memory.rooms[container.room.name].sources[source.id].container.moversNeeded = Memory.rooms[container.room.name].sources[source.id].container.moversNeeded + 1;
                creep.memory.containerFilledTimestamp = undefined;
                creep.memory.moverLimitIncreaseCooldownTimestamp = Game.time;
            }
        }
    }
    creep.memory.containerFilledTimestamp = undefined;
    if (container != null && container.hits < 200000) {
        Log(creep, `healing ${container}`);
        if (creep.repair(container) != OK) {
            moveToMultiRoomTarget(creep, container);
        }
    } else if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        moveToMultiRoomTarget(creep, container);
        Log(creep, `filling ${container}`);
    }
}